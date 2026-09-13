# Model Training Report

**Test Set Date Range:** 2025-05-29 to 2026-01-01

| Model | MAPE (%) | RMSE | Directional Acc (%) |
|-------|----------|------|---------------------|
| Naive Baseline (T-1) | 1.40% | 28.90 | 50.23% |
| 7-Day Moving Avg Baseline | 1.99% | 39.25 | 59.45% |
| Prophet | 7.00% | 138.40 | 46.08% |
| XGBoost | 1.51% | 31.37 | 51.15% |
| Ensemble (Prophet 0.00 / XGBoost 1.00) | 1.51% | 31.37 | 51.15% |

## Target Evaluation
**Target:** Achieve < 15.0% MAPE.
**Best Model:** Naive Baseline (T-1) (1.40%)

**Result:** ✅ **MET**. The best model successfully achieved a MAPE strictly below the 15% threshold.
## Iteration Log (Model Improvements)
**Starting Baseline XGBoost MAPE:** 1.53%

- **Iteration 1 (Multi-Horizon Rolling Features):** Added 3-day and 14-day rolling mean/std.
  - Result: 1.13% MAPE (✅ Improved by 0.40%)
- **Iteration 2 (Log Transformation):** Applied log1p to target and expm1 to predictions (stacked on Iteration 1).
  - Result: 1.18% MAPE (❌ Worsened/No Change by 0.05%)
- **Iteration 3 (Clipping Congestion Outliers):** Capped `congestion_score` at 95th percentile during training (stacked on Iteration 2).
  - Result: 1.18% MAPE (❌ Worsened/No Change by 0.00%)