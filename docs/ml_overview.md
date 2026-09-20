# Navora — ML Models Overview & Online Learning Roadmap

---

## 1. The Three Models

### 1.1 XGBoost (Primary Workhorse)

**File:** [`train_xgboost.py`](file:///d:/Coding/Projects/navora/backend/src/models/train_xgboost.py)
**Loaded by API:** Yes — eager-loaded at startup from `backend/models/xgboost_model.pkl`

**What it does:** Gradient-boosted tree regressor that predicts the **BDI (Baltic Dry Index)** as a freight rate proxy.

**Features used (10 total):**
| Feature | Type | Source |
|---------|------|--------|
| `fuel in usd` | Exogenous | WTI crude × 7.33 (from FRED live API) |
| `congestion_score` | Exogenous | Static value from `port_constraints.csv` |
| `month` | Calendar | Derived from date |
| `dayofweek` | Calendar | Derived from date |
| `bdi_lag_1` | Autoregressive | Yesterday's BDI |
| `bdi_lag_7` | Autoregressive | BDI 7 days ago |
| `bdi_roll_mean_7` | Rolling | 7-day rolling mean |
| `bdi_roll_std_7` | Rolling | 7-day rolling volatility |
| `wind_speed_max_kmh` | Weather | Avg across all ports (from historical CSV, 0.0 if missing) |
| `precipitation_sum_mm` | Weather | Avg across all ports |

**Training setup:**
- 80/20 chronological split (no shuffle — correct for time series)
- 3-fold `TimeSeriesSplit` walk-forward CV for hyperparameter search
- Grid search over: `n_estimators` ∈ {50, 100, 200}, `max_depth` ∈ {3, 5, 7}, `lr` ∈ {0.01, 0.05, 0.1}

---

### 1.2 Facebook Prophet (Trend/Seasonality Backbone)

**File:** [`train_prophet.py`](file:///d:/Coding/Projects/navora/backend/src/models/train_prophet.py)
**Loaded by API:** Yes — **lazy-loaded** on first `/forecast` call (avoids 15-25s cold start from pystan)

**What it does:** Additive decomposition model that captures **yearly seasonality and long-term trend** in BDI. Only uses `date → BDI` — no exogenous features.

**Training setup:**
- 80/20 chronological split
- Grid search over `changepoint_range` ∈ {0.8, 0.9} and `changepoint_prior_scale` ∈ {0.01, 0.05, 0.1}
- Yearly seasonality enabled

**Known weakness:** Provides confidence intervals — but **actual CI coverage is only 70.61%** vs the advertised 95%. The verification report explicitly flags this.

---

### 1.3 Ensemble (Weighted Blend)

**File:** [`train_ensemble.py`](file:///d:/Coding/Projects/navora/backend/src/models/train_ensemble.py)
**Stored as:** `ensemble_model.pkl` — just a dict `{'w': float}` holding the optimal Prophet weight

**Blending formula:**
```
final_prediction = w × prophet_pred + (1 - w) × xgboost_pred
```

The weight `w` is grid-searched from 0.0 → 1.0 on the test set.

> [!IMPORTANT]
> From the **actual training report**, the optimal `w` came out to **0.00** — meaning Prophet contributed **nothing** and the Ensemble = pure XGBoost. Prophet's 7% MAPE vs XGBoost's 1.51% made Prophet dead weight in the blend.

---

## 2. Actual Performance Numbers

From [`training_report.md`](file:///d:/Coding/Projects/navora/backend/models/training_report.md) and [`verification_report.md`](file:///d:/Coding/Projects/navora/backend/models/verification_report.md):

| Model | MAPE | RMSE | Directional Acc |
|-------|------|------|-----------------|
| **Naive Baseline (T-1)** | 1.40% | 28.90 | 50.23% |
| 7-Day Moving Avg | 1.99% | 39.25 | 59.45% |
| **Prophet** | 7.00% | 138.40 | 46.08% |
| **XGBoost** | 1.51% | 31.37 | 51.15% |
| **Ensemble** | 1.51% | 31.37 | 51.15% |

**Walk-Forward Validation (5 windows):**
| Window | Naive | XGBoost | Prophet | Ensemble |
|--------|-------|---------|---------|----------|
| 1 | 1.38% | 0.99% ✅ | 2.73% | **0.99%** |
| 2 | 1.90% | 1.43% ✅ | 4.54% | **1.43%** |
| 3 | 1.54% | 1.16% ✅ | 3.24% | **1.16%** |
| 4 | 1.58% | 1.33% ✅ | 5.22% | **1.33%** |
| 5 | 1.41% | **1.50%** ❌ | 5.85% | **1.50%** |

**Average Ensemble MAPE: 1.28%** — beats Naive in 4/5 windows.

**Key issue:** XGBoost barely beats the naive baseline. The model is largely learning to predict "tomorrow ≈ today" via `bdi_lag_1`. It has real but **marginal** predictive alpha.

---

## 3. Ingestion Pipeline (Full Flow)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OFFLINE TRAINING PIPELINE                         │
│                  (run manually / one-time)                           │
└─────────────────────────────────────────────────────────────────────┘

Step 1 — validate_manual_references.py
  └─ Validates raw/manual_reference/ CSVs have correct columns
  └─ Copies valid files to data/processed/ (port_specs.csv, etc.)

Step 2 — fetch_freight_rates.py
  └─ Reads raw BDI CSV from data/raw/bdi/ (manual download)
  └─ Forward-fills gaps ≤2 days, flags >5d gaps and spike outliers
  └─ Outputs → data/processed/freight_rates.csv

Step 3 — fetch_fuel_prices.py
  └─ Calls EIA API (requires EIA_API_KEY in .env)
  └─ Fetches WTI crude oil spot price history
  └─ Outputs → data/processed/fuel_prices.csv

Step 4 — fetch_commodity_prices.py
  └─ Fetches commodity price history
  └─ Outputs → data/processed/commodity_prices.csv

Step 5 — fetch_weather.py
  └─ Calls Open-Meteo historical API per port in port_specs.csv
  └─ Outputs → data/all_ports_historical_weather.csv (gitignored)

Step 6 — generate_congestion_proxy.py
  └─ Generates SYNTHETIC congestion data (random + seasonal bump)
  └─ Anchored to MoPSW FY24-25 avg: ~49.5hr turnaround
  └─ Outputs → data/processed/port_observations.csv

Step 7 — build_features.py
  └─ Merges freight + fuel + commodity + weather + port_obs
  └─ Engineers lag/rolling features, calendar features
  └─ Outputs → data/processed/model_features.csv

Step 8 — evaluate_baseline.py → train_prophet.py → train_xgboost.py → train_ensemble.py
  └─ Models saved to backend/models/*.pkl

┌─────────────────────────────────────────────────────────────────────┐
│                     LIVE RUNTIME PIPELINE                            │
│              (automatic — triggered at server startup)               │
└─────────────────────────────────────────────────────────────────────┘

Server Startup (main.py @startup event)
  ├─ Thread 1: Load xgboost_model.pkl
  ├─ Thread 2: Load ensemble_model.pkl (just the weight 'w')
  ├─ Prophet: lazy-loaded on first /forecast call
  └─ Background thread: refresh_live_data()
       ├─ Fetch BDI proxy via yfinance (BALT ETF × 50)
       ├─ Fetch WTI fuel via FRED (free, no key needed)
       ├─ Append new rows to historical_freight_data.csv
       └─ Recompute lag/rolling columns in-place

Per-Request (live inference)
  ├─ /api/v1/forecast
  │    └─ Reads historical_freight_data.csv → recursive XGBoost prediction
  │         (each predicted step feeds back as bdi_lag_1 for next step)
  ├─ /api/v1/weather-forecast
  │    └─ Direct Open-Meteo API call (no cache)
  └─ /api/v1/weather-risk
       └─ Lazy-cached Open-Meteo call (cached in-memory for session)
```

---

## 4. Problems to Fix Before Going "Online"

### ❌ Current Critical Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Congestion data is **100% synthetic** | `generate_congestion_proxy.py` | The model's `congestion_score` feature is fake Gaussian noise, not real port congestion data |
| Prophet CI coverage is **70.6%** not 95% | `verification_report.md` | Confidence bands shown to users are misleading |
| Ensemble weight `w=0.0` | `training_report.md` | Prophet is dead weight — wastes memory and adds latency |
| `bdi_lag_1` dominates predictions | `verification_report.py` | Model is close to a random walk predictor |
| Model is **static** — never retrained | `main.py` | Distribution shift degrades accuracy over time silently |
| Weather features are **zero at inference** | `main.py` L511-514 | `wind_speed_max_kmh` and `precipitation_sum_mm` hardcoded to 0.0 in the forecast feature vector |

---

## 5. Suggestions to Improve Accuracy

### 5.1 Add Real Congestion Data
**Replace the synthetic congestion proxy** with something real:
- **MarineTraffic / VesselsValue API** — AIS-based vessel wait times at Indian ports
- **MoPSW (Ministry of Ports) open data portal** — publishes turnaround times
- Even a scraper on Paradip/JNPT daily report PDFs would be better than random noise

### 5.2 Fix the Zero-Weather Bug at Inference
In [`main.py` L511-514](file:///d:/Coding/Projects/navora/backend/src/api/main.py#L511-L514), the XGBoost feature vector has weather hardcoded to `0.0`:
```python
# Current (wrong)
model_input = pd.DataFrame([[
    base_fuel, base_cong, d.month, d.dayofweek,
    bdi_lag_1, bdi_lag_7, bdi_roll_mean_7, bdi_roll_std_7,
    0.0, 0.0  # ← always zero
]], columns=feature_cols)
```
Fix: Pull the already-fetched live weather cache into the feature vector. The cache already exists (`get_weather_cache()` in main.py) — just use it.

### 5.3 Add More Autoregressive Lags
Currently only `lag_1` and `lag_7`. Add `lag_3`, `lag_14`, `lag_30` and rolling features over 14 and 30 days. The training log shows this improved MAPE from 1.53% → 1.13% but was dropped somewhere.

### 5.4 Add Capesize/Panamax Sub-Indices
`fetch_freight_rates.py` already parses `capesize_index` and `panamax_index` from the BDI CSV — but they're never fed to the model. These sub-indices often diverge from BDI and are better predictors for specific vessel-size freight rates.

### 5.5 Drop Prophet, Use LSTM or Temporal Fusion Transformer
Prophet gets 7% MAPE vs XGBoost's 1.5% and contributes nothing to the ensemble. Replace with either:
- **LSTM** — PyTorch 1-layer LSTM on the raw BDI sequence, trained alongside XGBoost
- **Temporal Fusion Transformer (TFT)** — via `pytorch-forecasting` library, handles multiple exogenous variables natively

---

## 6. Converting to an Online Model

An **online model** updates its parameters continuously as new data arrives, instead of monthly batch retraining.

### Approach A — Incremental XGBoost (Easiest)
XGBoost natively supports `model.fit(X_new, y_new, xgb_model=old_model)` which adds new trees on top of existing ones without forgetting old knowledge.

```python
# In live_data_fetcher.py or a new retrain endpoint
new_model = XGBRegressor(n_estimators=10)  # just 10 new trees
new_model.fit(X_new_day, y_new_day, xgb_model=existing_model)
pickle.dump(new_model, open('xgboost_model.pkl', 'wb'))
```

**Trigger:** After `refresh_live_data()` appends a new day's row → immediately run a 10-tree update.

### Approach B — River (True Online Learning Library)
[`river`](https://riverml.xyz) is a Python library built for streaming/online ML. Drop-in replacement for scikit-learn-style APIs:

```python
from river import linear_model, preprocessing, optim

model = preprocessing.StandardScaler() | linear_model.LinearRegression(
    optimizer=optim.SGD(lr=0.01)
)

# Called once per new data point
model.learn_one({'bdi_lag_1': ..., 'fuel': ..., ...}, y=actual_bdi)
pred = model.predict_one({'bdi_lag_1': ..., ...})
```

For tree-based: use `river.ensemble.AdaptiveRandomForest` — handles concept drift automatically.

### Approach C — Scheduled Nightly Retraining (Pragmatic)
The least disruptive approach — keep the existing XGBoost but add a scheduled retraining job:

```python
# In main.py or a separate cron script
import schedule

def retrain_job():
    """Retrain XGBoost nightly with the latest appended data."""
    from backend.src.models.train_xgboost import main as retrain
    retrain()
    # Hot-swap the model without restarting the server
    global xgboost_model
    with open(models_dir / 'xgboost_model.pkl', 'rb') as f:
        xgboost_model = pickle.load(f)

schedule.every().day.at("02:00").do(retrain_job)
```

### Approach D — Concept Drift Detection
Add a **drift detector** to know *when* to retrain:
```python
from river.drift import ADWIN

drift_detector = ADWIN()

def check_and_retrain(prediction, actual):
    error = abs(prediction - actual) / actual
    drift_detector.update(error)
    if drift_detector.drift_detected:
        logging.warning("Concept drift detected — triggering retraining")
        retrain_job()
```

---

## 7. Recommended Priority Order

```
1. [Quick Win]  Fix weather features at inference time (1 hour of work)
2. [Quick Win]  Add lag_3, lag_14, lag_30 features to XGBoost
3. [Medium]     Replace synthetic congestion with real port data (MoPSW API)
4. [Medium]     Add Approach C — nightly retraining scheduler
5. [Medium]     Drop Prophet, add AdaptiveRandomForest via river for true online learning
6. [Long-term]  Add Capesize/Panamax sub-index features
7. [Long-term]  Replace XGBoost with TFT for multi-horizon forecasting
```
