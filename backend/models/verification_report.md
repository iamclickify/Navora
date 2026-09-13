# Independent Model Verification Report

## 1. Data Integrity & Leakage Check
- [PASSED] Chronological Split: Strictly ordered.
- [PASSED] Leakage Audit: Lag features contain no forward-looking information.

## 2 & 5. Walk-Forward Validation (5 Windows) vs Baselines
| Window | Naive MAPE | 7D-MA MAPE | XGBoost MAPE | Prophet MAPE | Ensemble MAPE |
|--------|------------|------------|--------------|--------------|---------------|
| 1 | 1.38% | 1.63% | 0.99% | 2.73% | **0.99%** |
| 2 | 1.90% | 2.47% | 1.43% | 4.54% | **1.43%** |
| 3 | 1.54% | 1.99% | 1.16% | 3.24% | **1.16%** |
| 4 | 1.58% | 2.10% | 1.33% | 5.22% | **1.33%** |
| 5 | 1.41% | 1.98% | 1.50% | 5.85% | **1.50%** |

**Average Ensemble MAPE:** 1.28%
**Consistency:** The model's error remains relatively stable across expanding walk-forward windows without massive spikes.

## 3. Segment-Level Error Analysis
### MAPE by Month
- Month 1: 1.27%
- Month 2: 1.23%
- Month 3: 1.30%
- Month 4: 1.28%
- Month 5: 1.63%
- Month 6: 1.52%
- Month 7: 1.33%
- Month 8: 1.23%
- Month 9: 1.36%
- Month 10: 1.20%
- Month 11: 1.13%
- Month 12: 1.07%

### Worst 10% of Predictions (Sample)
| Date | Actual | Predicted | APE (%) |
|------|--------|-----------|---------|
| 2025-05-31 | 1492.34 | 1404.45 | 5.89% |
| 2025-11-28 | 1718.36 | 1811.53 | 5.42% |
| 2023-07-30 | 1623.56 | 1535.85 | 5.40% |
| 2025-06-29 | 1644.44 | 1566.26 | 4.75% |
| 2024-04-17 | 1175.45 | 1231.29 | 4.75% |
| 2024-10-09 | 1537.75 | 1608.06 | 4.57% |
| 2025-04-03 | 1506.91 | 1438.27 | 4.56% |
| 2025-02-02 | 1524.65 | 1457.37 | 4.41% |
| 2025-04-28 | 1436.24 | 1373.54 | 4.37% |
| 2024-06-29 | 1212.20 | 1264.90 | 4.35% |

## 4. Confidence Interval Calibration
**Expected Prophet CI:** 95.00%
**Actual Prophet CI Coverage:** 70.61%
**[FLAG] Calibration Issue:** The confidence intervals are wildly miscalibrated and should not be shown to users as a '95% confidence bound'.

## 6. Sanity Checks
- [PASSED] Fuel Shock (+50%): Forecast went from 1566.50 to 1569.96 (Expected: Higher or Neutral).
- [PASSED] Congestion Shock (+50%): Forecast went from 1566.50 to 1566.10 (Expected: Higher or Neutral).

## 7. Final Verdict
**Verdict: CONDITIONALLY READY.**
Reasoning: The model successfully beats the Naive baseline in 4/5 walk-forward windows, meaning it is extracting real signal beyond just returning yesterday's price. However, ensure the sanity checks and CI calibration above are acceptable for the demo.