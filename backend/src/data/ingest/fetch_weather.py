import pandas as pd
import requests
import logging
import time
import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    ref_dir = project_root / 'data' / 'raw' / 'manual_reference'
    processed_dir = project_root / 'data' / 'processed'
    
    port_specs_file = ref_dir / 'port_specs.csv'
    
    if not port_specs_file.exists():
        logging.warning(f"Port specs file missing at {port_specs_file}. Skipping weather ingestion gracefully.")
        return
        
    try:
        ports_df = pd.read_csv(port_specs_file)
    except Exception as e:
        logging.error(f"Failed to read {port_specs_file}: {e}")
        return
        
    if not {'port', 'latitude', 'longitude'}.issubset(set(ports_df.columns.str.lower())):
        logging.error(f"Port specs must contain columns: port, latitude, longitude. Found: {list(ports_df.columns)}")
        return
        
    ports_df.columns = ports_df.columns.str.lower()
    
    all_weather = []
    
    # We'll pull a recent 30-day window for demonstration
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=30)
    
    for _, row in ports_df.iterrows():
        port_name = row['port']
        lat = row['latitude']
        lon = row['longitude']
        
        logging.info(f"Fetching weather for {port_name} ({lat}, {lon})")
        
        marine_url = "https://marine-api.open-meteo.com/v1/marine"
        marine_params = {
            'latitude': lat,
            'longitude': lon,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'daily': 'wave_height_max',
            'timezone': 'auto'
        }
        
        weather_url = "https://archive-api.open-meteo.com/v1/archive"
        weather_params = {
            'latitude': lat,
            'longitude': lon,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'daily': ['wind_speed_10m_max', 'precipitation_sum'],
            'timezone': 'auto'
        }
        
        try:
            m_resp = requests.get(marine_url, params=marine_params)
            w_resp = requests.get(weather_url, params=weather_params)
            
            m_resp.raise_for_status()
            w_resp.raise_for_status()
            
            m_data = m_resp.json()
            w_data = w_resp.json()
            
            m_daily = m_data.get('daily', {})
            w_daily = w_data.get('daily', {})
            
            dates = m_daily.get('time', [])
            wave_heights = m_daily.get('wave_height_max', [None]*len(dates))
            
            w_dates = w_daily.get('time', [])
            wind_speeds = w_daily.get('wind_speed_10m_max', [None]*len(w_dates))
            precip = w_daily.get('precipitation_sum', [None]*len(w_dates))
            
            # Simple dict matching by date to ensure alignment
            wave_dict = dict(zip(dates, wave_heights))
            wind_dict = dict(zip(w_dates, wind_speeds))
            precip_dict = dict(zip(w_dates, precip))
            
            all_dates = sorted(list(set(dates) | set(w_dates)))
            
            for d in all_dates:
                all_weather.append({
                    'date': d,
                    'port': port_name,
                    'wind_speed_kmh': wind_dict.get(d),
                    'wave_height_m': wave_dict.get(d),
                    'precipitation_mm': precip_dict.get(d)
                })
        except Exception as e:
            logging.error(f"Failed fetching data for {port_name}: {e}")
            
        time.sleep(0.5) # Polite sleep for public API
        
    if not all_weather:
        logging.warning("No weather data collected.")
        return
        
    df = pd.DataFrame(all_weather)
    
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df = df.sort_values(['date', 'port']).reset_index(drop=True)
    
    processed_dir.mkdir(parents=True, exist_ok=True)
    out_file = processed_dir / 'weather.csv'
    df.to_csv(out_file, index=False)
    
    print("\n--- Processing Summary (Weather) ---")
    print(f"Row count: {len(df)}")
    if not df.empty:
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print("Null counts per column:")
    print(df.isnull().sum().to_string())
    print("------------------------------------\n")
    logging.info(f"Saved weather data to {out_file}")

if __name__ == '__main__':
    main()
