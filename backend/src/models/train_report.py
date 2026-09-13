import pandas as pd
import numpy as np
from pathlib import Path
import pickle
import logging
from sklearn.metrics import mean_squared_error
import warnings

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    non_zero = y_true != 0
    if not np.any(non_zero): return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def directional_accuracy(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    true_diff = np.diff(y_true)
    pred_diff = np.diff(y_pred)
    matches = np.sign(true_diff) == np.sign(pred_diff)
    if len(matches) == 0: return np.nan
    return np.mean(matches) * 100

def compute_metrics(y_true, y_pred):
    mape = mean_absolute_percentage_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    dir_acc = directional_accuracy(y_true, y_pred)
    return mape, rmse, dir_acc

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
    
    start_date = test_df['date'].min().strftime('%Y-%m-%d')
    end_date = test_df['date'].max().strftime('%Y-%m-%d')
    
    # 1. Naive Baseline (T-1)
    naive_pred = test_df['bdi_lag_1'].values
    
    # 2. Moving Average Baseline
    ma7_pred = test_df['bdi_roll_mean_7'].values
    
    # 3. Prophet Model
    with open(model_dir / 'prophet_model.pkl', 'rb') as f:
        prophet_model = pickle.load(f)
    prophet_future = pd.DataFrame({'ds': test_df['date']})
    prophet_pred = prophet_model.predict(prophet_future)['yhat'].values
    
    # 4. XGBoost Model
    with open(model_dir / 'xgboost_model.pkl', 'rb') as f:
        xgb_model = pickle.load(f)
    xgb_features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 
                    'bdi_lag_1', 'bdi_lag_7', 'bdi_roll_mean_7', 'bdi_roll_std_7']
    xgb_pred = xgb_model.predict(test_df[xgb_features])
    
    # 5. Ensemble Model
    with open(model_dir / 'ensemble_model.pkl', 'rb') as f:
        ensemble_data = pickle.load(f)
    w = ensemble_data['w']
    ensemble_pred = w * prophet_pred + (1 - w) * xgb_pred
    
    models = {
        "Naive Baseline (T-1)": naive_pred,
        "7-Day Moving Avg Baseline": ma7_pred,
        "Prophet": prophet_pred,
        "XGBoost": xgb_pred,
        f"Ensemble (Prophet {w:.2f} / XGBoost {1-w:.2f})": ensemble_pred
    }
    
    report_lines = [
        "# Model Training Report",
        "",
        f"**Test Set Date Range:** {start_date} to {end_date}",
        "",
        "| Model | MAPE (%) | RMSE | Directional Acc (%) |",
        "|-------|----------|------|---------------------|"
    ]
    
    best_mape = float('inf')
    best_model = ""
    
    for name, pred in models.items():
        mape, rmse, dir_acc = compute_metrics(y_test, pred)
        report_lines.append(f"| {name} | {mape:.2f}% | {rmse:.2f} | {dir_acc:.2f}% |")
        if mape < best_mape:
            best_mape = mape
            best_model = name
            
    report_lines.append("")
    
    # Explicitly state whether <15% MAPE target was met
    target_met = best_mape < 15.0
    report_lines.append("## Target Evaluation")
    report_lines.append(f"**Target:** Achieve < 15.0% MAPE.")
    report_lines.append(f"**Best Model:** {best_model} ({best_mape:.2f}%)")
    
    if target_met:
        report_lines.append("\n**Result:** \u2705 **MET**. The best model successfully achieved a MAPE strictly below the 15% threshold.")
    else:
        report_lines.append("\n**Result:** \u274c **NOT MET**. The best model failed to achieve a MAPE below the 15% threshold.")
        
    report_path = model_dir / 'training_report.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    logging.info(f"Report successfully saved to {report_path}")

if __name__ == '__main__':
    main()
