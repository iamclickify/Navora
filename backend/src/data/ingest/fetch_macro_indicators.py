import yfinance as yf
import pandas as pd
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    processed_dir = project_root / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    # We use Copper (HG=F) as a leading macroeconomic indicator ("Dr. Copper") 
    # for global industrial demand, which directly impacts freight rates.
    tickers = {
        'copper_usd': 'HG=F'
    }
    
    dfs = []
    
    for name, ticker in tickers.items():
        try:
            logging.info(f"Fetching {name} ({ticker}) from Yahoo Finance...")
            data = yf.download(ticker, start="2020-01-01", progress=False)
            if data.empty:
                logging.warning(f"No data returned for {ticker}")
                continue
            
            # yfinance returns multi-index columns in recent versions, we just want 'Close'
            if isinstance(data.columns, pd.MultiIndex):
                # Flatten or select the specific series
                df = data['Close'].reset_index()
                # If there are multiple tickers downloaded, 'Close' is a DataFrame, otherwise a Series
                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [col[0] if col[0] else col[1] for col in df.columns]
                else:
                    # just rename
                    df.columns = ['date', name]
            else:
                df = data[['Close']].reset_index()
                df.columns = ['date', name]
            
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
            dfs.append(df)
            
        except Exception as e:
            logging.error(f"Failed to fetch {ticker}: {e}")
            
    if not dfs:
        logging.error("No macro indicators fetched.")
        return
        
    # Merge all dataframes on date
    final_df = dfs[0]
    for df in dfs[1:]:
        final_df = pd.merge(final_df, df, on='date', how='outer')
        
    final_df = final_df.sort_values('date').reset_index(drop=True)
    
    # Forward fill missing weekends/holidays up to 5 days
    final_df = final_df.ffill(limit=5)
    final_df = final_df.dropna()
    
    out_file = processed_dir / 'macro_indicators.csv'
    final_df.to_csv(out_file, index=False)
    
    print("\n--- Processing Summary (Macro Indicators) ---")
    print(f"Row count: {len(final_df)}")
    if not final_df.empty:
        print(f"Date range: {final_df['date'].min()} to {final_df['date'].max()}")
    print("Null counts per column:")
    print(final_df.isnull().sum().to_string())
    print("-------------------------------------------\n")
    logging.info(f"Saved macro indicators to {out_file}")

if __name__ == '__main__':
    main()
