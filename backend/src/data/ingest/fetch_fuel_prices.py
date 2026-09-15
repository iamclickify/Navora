import os
import requests
import pandas as pd
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    load_dotenv(project_root / '.env')
    
    api_key = os.getenv('EIA_API_KEY')
    if not api_key:
        logging.warning("EIA_API_KEY is missing in environment variables. Skipping fuel price ingestion gracefully.")
        return
        
    # Using EIA API v2 for Petroleum spot prices
    url = "https://api.eia.gov/v2/petroleum/pri/spt/data/"
    params = {
        'api_key': api_key,
        'frequency': 'daily',
        'data[0]': 'value',
        'facets[series][]': 'RWTC', # WTI Cushing OK Spot Price FOB
        'sort[0][column]': 'period',
        'sort[0][direction]': 'asc',
        'offset': 0,
        'length': 5000
    }
    
    try:
        logging.info("Fetching data from EIA API...")
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        logging.error(f"Failed to fetch from EIA API: {e}")
        return
        
    records = data.get('response', {}).get('data', [])
    if not records:
        logging.error("No data found in EIA API response.")
        return
        
    df = pd.DataFrame(records)
    
    if 'period' not in df.columns or 'value' not in df.columns:
        logging.error("EIA response missing expected columns ('period', 'value').")
        return
        
    df = df.rename(columns={'period': 'date', 'value': 'crude_oil_spot_usd', 'series': 'source_series_id'})
    
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df = df.sort_values('date').reset_index(drop=True)
    
    df = df[['date', 'crude_oil_spot_usd', 'source_series_id']]
    
    processed_dir = project_root / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    out_file = processed_dir / 'fuel_prices.csv'
    df.to_csv(out_file, index=False)
    
    print("\n--- Processing Summary (Fuel Prices) ---")
    print(f"Row count: {len(df)}")
    if not df.empty:
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print("Null counts per column:")
    print(df.isnull().sum().to_string())
    print("----------------------------------------\n")
    logging.info(f"Saved fuel prices to {out_file}")

if __name__ == '__main__':
    main()
