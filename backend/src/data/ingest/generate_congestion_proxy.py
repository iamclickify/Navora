import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    data_dir = project_root / 'data'
    processed_dir = data_dir / 'processed'
    
    port_specs_file = processed_dir / 'port_specs.csv'
    weather_file = data_dir / 'all_ports_historical_weather.csv'
    
    if not port_specs_file.exists():
        logging.warning(f"Validated port_specs.csv not found. Exiting.")
        return
        
    try:
        ports_df = pd.read_csv(port_specs_file)
    except Exception as e:
        logging.error(f"Failed to read port specs: {e}")
        return
        
    ports_df['cargo_capacity_t'] = pd.to_numeric(ports_df['cargo_capacity_t'], errors='coerce').fillna(0)
    max_cap = ports_df['cargo_capacity_t'].max()
    ports_df['base_congestion'] = 0.3 + 0.3 * (ports_df['cargo_capacity_t'] / max_cap) if max_cap > 0 else 0.5
    port_baselines = dict(zip(ports_df['port'], ports_df['base_congestion']))
    
    weather_df = pd.DataFrame()
    if weather_file.exists():
        weather_df = pd.read_csv(weather_file)
        weather_df['date'] = pd.to_datetime(weather_df['date'])
    else:
        logging.warning("No weather data found. Will default to simple seasonal proxy.")
    
    dates = pd.date_range(end=pd.Timestamp.today(), periods=365*2, freq='D')
    observations = []
    
    for date in dates:
        month = date.month
        is_monsoon = 6 <= month <= 9
        
        # Filter weather for this specific date
        daily_weather = pd.DataFrame()
        if not weather_df.empty:
            daily_weather = weather_df[weather_df['date'] == date]
            
        for _, row in ports_df.iterrows():
            port_name = row['port']
            base = port_baselines.get(port_name, 0.5)
            
            wind_speed = 0.0
            precip = 0.0
            
            if not daily_weather.empty:
                port_w = daily_weather[daily_weather['port'] == port_name]
                if not port_w.empty:
                    wind_speed = port_w['wind_speed_max_kmh'].iloc[0]
                    precip = port_w['precipitation_sum_mm'].iloc[0]
            
            # Weather penalty logic: 
            # High winds (> 30 km/h) restrict crane operations and pilotage
            wind_penalty = 0.0
            if wind_speed > 30:
                wind_penalty = min(0.3, (wind_speed - 30) * 0.01)
                
            # Rain stops dry bulk loading (coal, grain)
            rain_penalty = 0.0
            if precip > 10:
                rain_penalty = min(0.2, (precip - 10) * 0.005)
                
            # Seasonal bump
            seasonal_bump = 0.10 if is_monsoon else 0.0
            
            # Add minor random noise (0-5%) to simulate non-weather delays (customs, strikes, equipment breakdown)
            noise = np.random.uniform(0, 0.05)
            
            # Final congestion score [0, 1]
            score = np.clip(base + wind_penalty + rain_penalty + seasonal_bump + noise, 0, 1)
            
            wait_hours = max(0.0, score * 99)
            queue_len = max(0, int(wait_hours / 10 + np.random.randint(-1, 2)))
            
            observations.append({
                'date': date.strftime('%Y-%m-%d'),
                'port': port_name,
                'congestion_score': round(score, 4),
                'avg_queue_length_vessels': queue_len,
                'avg_wait_hours': round(wait_hours, 1),
                'is_synthetic': True,
                'proxy_source': 'Weather-Correlated Engine'
            })
            
    df = pd.DataFrame(observations)
    
    out_file = processed_dir / 'port_observations.csv'
    df.to_csv(out_file, index=False)
    
    print("\n--- Weather-Correlated Congestion Engine ---")
    print(f"Row count: {len(df)}")
    if not df.empty:
        print(f"Avg Wait Hours: {df['avg_wait_hours'].mean():.1f}")
        print(f"Max Wait Hours: {df['avg_wait_hours'].max():.1f} (Storm simulation)")
    print("--------------------------------------------\n")
    logging.info(f"Saved weather-driven congestion data to {out_file}")

if __name__ == '__main__':
    main()
