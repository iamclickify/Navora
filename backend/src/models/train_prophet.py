import pandas as pd
import numpy as np
import logging
from pathlib import Path
from prophet import Prophet
from sklearn.metrics import mean_squared_error
import pickle
import itertools
import warnings

# Suppress verbose prophet logs
warnings.filterwarnings('ignore')
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    non_zero = y_true != 0
    if not np.any(non_zero): return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def directional_accuracy(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    # Compute day-to-day diff
    true_diff = np.diff(y_true)
    pred_diff = np.diff(y_pred)
    
    matches = np.sign(true_diff) == np.sign(pred_diff)
    if len(matches) == 0: return np.nan
    return np.mean(matches) * 100

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    model_dir = project_root / 'backend' / 'models'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    data_path = data_dir / 'historical_freight_data.csv'
    
    if not data_path.exists():
        logging.error(f"Missing historical data file at {data_path}.")
        return
        
    df = pd.read_csv(data_path)
    
    # Prophet requires 'ds' and 'y' columns
    df = df.rename(columns={'date': 'ds', 'bdi_index': 'y'})
    df['ds'] = pd.to_datetime(df['ds'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['ds', 'y']).sort_values('ds').reset_index(drop=True)
    
    # 1. Chronological Train/Test Split (80/20) - NO SHUFFLING
    split_idx = int(len(df) * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    
    # 2. Validation Split for Grid Search (using last 20% of training data chronologically)
    val_split_idx = int(len(train_df) * 0.8)
    train_sub = train_df.iloc[:val_split_idx].copy()
    val_sub = train_df.iloc[val_split_idx:].copy()
    
    param_grid = {
        'changepoint_range': [0.8, 0.9],
        'changepoint_prior_scale': [0.01, 0.05, 0.1]
    }
    
    keys, values = zip(*param_grid.items())
    grid_combinations = [dict(zip(keys, v)) for v in itertools.product(*values)]
    
    best_params = {}
    best_rmse = float('inf')
    
    logging.info("Starting chronological grid search on validation set...")
    for params in grid_combinations:
        m = Prophet(yearly_seasonality=True, **params)
        m.fit(train_sub)
        
        future = val_sub[['ds']]
        forecast = m.predict(future)
        
        rmse = np.sqrt(mean_squared_error(val_sub['y'], forecast['yhat']))
        if rmse < best_rmse:
            best_rmse = rmse
            best_params = params
            
    logging.info(f"Best params found: {best_params} (Validation RMSE: {best_rmse:.2f})")
    
    # 3. Train final model on FULL training set
    logging.info("Training final model on full training set with best parameters...")
    final_model = Prophet(yearly_seasonality=True, **best_params)
    final_model.fit(train_df)
    
    # Save model
    model_path = model_dir / 'prophet_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(final_model, f)
        
    # 4. Evaluate on pristine test set
    future_test = test_df[['ds']]
    forecast_test = final_model.predict(future_test)
    
    mape = mean_absolute_percentage_error(test_df['y'], forecast_test['yhat'])
    rmse = np.sqrt(mean_squared_error(test_df['y'], forecast_test['yhat']))
    dir_acc = directional_accuracy(test_df['y'], forecast_test['yhat'])
    
    print("\n=======================================================")
    print("               PROPHET MODEL EVALUATION                ")
    print("=======================================================")
    print(f"Test Set Date Range: {test_df['ds'].min().strftime('%Y-%m-%d')} to {test_df['ds'].max().strftime('%Y-%m-%d')}")
    print(f"MAPE:                   {mape:.2f}%")
    print(f"RMSE:                   {rmse:.2f}")
    print(f"Directional Accuracy:   {dir_acc:.2f}%")
    print("-------------------------------------------------------")
    print("Comparison against baselines (from baseline_report.md):")
    print(" Naive Baseline MAPE:    1.39%")
    print(" 7-Day Moving Avg MAPE:  1.96%")
    print("=======================================================\n")
    
    # Check if Prophet beat naive
    if mape < 1.39:
        print("[SUCCESS] Prophet model beat the naive baseline!")
    else:
        print("[FAILED] Prophet model could not beat the naive baseline (1.39%).")
        
    logging.info(f"Saved Prophet model to {model_path}")

if __name__ == '__main__':
    main()
