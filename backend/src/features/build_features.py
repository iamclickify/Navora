import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def load_data(processed_dir):
    data = {}
    files = {
        'freight': 'freight_rates.csv',
        'fuel': 'fuel_prices.csv',
        'commodity': 'commodity_prices.csv',
        'weather': 'weather.csv',
        'port_obs': 'port_observations.csv'
    }
    
    for key, filename in files.items():
        filepath = processed_dir / filename
        if filepath.exists():
            try:
                data[key] = pd.read_csv(filepath)
                logging.info(f"Loaded {filename}")
            except Exception as e:
                logging.error(f"Error reading {filename}: {e}")
                data[key] = None
        else:
            logging.warning(f"File {filename} not found in {processed_dir}. Features relying on it will be missing.")
            data[key] = None
            
    return data

def main():
    # __file__ is backend/src/features/build_features.py
    # .parent (features) -> .parent (src) -> .parent (backend)
    project_root = Path(__file__).resolve().parent.parent.parent
    processed_dir = project_root / 'data' / 'processed'
    
    logging.info("Starting feature engineering...")
    data = load_data(processed_dir)
    
    # 1. Process Freight Rates (Global)
    df_freight = data['freight']
    if df_freight is not None and not df_freight.empty:
        df_freight['date'] = pd.to_datetime(df_freight['date'])
        df_freight = df_freight.sort_values('date').set_index('date')
        
        # Engineer Lags and Rolling features on 'bdi' (Baltic Dry Index as primary freight rate proxy)
        if 'bdi' in df_freight.columns:
            for lag in [1, 7, 14, 30]:
                df_freight[f'bdi_lag_{lag}'] = df_freight['bdi'].shift(lag)
                
            df_freight['bdi_roll_mean_7'] = df_freight['bdi'].rolling(7).mean()
            df_freight['bdi_roll_std_7'] = df_freight['bdi'].rolling(7).std()
            df_freight['bdi_roll_mean_30'] = df_freight['bdi'].rolling(30).mean()
            df_freight['bdi_roll_std_30'] = df_freight['bdi'].rolling(30).std()
            
        # Optional: Generate simple rolling stats for sub-indices if they exist
        if 'capesize_index' in df_freight.columns:
            df_freight['capesize_lag_1'] = df_freight['capesize_index'].shift(1)
        if 'panamax_index' in df_freight.columns:
            df_freight['panamax_lag_1'] = df_freight['panamax_index'].shift(1)
            
        df_freight = df_freight.reset_index()
    else:
        df_freight = pd.DataFrame(columns=['date'])
        
    # 2. Process Fuel Prices (Global)
    df_fuel = data['fuel']
    if df_fuel is not None and not df_fuel.empty:
        df_fuel['date'] = pd.to_datetime(df_fuel['date'])
        df_fuel = df_fuel.sort_values('date')
    else:
        df_fuel = pd.DataFrame(columns=['date'])
        
    # 3. Process Commodity Prices (Global, Monthly to Daily interpolation)
    df_comm = data['commodity']
    if df_comm is not None and not df_comm.empty:
        # Pivot from long to wide
        df_comm_wide = df_comm.pivot(index='date', columns='commodity', values='price_usd').reset_index()
        # Convert YYYY-MM to datetime (assuming 1st of the month)
        df_comm_wide['date'] = pd.to_datetime(df_comm_wide['date'] + '-01')
        df_comm_wide = df_comm_wide.sort_values('date')
    else:
        df_comm_wide = pd.DataFrame(columns=['date'])
        
    # 4. Port-level Base Grid (Weather + Port Observations)
    df_weather = data['weather']
    if df_weather is not None and not df_weather.empty:
        df_weather['date'] = pd.to_datetime(df_weather['date'])
    else:
        df_weather = pd.DataFrame(columns=['date', 'port'])
        
    df_port = data['port_obs']
    if df_port is not None and not df_port.empty:
        df_port['date'] = pd.to_datetime(df_port['date'])
    else:
        df_port = pd.DataFrame(columns=['date', 'port'])
        
    # Merge port and weather on date, port
    df_base = pd.merge(df_port, df_weather, on=['date', 'port'], how='outer')
    
    if df_base.empty:
        # Fallback to just freight dates if no port data exists
        logging.warning("No port-level data found. Building global-only features.")
        df_base = df_freight[['date']].copy()
        df_base['port'] = 'GLOBAL'
        
    # 5. Join Global features to the Base Grid
    df_features = pd.merge(df_base, df_freight, on='date', how='left')
    
    # Merge Fuel (nearest backward fill)
    if not df_fuel.empty:
        df_features = df_features.sort_values('date')
        df_features = pd.merge_asof(
            df_features, 
            df_fuel[['date', 'crude_oil_spot_usd']], 
            on='date', 
            direction='backward'
        )
        
    # Merge Commodity (nearest backward fill)
    if not df_comm_wide.empty:
        df_features = df_features.sort_values('date')
        df_features = pd.merge_asof(
            df_features, 
            df_comm_wide, 
            on='date', 
            direction='backward'
        )
        
    # 6. Calendar Features
    if df_features.empty:
        logging.error("No data available to build features. Exiting gracefully.")
        return
        
    df_features['month'] = df_features['date'].dt.month
    df_features['day_of_week'] = df_features['date'].dt.dayofweek
    df_features['is_monsoon_season'] = df_features['month'].between(6, 9).astype(int)
    
    # 7. Explicit Missing Value Handling
    initial_len = len(df_features)
    
    # Sort by port and date for logical forward-filling of short gaps
    df_features = df_features.sort_values(['port', 'date'])
    
    # Identify numeric columns for ffill
    numeric_cols = df_features.select_dtypes(include=[np.number]).columns.tolist()
    
    # Forward-fill short gaps (e.g., up to 3 days for weekends, holidays) per port
    df_features[numeric_cols] = df_features.groupby('port')[numeric_cols].ffill(limit=3)
    
    # Any remaining NaNs are documented and dropped
    nans_before_drop = df_features.isnull().sum()
    rows_with_nans = df_features.isnull().any(axis=1)
    dropped_count = rows_with_nans.sum()
    
    df_features = df_features.dropna()
    
    # Final cleanup
    df_features['date'] = df_features['date'].dt.strftime('%Y-%m-%d')
    
    out_file = processed_dir / 'model_features.csv'
    df_features.to_csv(out_file, index=False)
    
    # 8. Print Feature-Completeness Report
    print("\n=======================================================")
    print("             FEATURE COMPLETENESS REPORT")
    print("=======================================================")
    print(f"Total rows before NaN handling: {initial_len}")
    print(f"Rows dropped due to NaNs:       {dropped_count} ({(dropped_count/initial_len*100) if initial_len else 0:.1f}%)")
    print(f"Final model-ready rows:         {len(df_features)}")
    if not df_features.empty:
        print(f"Date Range: {df_features['date'].min()} to {df_features['date'].max()}")
        print(f"Unique Ports: {df_features['port'].nunique()}")
    
    print("\nMissing Values Dropped Per Column (Before Drop):")
    missing_report = nans_before_drop[nans_before_drop > 0]
    if missing_report.empty:
        print("  (No missing values found after short-gap ffill!)")
    else:
        for col, count in missing_report.items():
            print(f"  - {col:<25}: {count} missing")
            
    print("=======================================================\n")
    logging.info(f"Model features saved to {out_file}")

if __name__ == '__main__':
    main()
