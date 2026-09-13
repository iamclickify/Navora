import os
import glob
import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    # Resolve paths relative to this script
    # This script is at backend/src/data/ingest/fetch_freight_rates.py
    # Project root is backend/
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    raw_dir = project_root / 'data' / 'raw' / 'bdi'
    processed_dir = project_root / 'data' / 'processed'
    
    # 1. Check for existing CSV
    csv_files = list(raw_dir.glob('*.csv')) if raw_dir.exists() else []
    
    if not csv_files:
        logging.error(f"Missing file: No Baltic Dry Index CSV found in {raw_dir}. Exiting gracefully.")
        return

    input_file = csv_files[0]
    logging.info(f"Found input file: {input_file}")
    
    try:
        df = pd.read_csv(input_file)
    except Exception as e:
        logging.error(f"Failed to read {input_file}: {e}")
        return
        
    # Standardize columns to lower case for easier matching
    df.columns = [col.lower().strip() for col in df.columns]
    
    # Map columns to required names
    col_mapping = {
        'date': 'date',
        'bdi': 'bdi',
        'baltic dry index': 'bdi',
        'capesize': 'capesize_index',
        'capesize index': 'capesize_index',
        'panamax': 'panamax_index',
        'panamax index': 'panamax_index',
        'supramax': 'supramax_index',
        'supramax index': 'supramax_index',
    }
    df = df.rename(columns=col_mapping)
    
    # Ensure all required columns exist, set as null if missing
    for col in ['capesize_index', 'panamax_index', 'supramax_index']:
        if col not in df.columns:
            df[col] = np.nan
            
    if 'date' not in df.columns or 'bdi' not in df.columns:
        logging.error("The CSV must contain at least 'date' and 'bdi' columns. Exiting.")
        return
        
    # 2. Parse dates to YYYY-MM-DD
    df['date'] = pd.to_datetime(df['date'])
    
    # 3. Sort ascending
    df = df.sort_values('date').reset_index(drop=True)
    
    # Create complete date range to accurately find calendar gaps
    full_date_range = pd.date_range(start=df['date'].min(), end=df['date'].max(), freq='D')
    df = df.set_index('date')
    df = df.reindex(full_date_range)
    df.index.name = 'date'
    
    # Find gaps based on missing 'bdi'
    is_missing = df['bdi'].isna()
    
    # Calculate sizes of consecutive missing blocks
    gap_groups = is_missing.ne(is_missing.shift()).cumsum()
    gap_sizes = is_missing.groupby(gap_groups).transform('sum')
    
    # 4. Flag any gap longer than 5 days
    # We flag the dates that are part of a missing chunk > 5 days
    df['gap_gt_5d_flag'] = (gap_sizes > 5) & is_missing
    
    # 5. Forward-fill gaps of 1-2 days
    # ffill limit=2 will only fill up to 2 consecutive missing values
    df['bdi'] = df['bdi'].ffill(limit=2)
    df['capesize_index'] = df['capesize_index'].ffill(limit=2)
    df['panamax_index'] = df['panamax_index'].ffill(limit=2)
    df['supramax_index'] = df['supramax_index'].ffill(limit=2)
    
    # 6. Flag outlier spikes (e.g., > 30% daily change in BDI)
    pct_change = df['bdi'].pct_change().abs()
    df['outlier_spike_flag'] = pct_change > 0.30
    
    # Prepare final output format
    df_final = df.reset_index()
    df_final['date'] = df_final['date'].dt.strftime('%Y-%m-%d')
    
    cols = ['date', 'bdi', 'capesize_index', 'panamax_index', 'supramax_index', 'gap_gt_5d_flag', 'outlier_spike_flag']
    df_final = df_final[cols]
    
    # Drop rows that were inserted during reindex but not filled or flagged, 
    # to avoid unnecessarily inflating the dataframe with weekend NaNs that don't matter,
    # except we must keep flagged gaps per requirements.
    # So we keep rows where BDI is not null OR gap_gt_5d_flag is True
    mask_to_keep = df_final['bdi'].notna() | df_final['gap_gt_5d_flag']
    df_final = df_final[mask_to_keep].reset_index(drop=True)
    
    # Output to processed
    processed_dir.mkdir(parents=True, exist_ok=True)
    out_file = processed_dir / 'freight_rates.csv'
    df_final.to_csv(out_file, index=False)
    
    # 7. Print a summary
    print("\n--- Processing Summary ---")
    print(f"Row count: {len(df_final)}")
    print(f"Date range: {df_final['date'].min()} to {df_final['date'].max()}")
    print("Null counts per column:")
    print(df_final.isnull().sum().to_string())
    print("--------------------------\n")
    logging.info(f"Successfully processed and saved to {out_file}")

if __name__ == '__main__':
    main()
