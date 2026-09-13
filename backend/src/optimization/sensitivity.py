import pandas as pd
import numpy as np
import pickle
from pathlib import Path

def analyze_sensitivity(model, base_row: dict, fuel_shock_pct: float, congestion_shock_pct: float):
    features = ['fuel in usd', 'congestion_score', 'month', 'dayofweek', 
                'bdi_lag_1', 'bdi_lag_7', 'bdi_roll_mean_7', 'bdi_roll_std_7']
                
    base_df = pd.DataFrame([base_row])[features]
    
    # Adjusted features
    adj_row = base_row.copy()
    adj_row['fuel in usd'] = base_row['fuel in usd'] * (1 + fuel_shock_pct / 100.0)
    adj_row['congestion_score'] = base_row['congestion_score'] * (1 + congestion_shock_pct / 100.0)
    adj_df = pd.DataFrame([adj_row])[features]
    
    base_pred = model.predict(base_df)[0]
    adj_pred = model.predict(adj_df)[0]
    
    base_pred = base_pred
    adj_pred = adj_pred
    
    if adj_pred > base_pred * 1.05:
        rec = "BUY NOW (Rate is projected to spike significantly)"
    elif adj_pred < base_pred * 0.95:
        rec = "WAIT (Rate is projected to drop significantly)"
    else:
        rec = "HOLD/MONITOR (Rate is relatively stable)"
        
    return {
        'baseline_forecast': base_pred,
        'adjusted_forecast': adj_pred,
        'recommendation': rec,
        'pct_change': ((adj_pred - base_pred) / base_pred) * 100
    }

if __name__ == "__main__":
    # Mock base row (with the extra features added in Iteration 1)
    base = {
        'fuel in usd': 600.0,
        'congestion_score': 0.5,
        'month': 12,
        'dayofweek': 3,
        'bdi_lag_1': 1500.0,
        'bdi_lag_7': 1480.0,
        'bdi_roll_mean_7': 1490.0,
        'bdi_roll_std_7': 15.0,
        'bdi_roll_mean_3': 1495.0,
        'bdi_roll_std_3': 8.0,
        'bdi_roll_mean_14': 1475.0,
        'bdi_roll_std_14': 20.0
    }
    
    print("Testing Sensitivity Analysis Module...")
    print("-" * 50)
    print(f"Base State: Fuel = ${base['fuel in usd']}, Congestion = {base['congestion_score']}")
    print("Scenario: +20% Fuel Price Shock, +10% Congestion Shock")
    
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    with open(project_root / 'backend' / 'models' / 'xgboost_model.pkl', 'rb') as f:
        model = pickle.load(f)
        
    res = analyze_sensitivity(model, base, 20.0, 10.0)
    
    print(f"\nBaseline Forecast: ${res['baseline_forecast']:,.2f}/t")
    print(f"Adjusted Forecast: ${res['adjusted_forecast']:,.2f}/t ({res['pct_change']:+.2f}%)")
    print(f"Recommendation:    {res['recommendation']}")
