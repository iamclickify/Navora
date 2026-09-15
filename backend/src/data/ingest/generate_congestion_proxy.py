import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
    processed_dir = project_root / 'data' / 'processed'
    
    port_specs_file = processed_dir / 'port_specs.csv'
    
    if not port_specs_file.exists():
        logging.warning(f"Validated port_specs.csv not found at {port_specs_file}. Please ensure validate_manual_references.py is run first and manual files are placed.")
        return
        
    try:
        ports_df = pd.read_csv(port_specs_file)
    except Exception as e:
        logging.error(f"Failed to read {port_specs_file}: {e}")
        return
        
    if 'port' not in ports_df.columns or 'cargo_capacity_t' not in ports_df.columns:
        logging.error("port_specs.csv must contain 'port' and 'cargo_capacity_t' columns.")
        return
        
    ports_df['cargo_capacity_t'] = pd.to_numeric(ports_df['cargo_capacity_t'], errors='coerce').fillna(0)
    
    # Base congestion weighted by cargo capacity.
    max_cap = ports_df['cargo_capacity_t'].max()
    if max_cap > 0:
        # Assuming higher capacity ports are busier and naturally have a higher baseline congestion
        ports_df['base_congestion'] = 0.3 + 0.3 * (ports_df['cargo_capacity_t'] / max_cap)
    else:
        ports_df['base_congestion'] = 0.5
        
    # Generate dates for 2 years
    dates = pd.date_range(end=pd.Timestamp.today(), periods=365*2, freq='D')
    
    observations = []
    
    for date in dates:
        month = date.month
        # Seasonal bump Jun-Sep (monsoon season affecting operations)
        is_monsoon = 6 <= month <= 9
        
        for _, row in ports_df.iterrows():
            base = row['base_congestion']
            
            # Add random noise
            noise = np.random.normal(0, 0.1)
            
            # Seasonal bump
            seasonal_bump = 0.15 if is_monsoon else 0.0
            
            # Final congestion score [0, 1]
            score = np.clip(base + noise + seasonal_bump, 0, 1)
            
            # Note: MoPSW FY24-25 cites ~49.5 hr turnaround / ~16.5% idle time.
            # We anchor our wait_hours distribution around this average.
            # If score is ~0.5 on average, 0.5 * 99 ~= 49.5 hours
            wait_hours = max(0.0, np.random.normal(score * 99, 12))
            
            # Average queue length is roughly proportional to wait hours
            queue_len = max(0, int(wait_hours / 10 + np.random.randint(-1, 2)))
            
            observations.append({
                'date': date.strftime('%Y-%m-%d'),
                'port': row['port'],
                'congestion_score': round(score, 4),
                'avg_queue_length_vessels': queue_len,
                'avg_wait_hours': round(wait_hours, 1),
                'is_synthetic': True
            })
            
    df = pd.DataFrame(observations)
    
    out_file = processed_dir / 'port_observations.csv'
    df.to_csv(out_file, index=False)
    
    print("\n--- Processing Summary (Congestion Proxy) ---")
    print(f"Row count: {len(df)}")
    if not df.empty:
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"Avg Wait Hours: {df['avg_wait_hours'].mean():.1f} (Anchored to ~49.5hr per MoPSW FY24-25)")
    print("Null counts per column:")
    print(df.isnull().sum().to_string())
    print("---------------------------------------------\n")
    logging.info(f"Saved synthetic congestion data to {out_file}")

if __name__ == '__main__':
    main()
