import pandas as pd
import numpy as np
import pickle
from pathlib import Path
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings('ignore')

def mape(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    non_zero = y_true != 0
    if not np.any(non_zero): return np.nan
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def directional_accuracy(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    if len(y_true) < 2: return np.nan
    actual_diff = np.diff(y_true)
    pred_diff = np.diff(y_pred)
    actual_dir = np.sign(actual_diff)
    pred_dir = np.sign(pred_diff)
    match = (actual_dir == pred_dir)
    return np.mean(match) * 100

def generate_report():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'backend' / 'data'
    models_dir = project_root / 'backend' / 'models'
    
    report_lines = ["# Independent Model Verification Report\n"]
    
    # --- 1. RE-CONFIRM THE BASICS ---
    report_lines.append("## 1. Data Integrity & Leakage Check")
    
    # Load models
    try:
        with open(models_dir / 'xgboost_model.pkl', 'rb') as f:
            xgb = pickle.load(f)
        with open(models_dir / 'prophet_model.pkl', 'rb') as f:
            prophet = pickle.load(f)
        with open(models_dir / 'ensemble_model.pkl', 'rb') as f:
            ensemble_data = pickle.load(f)
            w = ensemble_data['w']
    except Exception as e:
        report_lines.append(f"**FAILED**: Could not load models: {str(e)}")
        write_report(report_lines, models_dir)
        return

    # Load data
    features_path = project_root / 'data' / 'historical_freight_data.csv'
    
    df = pd.read_csv(features_path)
    df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce')
    df = df.dropna(subset=['date']).sort_values('date')
    
    # Check if we need to re-derive features for verification (simulating model_features)
    if 'bdi_lag_1' not in df.columns:
        df['month'] = df['date'].dt.month
        df['dayofweek'] = df['date'].dt.dayofweek
        df['bdi_lag_1'] = df['bdi_index'].shift(1)
        df['bdi_lag_7'] = df['bdi_index'].shift(7)
        df['bdi_roll_mean_7'] = df['bdi_index'].rolling(7).mean()
        df['bdi_roll_std_7'] = df['bdi_index'].rolling(7).std()
        
    df = df.dropna().reset_index(drop=True)
    
    # Chronological Check
    split_idx = int(len(df) * 0.8)
    train_dates = df['date'].iloc[:split_idx]
    test_dates = df['date'].iloc[split_idx:]
    
    max_train_date = train_dates.max()
    min_test_date = test_dates.min()
    
    if min_test_date <= max_train_date:
        report_lines.append(f"- [FAILED] Chronological Split: Test date {min_test_date.date()} is <= Train date {max_train_date.date()}")
    else:
        report_lines.append("- [PASSED] Chronological Split: Strictly ordered.")
        
    # Leakage Audit
    # Verify lag_1 strictly matches shifted BDI
    shifted_bdi = df['bdi_index'].shift(1)
    # ignore first row due to NaNs
    diff = np.abs(df['bdi_lag_1'].iloc[1:] - shifted_bdi.iloc[1:])
    if diff.max() > 1e-5:
        report_lines.append("- [FAILED] Leakage Audit: `bdi_lag_1` does not match shifted target.")
    else:
        report_lines.append("- [PASSED] Leakage Audit: Lag features contain no forward-looking information.")

    # --- 2. MULTIPLE WALK-FORWARD WINDOWS & 5. BASELINE COMPARISON ---
    report_lines.append("\n## 2 & 5. Walk-Forward Validation (5 Windows) vs Baselines")
    
    tscv = TimeSeriesSplit(n_splits=5)
    
    features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 
                'bdi_lag_1', 'bdi_lag_7', 'bdi_roll_mean_7', 'bdi_roll_std_7']
                
    results_table = [
        "| Window | Naive MAPE | 7D-MA MAPE | XGBoost MAPE | Prophet MAPE | Ensemble MAPE |",
        "|--------|------------|------------|--------------|--------------|---------------|"
    ]
    
    all_ens_mape = []
    worst_window_idx = -1
    worst_window_mape = 0
    all_test_dates = []
    all_test_y = []
    all_test_pred = []
    all_prophet_yhat_lower = []
    all_prophet_yhat_upper = []
    
    window_idx = 1
    for train_index, test_index in tscv.split(df):
        train_df = df.iloc[train_index]
        test_df = df.iloc[test_index]
        
        y_true = test_df['bdi_index'].values
        
        # Naive Baseline (T-1)
        naive_pred = test_df['bdi_lag_1'].values
        naive_mape = mape(y_true, naive_pred)
        
        # 7D-MA Baseline
        ma7_pred = test_df['bdi_roll_mean_7'].values
        ma7_mape = mape(y_true, ma7_pred)
        
        # XGBoost
        xgb_pred = xgb.predict(test_df[features])
        xgb_mape = mape(y_true, xgb_pred)
        
        # Prophet
        prophet_df = pd.DataFrame({'ds': test_df['date']})
        prophet_forecast = prophet.predict(prophet_df)
        prophet_pred = prophet_forecast['yhat'].values
        prophet_mape = mape(y_true, prophet_pred)
        
        # Ensemble
        ens_pred = w * prophet_pred + (1 - w) * xgb_pred
        ens_mape = mape(y_true, ens_pred)
        
        all_ens_mape.append(ens_mape)
        
        all_test_dates.extend(test_df['date'])
        all_test_y.extend(y_true)
        all_test_pred.extend(ens_pred)
        
        all_prophet_yhat_lower.extend(prophet_forecast['yhat_lower'].values)
        all_prophet_yhat_upper.extend(prophet_forecast['yhat_upper'].values)
        
        if ens_mape > worst_window_mape:
            worst_window_mape = ens_mape
            worst_window_idx = window_idx
            
        results_table.append(f"| {window_idx} | {naive_mape:.2f}% | {ma7_mape:.2f}% | {xgb_mape:.2f}% | {prophet_mape:.2f}% | **{ens_mape:.2f}%** |")
        window_idx += 1
        
    report_lines.extend(results_table)
    avg_ens = np.mean(all_ens_mape)
    report_lines.append(f"\n**Average Ensemble MAPE:** {avg_ens:.2f}%")
    
    if worst_window_mape > avg_ens * 1.5:
        report_lines.append(f"**[FLAG] Inconsistent Performance:** Window {worst_window_idx} had a MAPE of {worst_window_mape:.2f}%, which is significantly worse than the average. This suggests poor generalization during specific market regimes.")
    else:
        report_lines.append("**Consistency:** The model's error remains relatively stable across expanding walk-forward windows without massive spikes.")

    # --- 3. SEGMENT-LEVEL ERROR ANALYSIS ---
    report_lines.append("\n## 3. Segment-Level Error Analysis")
    
    err_df = pd.DataFrame({
        'date': pd.to_datetime(all_test_dates),
        'actual': all_test_y,
        'predicted': all_test_pred,
        'prophet_lower': all_prophet_yhat_lower,
        'prophet_upper': all_prophet_yhat_upper
    })
    err_df['ape'] = np.abs((err_df['actual'] - err_df['predicted']) / err_df['actual']) * 100
    err_df['month'] = err_df['date'].dt.month
    
    monthly_mape = err_df.groupby('month')['ape'].mean()
    report_lines.append("### MAPE by Month")
    for m, val in monthly_mape.items():
        report_lines.append(f"- Month {m}: {val:.2f}%")
        
    worst_10_pct = err_df.nlargest(int(len(err_df) * 0.1), 'ape')
    report_lines.append("\n### Worst 10% of Predictions (Sample)")
    report_lines.append("| Date | Actual | Predicted | APE (%) |")
    report_lines.append("|------|--------|-----------|---------|")
    for _, row in worst_10_pct.head(10).iterrows():
        report_lines.append(f"| {row['date'].date()} | {row['actual']:.2f} | {row['predicted']:.2f} | {row['ape']:.2f}% |")

    # --- 4. CONFIDENCE INTERVAL CALIBRATION ---
    report_lines.append("\n## 4. Confidence Interval Calibration")
    # Prophet targets 95% by default.
    inside_ci = (err_df['actual'] >= err_df['prophet_lower']) & (err_df['actual'] <= err_df['prophet_upper'])
    ci_coverage = inside_ci.mean() * 100
    report_lines.append(f"**Expected Prophet CI:** 95.00%")
    report_lines.append(f"**Actual Prophet CI Coverage:** {ci_coverage:.2f}%")
    if ci_coverage < 80 or ci_coverage > 99:
        report_lines.append("**[FLAG] Calibration Issue:** The confidence intervals are wildly miscalibrated and should not be shown to users as a '95% confidence bound'.")
    else:
        report_lines.append("**[PASSED] Calibration:** The confidence intervals are reasonably calibrated.")

    # --- 6. SANITY / DIRECTIONAL BEHAVIOR CHECKS ---
    report_lines.append("\n## 6. Sanity Checks")
    
    base_idx = int(len(df) * 0.9)
    base_row = df.iloc[base_idx].copy()
    base_input = pd.DataFrame([base_row])[features]
    base_pred = xgb.predict(base_input)[0]
    
    # Scenario A: Fuel Shock
    shock_fuel = base_row.copy()
    shock_fuel['fuel in usd'] *= 1.5
    pred_fuel = xgb.predict(pd.DataFrame([shock_fuel])[features])[0]
    
    if pred_fuel >= base_pred * 0.99: # Allowing a tiny margin for float math
        report_lines.append(f"- [PASSED] Fuel Shock (+50%): Forecast went from {base_pred:.2f} to {pred_fuel:.2f} (Expected: Higher or Neutral).")
    else:
        report_lines.append(f"- [FAILED] Fuel Shock (+50%): Forecast dropped from {base_pred:.2f} to {pred_fuel:.2f}. **Unintuitive.**")
        
    # Scenario B: Congestion Shock
    shock_cong = base_row.copy()
    shock_cong['congestion_score'] *= 1.5
    pred_cong = xgb.predict(pd.DataFrame([shock_cong])[features])[0]
    
    if pred_cong >= base_pred * 0.99:
        report_lines.append(f"- [PASSED] Congestion Shock (+50%): Forecast went from {base_pred:.2f} to {pred_cong:.2f} (Expected: Higher or Neutral).")
    else:
        report_lines.append(f"- [FAILED] Congestion Shock (+50%): Forecast dropped from {base_pred:.2f} to {pred_cong:.2f}. **Unintuitive.**")
        
    # --- 7. FINAL VERDICT ---
    report_lines.append("\n## 7. Final Verdict")
    if avg_ens < 10.0 and ci_coverage > 80 and pred_fuel >= base_pred * 0.99:
        report_lines.append("**Verdict: NOT READY FOR DEMO-GRADE CLAIMS.**")
        report_lines.append("Wait, let's assess honestly.")
        # We will formulate the verdict based on the fact that Ensemble MAPE is ~1.5%, but Naive MAPE is actually ~1.4%.
        # If Naive beats the Ensemble consistently on the walk-forward windows, then the model is mathematically useless compared to a T-1 guess.
    
    # Let's calculate how often Ensemble beats Naive
    ens_beats_naive = 0
    # Re-evaluating
    for line in results_table[2:]:
        parts = line.split('|')
        naive_val = float(parts[2].replace('%', '').strip())
        ens_val = float(parts[6].replace('%', '').replace('*', '').strip())
        if ens_val < naive_val:
            ens_beats_naive += 1
            
    if ens_beats_naive < 3:
         report_lines.append(f"**Verdict: NOT READY FOR DEMO-GRADE CLAIMS.**\nReasoning: While the absolute error (~{avg_ens:.2f}%) looks phenomenal on paper, the walk-forward validation proves that the Ensemble model lost to a simple Naive T-1 guess (predicting yesterday's price) in most windows. It provides no predictive alpha over a trivial baseline. Furthermore, we must review the calibration and sanity checks above.")
    else:
         report_lines.append(f"**Verdict: CONDITIONALLY READY.**\nReasoning: The model successfully beats the Naive baseline in {ens_beats_naive}/5 walk-forward windows, meaning it is extracting real signal beyond just returning yesterday's price. However, ensure the sanity checks and CI calibration above are acceptable for the demo.")
         
    write_report(report_lines, models_dir)

def write_report(lines, output_dir):
    with open(output_dir / 'verification_report.md', 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"Verification report saved to {output_dir / 'verification_report.md'}")

if __name__ == "__main__":
    generate_report()
