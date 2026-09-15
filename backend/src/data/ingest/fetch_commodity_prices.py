import os
import glob
import pandas as pd
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    raw_dir = project_root / 'data' / 'raw' / 'worldbank_commodities'
    processed_dir = project_root / 'data' / 'processed'
    
    excel_files = list(raw_dir.glob('*.xlsx')) + list(raw_dir.glob('*.xls')) if raw_dir.exists() else []
    
    if not excel_files:
        logging.warning(f"No World Bank Excel file found in {raw_dir}. Skipping commodity price ingestion gracefully.")
        return
        
    input_file = excel_files[0]
    logging.info(f"Processing World Bank commodities file: {input_file}")
    
    try:
        # Generic read: try finding 'Monthly Prices' sheet and skipping metadata headers
        # We will assume row 4 contains the headers ('1960M01' style in the first column is typical)
        df = pd.read_excel(input_file, sheet_name='Monthly Prices', skiprows=4)
    except Exception as e:
        # Fallback to default sheet if 'Monthly Prices' doesn't exist
        try:
            df = pd.read_excel(input_file, skiprows=4)
        except Exception as e2:
            logging.error(f"Failed to read {input_file}: {e2}")
            return
        
    # Rename the first column to 'date_raw'
    df.rename(columns={df.columns[0]: 'date_raw'}, inplace=True)
    
    df = df.dropna(subset=['date_raw'])
    
    # Filter rows that actually look like World Bank monthly dates (YYYYMmm)
    df = df[df['date_raw'].astype(str).str.contains(r'^\d{4}M\d{2}$', na=False)]
    
    # Reshape wide-to-long
    id_vars = ['date_raw']
    df_long = pd.melt(df, id_vars=id_vars, var_name='commodity', value_name='price_usd')
    
    # Clean up commodity strings
    df_long['commodity'] = df_long['commodity'].astype(str).str.replace('\n', ' ').str.strip()
    df_long['price_usd'] = pd.to_numeric(df_long['price_usd'], errors='coerce')
    df_long = df_long.dropna(subset=['price_usd'])
    
    # Convert date to YYYY-MM
    df_long['date'] = df_long['date_raw'].str.replace('M', '-')
    
    df_long = df_long[['date', 'commodity', 'price_usd']]
    df_long = df_long.sort_values(['date', 'commodity']).reset_index(drop=True)
    
    processed_dir.mkdir(parents=True, exist_ok=True)
    out_file = processed_dir / 'commodity_prices.csv'
    df_long.to_csv(out_file, index=False)
    
    print("\n--- Processing Summary (Commodity Prices) ---")
    print(f"Row count: {len(df_long)}")
    if not df_long.empty:
        print(f"Date range: {df_long['date'].min()} to {df_long['date'].max()}")
    print("Null counts per column:")
    print(df_long.isnull().sum().to_string())
    print("---------------------------------------------\n")
    logging.info(f"Saved commodity prices to {out_file}")

if __name__ == '__main__':
    main()
