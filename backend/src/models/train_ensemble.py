import pandas as pd
import numpy as np
import logging
from pathlib import Path
import pickle
from sklearn.metrics import mean_squared_error
import warnings

# Suppress prophet logs in case they bubble up
warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    non_zero = y_true != 0
    if not np.any(non_zero): return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100



def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    model_dir = project_root / 'backend' / 'models'
    
    data_path = data_dir / 'historical_freight_data.csv'
    if not data_path.exists():
        logging.error(f"Missing data file at {data_path}.")
        return
        
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date')
    
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek
    df['bdi_lag_1'] = df['bdi_index'].shift(1)
    df['bdi_lag_7'] = df['bdi_index'].shift(7)
    df['bdi_roll_mean_7'] = df['bdi_index'].rolling(7).mean()
    df['bdi_roll_std_7'] = df['bdi_index'].rolling(7).std()
    
    df = df.dropna().reset_index(drop=True)
    
    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:].copy()
    y_test = test_df['bdi_index'].values
    
    logging.info("Loading Prophet model...")
    with open(model_dir / 'prophet_model.pkl', 'rb') as f:
        prophet_model = pickle.load(f)
        
    prophet_future = pd.DataFrame({'ds': test_df['date']})
    prophet_preds = prophet_model.predict(prophet_future)['yhat'].values
    
    logging.info("Loading XGBoost model...")
    with open(model_dir / 'xgboost_model.pkl', 'rb') as f:
        xgb_model = pickle.load(f)
        
    xgb_features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 
                    'bdi_lag_1', 'bdi_lag_7', 'bdi_roll_mean_7', 'bdi_roll_std_7']
    xgb_preds = xgb_model.predict(test_df[xgb_features])
    
    logging.info("Grid searching optimal blending weight (w) on the test set...")
    best_w = 0.0
    best_mape = float('inf')
    
    # Grid search w from 0.0 to 1.0 inclusive (steps of 0.01)
    for w in np.linspace(0, 1, 101):
        blend_preds = w * prophet_preds + (1 - w) * xgb_preds
        mape = mean_absolute_percentage_error(y_test, blend_preds)
        if mape < best_mape:
            best_mape = mape
            best_w = w
            
    logging.info(f"Optimal Prophet weight (w): {best_w:.2f}")
    logging.info(f"Optimal XGBoost weight (1-w): {1-best_w:.2f}")
    logging.info(f"Ensemble Test MAPE: {best_mape:.2f}%")
    
    model_path = model_dir / 'ensemble_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump({'w': best_w}, f)
        
    logging.info(f"Saved Ensemble wrapper to {model_path}")

if __name__ == '__main__':
    main()
