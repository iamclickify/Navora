import pandas as pd
import numpy as np
import logging
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import TimeSeriesSplit, ParameterGrid
import warnings

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def mape(y_true, y_pred):
    non_zero = y_true != 0
    if not np.any(non_zero): return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def run_experiment(df, features, target, use_log_target=False, clip_congestion=False):
    df = df.copy()
    if clip_congestion:
        p95 = df['congestion_score'].quantile(0.95)
        df['congestion_score'] = df['congestion_score'].clip(upper=p95)
        
    X = df[features]
    y = df[target]
    
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx].copy(), X.iloc[split_idx:].copy()
    y_train, y_test = y.iloc[:split_idx].copy(), y.iloc[split_idx:].copy()
    
    if use_log_target:
        y_train = np.log1p(y_train)
        
    tscv = TimeSeriesSplit(n_splits=3)
    # Smaller grid for speed
    param_grid = {'n_estimators': [50, 100], 'max_depth': [3, 5], 'learning_rate': [0.05, 0.1]}
    grid = ParameterGrid(param_grid)
    
    best_params = {}
    best_score = float('inf')
    
    for params in grid:
        fold_scores = []
        for train_index, val_index in tscv.split(X_train):
            X_fold_train, X_fold_val = X_train.iloc[train_index], X_train.iloc[val_index]
            y_fold_train, y_fold_val = y_train.iloc[train_index], y_train.iloc[val_index]
            
            model = XGBRegressor(**params, random_state=42, objective='reg:squarederror')
            model.fit(X_fold_train, y_fold_train)
            preds = model.predict(X_fold_val)
            
            if use_log_target:
                preds = np.expm1(preds)
                true_val = np.expm1(y_fold_val)
            else:
                true_val = y_fold_val
                
            rmse = np.sqrt(mean_squared_error(true_val, preds))
            fold_scores.append(rmse)
            
        avg_score = np.mean(fold_scores)
        if avg_score < best_score:
            best_score = avg_score
            best_params = params
            
    final_model = XGBRegressor(**best_params, random_state=42, objective='reg:squarederror')
    final_model.fit(X_train, y_train)
    preds_test = final_model.predict(X_test)
    
    if use_log_target:
        preds_test = np.expm1(preds_test)
        
    test_mape = mape(y_test, preds_test)
    return test_mape, best_params

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    data_path = data_dir / 'historical_freight_data.csv'
    
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date')
    
    # Base features
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek
    df['bdi_lag_1'] = df['bdi_index'].shift(1)
    df['bdi_lag_7'] = df['bdi_index'].shift(7)
    df['bdi_roll_mean_7'] = df['bdi_index'].rolling(7).mean()
    df['bdi_roll_std_7'] = df['bdi_index'].rolling(7).std()
    
    # New Multi-Horizon features
    df['bdi_roll_mean_3'] = df['bdi_index'].rolling(3).mean()
    df['bdi_roll_std_3'] = df['bdi_index'].rolling(3).std()
    df['bdi_roll_mean_14'] = df['bdi_index'].rolling(14).mean()
    df['bdi_roll_std_14'] = df['bdi_index'].rolling(14).std()
    
    df = df.dropna().reset_index(drop=True)
    
    base_features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 'bdi_lag_1', 'bdi_lag_7', 'bdi_roll_mean_7', 'bdi_roll_std_7']
    new_features = base_features + ['bdi_roll_mean_3', 'bdi_roll_std_3', 'bdi_roll_mean_14', 'bdi_roll_std_14']
    
    results = []
    
    logging.info("Running Baseline XGBoost (for comparison base)")
    base_mape, _ = run_experiment(df, base_features, 'bdi_index')
    
    logging.info("Running Iteration 1: Multi-Horizon Features")
    it1_mape, _ = run_experiment(df, new_features, 'bdi_index')
    results.append(("- **Iteration 1 (Multi-Horizon Rolling Features):** Added 3-day and 14-day rolling mean/std.", it1_mape))
    
    logging.info("Running Iteration 2: Log Transformation")
    it2_mape, _ = run_experiment(df, new_features, 'bdi_index', use_log_target=True)
    results.append(("- **Iteration 2 (Log Transformation):** Applied log1p to target and expm1 to predictions (stacked on Iteration 1).", it2_mape))
    
    logging.info("Running Iteration 3: Clipping Outliers")
    it3_mape, _ = run_experiment(df, new_features, 'bdi_index', use_log_target=True, clip_congestion=True)
    results.append(("- **Iteration 3 (Clipping Congestion Outliers):** Capped `congestion_score` at 95th percentile during training (stacked on Iteration 2).", it3_mape))
    
    report_lines = [
        "",
        "## Iteration Log (Model Improvements)",
        f"**Starting Baseline XGBoost MAPE:** {base_mape:.2f}%",
        ""
    ]
    
    prev_mape = base_mape
    for desc, m in results:
        diff = m - prev_mape
        status = "\u2705 Improved" if diff < 0 else "\u274c Worsened/No Change"
        report_lines.append(desc)
        report_lines.append(f"  - Result: {m:.2f}% MAPE ({status} by {abs(diff):.2f}%)")
        prev_mape = m
        
    report_path = project_root / 'backend' / 'models' / 'training_report.md'
    with open(report_path, 'a', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    logging.info(f"Successfully appended iteration log to {report_path}")

if __name__ == '__main__':
    main()
