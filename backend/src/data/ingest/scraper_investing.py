import pandas as pd
import yfinance as yf
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def get_bdi_proxy():
    logging.info("Fetching Baltic Dry Index proxy via yfinance (BALT)...")
    try:
        ticker = yf.Ticker("BALT")
        hist = ticker.history(period="1d")
        if not hist.empty:
            price = hist['Close'].iloc[-1]
            # BALT trades around $30-40 when BDI is ~1500-2000. Scale factor: ~50x
            bdi_estimate = round(price * 50.0, 2)
            logging.info(f"Successfully fetched BDI Proxy: {bdi_estimate}")
            return bdi_estimate
    except Exception as e:
        logging.error(f"Failed to fetch BDI proxy: {e}")
    return None

def get_fuel_price():
    logging.info("Fetching Crude Oil WTI via FRED (St. Louis Fed)...")
    import requests
    from io import StringIO
    try:
        fred_url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILWTICO"
        response = requests.get(fred_url, timeout=10, verify=False)
        response.raise_for_status()
        
        df = pd.read_csv(StringIO(response.text))
        df.columns = ['date', 'wti']
        df['wti'] = pd.to_numeric(df['wti'], errors='coerce')
        df = df.dropna()
        if not df.empty:
            price = df['wti'].iloc[-1]
            bunker_proxy = round(price * 7.33, 2)
            logging.info(f"Successfully fetched Fuel Proxy (WTI): {bunker_proxy}")
            return bunker_proxy
    except Exception as e:
        logging.error(f"Failed to fetch Fuel price from FRED: {e}")
    return None

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    processed_dir = project_root / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    bdi_price = get_bdi_proxy()
    fuel_price = get_fuel_price()
        
    if bdi_price is None or fuel_price is None:
        logging.error("Failed to fetch one or more items. Aborting save.")
        return
        
    out_file = processed_dir / 'daily_scraped_rates.csv'
    
    today_str = datetime.now().strftime('%Y-%m-%d')
    new_data = pd.DataFrame([{
        'date': today_str,
        'bdi_index': bdi_price,
        'fuel_usd_proxy': fuel_price
    }])
    
    if out_file.exists():
        df_existing = pd.read_csv(out_file)
        df_existing = df_existing[df_existing['date'] != today_str]
        df_final = pd.concat([df_existing, new_data], ignore_index=True)
    else:
        df_final = new_data
        
    df_final.to_csv(out_file, index=False)
    logging.info(f"Saved latest scraped data to {out_file}")

if __name__ == '__main__':
    main()
