import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    # Paths
    # Using the root data directory as requested
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_path = project_root / 'data' / 'historical_freight_data.csv'
    
    # The models directory inside the backend folder
    model_dir = Path(__file__).resolve().parent.parent.parent / 'models'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    if not data_path.exists():
        logging.error(f"Data file missing at {data_path}")
        return
        
    logging.info(f"Loading data from {data_path}")
    df = pd.read_csv(data_path)
    
    # Preprocessing
    # Assuming format DD-MM-YYYY based on the sample preview
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date')
    
    # Feature Engineering
    df['month'] = df['date'].dt.month
    df['dayofweek'] = df['date'].dt.dayofweek
    df['bdi_lag_1'] = df['bdi_index'].shift(1)
    df['bdi_roll_7'] = df['bdi_index'].rolling(7).mean()
    
    # Drop rows with NaNs caused by the rolling/shifting
    df = df.dropna()
    
    # Features and Target
    features = [
        'bdi_index', 
        'fuel in usd', 
        'congestion_score', 
        'month', 
        'dayofweek', 
        'bdi_lag_1', 
        'bdi_roll_7'
    ]
    target = 'freight_rate_usd_per_t'
    
    X = df[features]
    y = df[target]
    
    # Train-test split (Chronological split since it's time-series)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    logging.info(f"Training XGBoost model on {len(X_train)} samples, testing on {len(X_test)} samples.")
    
    # Model Training
    model = xgb.XGBRegressor(
        n_estimators=100, 
        learning_rate=0.1, 
        max_depth=5, 
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluation
    preds = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    
    print("\n=================================")
    print("      MODEL EVALUATION           ")
    print("=================================")
    print(f"RMSE: {rmse:.2f} USD/t")
    print(f"MAE:  {mae:.2f} USD/t")
    print(f"R2:   {r2:.4f}")
    print("=================================\n")
    
    # Save model
    model_path = model_dir / 'freight_rate_xgb.joblib'
    joblib.dump(model, model_path)
    logging.info(f"Model saved to {model_path}")

if __name__ == "__main__":
    main()
