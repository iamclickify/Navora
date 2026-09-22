import pandas as pd
import numpy as np
import logging
from pathlib import Path
from prophet import Prophet
import pickle
import warnings

warnings.filterwarnings('ignore')
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    model_dir = project_root / 'backend' / 'models'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    data_path = data_dir / 'historical_freight_data.csv'
    if not data_path.exists():
        logging.error(f"Missing data at {data_path}")
        return
        
    df = pd.read_csv(data_path)
    df = df.rename(columns={'date': 'ds', 'bdi_index': 'y'})
    df['ds'] = pd.to_datetime(df['ds'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['ds', 'y']).sort_values('ds').reset_index(drop=True)
    
    logging.info(f"Training Prophet on full dataset: {len(df)} rows ({df['ds'].min().strftime('%Y-%m-%d')} to {df['ds'].max().strftime('%Y-%m-%d')})...")
    
    # Train Prophet with seasonal agility and recent changepoint flexibility
    model = Prophet(
        growth='linear',
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.10,
        changepoint_range=0.92,
        interval_width=0.95
    )
    model.fit(df[['ds', 'y']])
    
    # Save model
    model_path = model_dir / 'prophet_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    logging.info(f"Saved Prophet model to {model_path}")
    
    # Test forecast for next 30 days
    future = model.make_future_dataframe(periods=30, freq='D')
    fcst = model.predict(future).tail(30)
    print("\nNext 30-Day Prophet Predictions:")
    print(fcst[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].head(5))
    print(f"Prophet Forecast Range: Min={fcst['yhat'].min():.1f}, Max={fcst['yhat'].max():.1f}, Spread={fcst['yhat'].max() - fcst['yhat'].min():.1f}")

if __name__ == '__main__':
    main()
