import pandas as pd
import numpy as np
import logging
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.model_selection import TimeSeriesSplit, ParameterGrid
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error
import pickle
import matplotlib.pyplot as plt
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

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    model_dir = project_root / 'backend' / 'models'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # We use historical_freight_data.csv to source the features since it is populated
    data_path = data_dir / 'historical_freight_data.csv'
    
    if not data_path.exists():
        logging.error(f"Missing historical data file at {data_path}.")
        return
        
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date')
    
    # Re-create engineered features dynamically to ensure completeness
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek
    df['bdi_lag_1'] = df['bdi_index'].shift(1)
    df['bdi_lag_3'] = df['bdi_index'].shift(3)
    df['bdi_lag_7'] = df['bdi_index'].shift(7)
    df['bdi_lag_14'] = df['bdi_index'].shift(14)
    df['bdi_lag_30'] = df['bdi_index'].shift(30)
    df['bdi_roll_mean_7'] = df['bdi_index'].rolling(7).mean()
    df['bdi_roll_std_7'] = df['bdi_index'].rolling(7).std()
    df['bdi_roll_mean_14'] = df['bdi_index'].rolling(14).mean()
    df['bdi_roll_std_14'] = df['bdi_index'].rolling(14).std()
    df['bdi_roll_std_14'] = df['bdi_index'].rolling(14).std()
    df['bdi_roll_mean_30'] = df['bdi_index'].rolling(30).mean()
    df['bdi_roll_std_30'] = df['bdi_index'].rolling(30).std()
    
    # Merge capesize and panamax from processed/freight_rates.csv
    rates_path = data_dir / 'processed' / 'freight_rates.csv'
    if rates_path.exists():
        rates_df = pd.read_csv(rates_path)
        rates_df['date'] = pd.to_datetime(rates_df['date'])
        df = pd.merge(df, rates_df[['date', 'capesize_index', 'panamax_index']], on='date', how='left')
        df['capesize_index'] = df['capesize_index'].ffill().bfill()
        df['panamax_index'] = df['panamax_index'].ffill().bfill()
        df['capesize_lag_1'] = df['capesize_index'].shift(1)
        df['panamax_lag_1'] = df['panamax_index'].shift(1)
    else:
        df['capesize_lag_1'] = df['bdi_lag_1'] * 1.5
        df['panamax_lag_1'] = df['bdi_lag_1'] * 0.8
    
    weather_path = data_dir / 'all_ports_historical_weather.csv'
    if weather_path.exists():
        w_df = pd.read_csv(weather_path)
        w_df['date'] = pd.to_datetime(w_df['date'])
        # Average weather across all ports for the macro model
        w_agg = w_df.groupby('date').agg({
            'wind_speed_max_kmh': 'mean',
            'precipitation_sum_mm': 'mean'
        }).reset_index()
        df = pd.merge(df, w_agg, on='date', how='left')
        # Fill any missing weather with rolling median or 0
        df['wind_speed_max_kmh'] = df['wind_speed_max_kmh'].fillna(df['wind_speed_max_kmh'].rolling(7, min_periods=1).median()).fillna(0)
        df['precipitation_sum_mm'] = df['precipitation_sum_mm'].fillna(0)
    else:
        df['wind_speed_max_kmh'] = 0.0
        df['precipitation_sum_mm'] = 0.0
        
    macro_path = data_dir / 'processed' / 'macro_indicators.csv'
    if macro_path.exists():
        macro_df = pd.read_csv(macro_path)
        macro_df['date'] = pd.to_datetime(macro_df['date'])
        df = pd.merge(df, macro_df, on='date', how='left')
        df['copper_usd'] = df['copper_usd'].ffill().bfill()
    else:
        df['copper_usd'] = 0.0
        
    # Create target array for 30-day horizon
    horizon = 30
    target_cols = []
    for h in range(1, horizon + 1):
        col = f'target_h{h}'
        df[col] = df['bdi_index'].shift(-h)
        target_cols.append(col)
    
    # Drop NaNs resulting from shifts and rolling windows
    df = df.dropna().reset_index(drop=True)
    
    # Define features and target
    features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 
                'bdi_lag_1', 'bdi_lag_3', 'bdi_lag_7', 'bdi_lag_14', 'bdi_lag_30', 
                'bdi_roll_mean_7', 'bdi_roll_std_7', 'bdi_roll_mean_14', 'bdi_roll_std_14',
                'bdi_roll_mean_30', 'bdi_roll_std_30',
                'wind_speed_max_kmh', 'precipitation_sum_mm', 'copper_usd',
                'capesize_lag_1', 'panamax_lag_1']
    
    X = df[features]
    y = df[target_cols]
    
    # 1. Chronological Split (80/20) - NO SHUFFLING
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx].copy(), X.iloc[split_idx:].copy()
    y_train, y_test = y.iloc[:split_idx].copy(), y.iloc[split_idx:].copy()
    test_dates = df['date'].iloc[split_idx:]
    
    # 2. Walk-Forward Cross Validation (TimeSeriesSplit)
    tscv = TimeSeriesSplit(n_splits=3)
    
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.05, 0.1]
    }
    
    grid = ParameterGrid(param_grid)
    best_params = {}
    best_score = float('inf')
    
    logging.info("Starting Walk-Forward Cross-Validation grid search...")
    for params in grid:
        fold_scores = []
        for train_index, val_index in tscv.split(X_train):
            X_fold_train, X_fold_val = X_train.iloc[train_index], X_train.iloc[val_index]
            y_fold_train, y_fold_val = y_train.iloc[train_index], y_train.iloc[val_index]
            
            base_model = XGBRegressor(**params, random_state=42, objective='reg:squarederror')
            model = MultiOutputRegressor(base_model)
            model.fit(X_fold_train, y_fold_train)
            preds = model.predict(X_fold_val)
            
            rmse = np.sqrt(mean_squared_error(y_fold_val, preds))
            fold_scores.append(rmse)
            
        avg_score = np.mean(fold_scores)
        if avg_score < best_score:
            best_score = avg_score
            best_params = params
            
    logging.info(f"Best parameters from TimeSeriesSplit: {best_params} (Val RMSE: {best_score:.2f})")
    
    # 3. Train final model on full train set
    logging.info("Training final XGBoost model (MultiOutput)...")
    base_final = XGBRegressor(**best_params, random_state=42, objective='reg:squarederror')
    final_model = MultiOutputRegressor(base_final)
    final_model.fit(X_train, y_train)
    
    # Save model
    model_path = model_dir / 'xgboost_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(final_model, f)
        
    # 4. Feature Importance Plot
    plt.figure(figsize=(10, 6))
    importances = np.mean([est.feature_importances_ for est in final_model.estimators_], axis=0)
    indices = np.argsort(importances)[::-1]
    plt.title("XGBoost Feature Importances")
    plt.bar(range(X.shape[1]), importances[indices], align="center")
    plt.xticks(range(X.shape[1]), [features[i] for i in indices], rotation=45, ha='right')
    plt.xlim([-1, X.shape[1]])
    plt.tight_layout()
    plot_path = model_dir / 'feature_importance.png'
    plt.savefig(plot_path)
    
    # 5. Evaluate on untouched test set
    preds_test = final_model.predict(X_test)
    
    # Calculate metrics across all horizons
    mape = np.mean([mean_absolute_percentage_error(y_test.iloc[:, i], preds_test[:, i]) for i in range(horizon)])
    rmse = np.mean([np.sqrt(mean_squared_error(y_test.iloc[:, i], preds_test[:, i])) for i in range(horizon)])
    dir_acc = np.mean([directional_accuracy(y_test.iloc[:, i], preds_test[:, i]) for i in range(horizon)])
    
    start_date = test_dates.min().strftime('%Y-%m-%d')
    end_date = test_dates.max().strftime('%Y-%m-%d')
    
    print("\n=======================================================")
    print("               XGBOOST MODEL EVALUATION                ")
    print("=======================================================")
    print(f"Test Set Date Range: {start_date} to {end_date}")
    print(f"MAPE:                   {mape:.2f}%")
    print(f"RMSE:                   {rmse:.2f}")
    print(f"Directional Accuracy:   {dir_acc:.2f}%")
    print("-------------------------------------------------------")
    print("Comparison against prior models:")
    print(" Naive Baseline MAPE:    1.39%")
    print(" 7-Day Moving Avg MAPE:  1.96%")
    print(" Prophet MAPE:           6.96%")
    print("=======================================================\n")
    
    if mape < 1.39:
        print("[SUCCESS] XGBoost beat the naive baseline!")
    else:
        print("[FAILED] XGBoost could not beat the naive baseline (1.39%).")
        
    logging.info(f"Saved XGBoost model to {model_path}")
    logging.info(f"Saved feature importance plot to {plot_path}")

if __name__ == '__main__':
    main()
