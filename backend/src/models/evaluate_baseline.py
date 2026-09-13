import pandas as pd
import numpy as np
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    # Avoid division by zero
    non_zero = y_true != 0
    if not np.any(non_zero):
        return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    model_dir = project_root / 'backend' / 'models'
    model_dir.mkdir(parents=True, exist_ok=True)
    
    features_file = data_dir / 'historical_freight_data.csv'
    
    if not features_file.exists():
        logging.error(f"Missing historical data file at {features_file}.")
        return
        
    df = pd.read_csv(features_file)
    
    # We will use 'bdi_index' as our target proxy for the baseline
    if 'bdi_index' not in df.columns:
        logging.error("'bdi_index' column missing from historical_freight_data.csv. Cannot evaluate baseline.")
        return
    
    df = df.rename(columns={'bdi_index': 'bdi'})
        
    if 'date' not in df.columns:
        logging.error("'date' column missing. Cannot perform chronological split.")
        return
        
    # Chronological Split
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date'])
    # In case there are multiple ports per date, we sort primarily by date
    df = df.sort_values('date').reset_index(drop=True)
    
    split_idx = int(len(df) * 0.8)
    test_df = df.iloc[split_idx:].copy()
    
    if test_df.empty:
        logging.error("Test set is empty. Check data volume.")
        return
        
    # Baseline 1: Naive (Yesterday's value)
    if 'bdi_lag_1' not in test_df.columns:
        test_df['bdi_lag_1'] = test_df['bdi'].shift(1)
        
    # Baseline 2: 7-Day Moving Average
    if 'bdi_roll_mean_7' not in test_df.columns:
        test_df['bdi_roll_mean_7'] = test_df['bdi'].rolling(7).mean()
        
    # Drop NaNs that may occur due to shifting/rolling
    test_df = test_df.dropna(subset=['bdi', 'bdi_lag_1', 'bdi_roll_mean_7'])
    
    if test_df.empty:
        logging.error("Test set is empty after dropping NaNs for baseline computations.")
        return
        
    mape_naive = mean_absolute_percentage_error(test_df['bdi'], test_df['bdi_lag_1'])
    mape_roll7 = mean_absolute_percentage_error(test_df['bdi'], test_df['bdi_roll_mean_7'])
    
    start_date = test_df['date'].min().strftime('%Y-%m-%d')
    end_date = test_df['date'].max().strftime('%Y-%m-%d')
    
    print("\n=======================================================")
    print("               BASELINE EVALUATION                     ")
    print("=======================================================")
    print(f"Test Set Date Range: {start_date} to {end_date}")
    print(f"Naive Baseline (Yesterday's Value) MAPE:  {mape_naive:.2f}%")
    print(f"7-Day Moving Avg Baseline MAPE:           {mape_roll7:.2f}%")
    print("=======================================================\n")
    
    # Save report to markdown
    report_content = f"""# Baseline Evaluation Report

**Test Set Date Range:** {start_date} to {end_date}

## Baseline Performance Metrics (MAPE)
- **Naive Baseline (T-1):** {mape_naive:.2f}%
- **7-Day Moving Average Baseline:** {mape_roll7:.2f}%

*Note: Every future model must be compared against these exact numbers on this exact test set.*
"""
    
    report_file = model_dir / 'baseline_report.md'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    logging.info(f"Saved baseline report to {report_file}")

if __name__ == '__main__':
    main()
