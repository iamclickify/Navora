# Navora (SIH26006) — Prototype Build Guide
### From "PRD on paper" to "working demo on stage"

This guide scopes the PRD down to what's actually buildable by someone new to ML forecasting, without breaking any promise you made in the PPT. Everywhere I simplify something, I've mapped it back to a fallback your own PRD already allows (see PRD §17 Risks & Fallbacks) — so you're never contradicting what the judges saw.

---

## 0. The one decision that determines everything: SCOPE DOWN NOW

| PRD says | Build instead | Why it's still legitimate |
|---|---|---|
| Prophet + LSTM + XGBoost ensemble | **Prophet + XGBoost only**, present ensemble as roadmap | PRD §17: "LSTM too slow → fall back to Prophet + XGBoost for demo" |
| 7-port constraint matrix, 5 origins | **3 ports (Paradip, Vizag, Gangavaram) + 2 origins (Australia, Indonesia)** for the live demo, rest as "supported, config-driven" | Same data model handles 3 or 7 rows — you're not lying, just demoing a subset |
| Real-time AIS + port congestion feeds | **Proxy/synthetic congestion score**, clearly labeled "AIS-proxy (public benchmarks)" | PRD §17 explicitly allows this and even names it as the intended MVP approach |
| RL for multi-voyage optimization | **Deterministic dynamic programming / greedy scheduler** | PRD §17: "RL too complex → use DP for hackathon MVP" |
| Airflow + Kafka + MLflow + DVC + Kubernetes | **Cron/manual refresh script + plain pickle model files**, mention the rest as "production roadmap" | None of this is judged live; judges care about the four pillars working |
| Weekly retraining | **Train once, before the demo, freeze the model** | No judge expects live retraining in a 72-hour build |

If you remember one sentence from this whole doc: **build one thin, working slice through all four pillars before you make any single pillar fancy.** A live forecast → vessel rank → voyage plan → sensitivity slider that all actually run beats a beautiful Prophet model with no dashboard around it.

---

## 1. Environment setup (Day 1, ~2 hours)

You already know Docker/DevOps, so this part is easy for you — treat it as the "boring but load-bearing" step.

```bash
mkdir navora && cd navora
mkdir -p data/{raw,processed} notebooks src/{data,models,optimization,api} frontend tests
python3 -m venv venv && source venv/bin/activate
pip install pandas numpy scikit-learn prophet xgboost fastapi uvicorn pydantic \
            matplotlib requests python-dotenv jupyter --break-system-packages
```

- Use **Jupyter notebooks** for all model experimentation (`notebooks/`). Only move code into `src/` once it works — don't write production-shaped code while you're still learning what Prophet even does.
- Git init immediately, commit often. You'll want this repo link on the deck.

---

## 2. Data acquisition — real sources + what to proxy

You don't need all seven PRD data feeds live. You need **one real historical time series to forecast**, plus **static/curated tables** for ports and vessels. Here's the realistic mapping:

| PRD data source | What to actually use | Link / how to get it |
|---|---|---|
| Freight rate index (target variable) | **Baltic Dry Index historical series** — this is your `y` variable | Investing.com has a downloadable historical CSV: `investing.com/indices/baltic-dry-historical-data`. Also search Kaggle for "Baltic Dry Index" or "bulk shipping freight rate" — several ready CSVs exist (I found a Pakistan Maritime Trade dataset and a Baseline BDI series as examples; search Kaggle directly since dataset URLs change). |
| Fuel/bunker prices | **EIA API v2** (free, official US gov data) — use crude oil spot price (`petroleum/pri/spt`) as your fuel-cost driver proxy | Register free key in 30 seconds: `eia.gov/opendata/register.php`, docs at `eia.gov/opendata` |
| Commodity prices (iron ore, coal) | **World Bank "Pink Sheet" Commodity Price Data** — free monthly Excel/CSV, includes coal and iron ore | `worldbank.org/en/research/commodity-markets` |
| Weather / sea state | **Open-Meteo** — completely free, no API key, has a dedicated Marine Weather API | `open-meteo.com` and `marine-api.open-meteo.com` |
| AIS / vessel queue / port congestion | **Do not chase a real feed.** Build a synthetic "congestion score" generator calibrated to the real stats already in your own deck (49.5 hrs avg turnaround, 16.5% idle time, from MoPSW FY24-25) | Your own PPT slide 4 — cite it as the calibration source |
| Port draft/LOA/beam/capacity | **You already have this** — it's literally the table in PRD §6.1. Just turn it into a JSON/CSV seed file | No fetching needed |
| Origin–commodity flows | **You already have this too** — PRD §6.2 table | No fetching needed |

**Practical instruction:** spend at most 1 day on data acquisition. Pull BDI (target), EIA fuel data, and Open-Meteo weather — that's your real, live, defensible pipeline. Hardcode ports/vessels/origins from your PRD tables. Generate synthetic congestion with a documented formula (e.g. base congestion + noise + seasonal bump), and say so out loud in the demo — judges respect labeled proxies far more than fake precision.

---

## 3. ML forecasting — the part you haven't done before

### 3.1 Learn just enough theory (2–3 hours, not more)
You don't need a course. You need these five concepts:
1. **Time series** = data indexed by date, where order matters (unlike a normal spreadsheet you can shuffle).
2. **Trend** = long-term direction. **Seasonality** = repeating pattern (weekly/yearly).
3. **Train/test split must be chronological** — never randomly shuffle dates, or you're "seeing the future" and your model will look fake-accurate.
4. **MAPE** (Mean Absolute Percentage Error) = your main accuracy number. PRD targets <15%.
5. **Confidence interval** = the model saying "I think it's 3200, but could be 3000–3400."

### 3.2 Step-by-step: Prophet first (this alone gives you a demo-able forecast)
Prophet is built exactly for this — you give it two columns (`ds` = date, `y` = value) and it handles trend + seasonality for you.

```python
from prophet import Prophet
import pandas as pd

df = pd.read_csv("data/processed/bdi_daily.csv")  # columns: ds, y
df['ds'] = pd.to_datetime(df['ds'])

train = df[df['ds'] < '2026-06-01']
test = df[df['ds'] >= '2026-06-01']

model = Prophet(yearly_seasonality=True, changepoint_range=0.9)
model.fit(train)

future = model.make_future_dataframe(periods=90)
forecast = model.predict(future)
# forecast has: ds, yhat, yhat_lower, yhat_upper  <- this is your 90-day forecast + CI
```

That's it — you now have a working forecast. Plot it (`model.plot(forecast)`), compute MAPE on the test slice, and you already have Pillar A demoable at a basic level.

### 3.3 Add XGBoost for the "explainable drivers" story
Prophet alone can't say "fuel price is driving this." XGBoost with engineered features can — and it gives you the feature-importance chart your PRD promises.

```python
import xgboost as xgb

# engineer lag/driver features
df['lag_1'] = df['y'].shift(1)
df['lag_7'] = df['y'].shift(7)
df['fuel_price'] = ...   # from EIA
df['month'] = df['ds'].dt.month
df = df.dropna()

X = df[['lag_1','lag_7','fuel_price','month']]
y = df['y']
X_train, X_test = X[:-30], X[-30:]
y_train, y_test = y[:-30], y[-30:]

model_xgb = xgb.XGBRegressor(n_estimators=200, max_depth=4)
model_xgb.fit(X_train, y_train)

import matplotlib.pyplot as plt
xgb.plot_importance(model_xgb)  # <- this IS your "explainable drivers" slide
```

### 3.4 Ensemble (simple, not fancy)
```python
final_forecast = 0.4 * prophet_pred + 0.6 * xgb_pred   # tune the weights, don't overthink them
```
Don't attempt LSTM unless Prophet+XGBoost is done, tested, and you still have days left. If you do add it, keep it to 2 layers max and train on Colab (free GPU) — your PRD already anticipates this exact fallback path.

### 3.5 Validate honestly
Always report: MAPE, and compare against a naive baseline (yesterday's value, or 7-day moving average). "Our model beats a moving average by X%" is a far stronger judge-facing claim than a bare accuracy number.

---

## 4. Vessel optimization (Pillar B) — no ML needed, just logic

This is simpler than it sounds: filter, then score.

```python
def filter_feasible_vessels(port, vessels_df, port_specs_df):
    p = port_specs_df.loc[port]
    return vessels_df[
        (vessels_df.draft <= p.draft) &
        (vessels_df.loa <= p.max_loa) &
        (vessels_df.beam <= p.beam) &
        (vessels_df.capacity <= p.cargo_cap)
    ]

def rank_vessels(feasible_df, freight_rate, port_fees, transit_days):
    feasible_df['total_cost'] = (
        feasible_df.capacity * freight_rate +
        port_fees +
        feasible_df.daily_opex * transit_days
    )
    return feasible_df.sort_values('total_cost')
```
That's your entire Pillar B MVP — a constraint filter (using the exact port table you already have) plus a cost formula, sorted. You can dress this up with an XGBoost ranker later if time allows, but a transparent formula is actually *more* defensible to judges than a black-box ranker for this piece.

---

## 5. Multi-voyage / idle optimization (Pillar C) — dynamic programming, kept simple

Skip general DP theory. You need one specific pattern: **given N voyage windows and vessel availability, minimize total idle days.**

```python
def schedule_voyages(voyages, vessel_available_from):
    """voyages: list of (origin, earliest_start, duration)
       Greedy DP: assign each voyage to the earliest feasible slot after the vessel is free."""
    schedule = []
    current_time = vessel_available_from
    total_idle = 0
    for origin, earliest_start, duration in sorted(voyages, key=lambda v: v[1]):
        start = max(current_time, earliest_start)
        idle = start - current_time
        total_idle += idle
        end = start + duration
        schedule.append({"origin": origin, "start": start, "end": end, "idle_before": idle})
        current_time = end
    return schedule, total_idle
```
Reproduce your PPT's Mozambique→Russia→Australia example with this function, show idle time dropping when you reorder/bundle vs. doing them as isolated spot charters. This is literally the number from your deck (35% → 8% idle) — recreate it as a real calculation, not a hardcoded slide number.

---

## 6. Risk / sensitivity analysis (Pillar D) — parameterize, don't rebuild

```python
def apply_scenario(base_features, fuel_shock=0.0, congestion_shock=0.0):
    scenario = base_features.copy()
    scenario['fuel_price'] *= (1 + fuel_shock)
    scenario['congestion_score'] *= (1 + congestion_shock)
    return model_xgb.predict(scenario)

# demo: "what if fuel jumps 10%?"
new_pred = apply_scenario(latest_features, fuel_shock=0.10)
```
Wire this to a slider in the frontend — when the judge drags it, call this function and re-render the forecast. This single feature is disproportionately impressive live because it *feels* interactive and intelligent, and it's genuinely simple code.

---

## 7. Backend API (FastAPI) — you'll find this easy given your background

Minimum viable endpoint set (trim from PRD's full list):

```
POST /api/v1/forecast              -> {rate, ci_low, ci_high, recommendation}
GET  /api/v1/historical-rates      -> time series for the chart
POST /api/v1/vessel-recommendation -> ranked feasible vessels
POST /api/v1/multi-voyage-optimization -> schedule + idle stats
POST /api/v1/sensitivity-analysis  -> recomputed forecast under scenario
GET  /api/v1/port-constraints      -> draft/LOA/beam/congestion for a port
```

Wrap your trained models (pickle/joblib) and the functions from sections 4–6 directly in these route handlers. Don't overbuild — FastAPI + Pydantic validation is already more rigor than most hackathon teams show.

---

## 8. Frontend (React + Tailwind + Recharts)

Priority order if time runs short (build top-to-bottom, stop wherever you run out of time — each layer is demoable on its own):
1. Route/commodity selector + 90-day forecast chart with confidence band (Recharts `AreaChart`)
2. Recommendation panel (Buy Now / Wait / Avoid + rationale text)
3. Vessel ranking table with a feasibility badge
4. Sensitivity sliders (fuel %, congestion %) wired to `/sensitivity-analysis`
5. Multi-voyage Gantt-style bar chart (idle periods shaded differently)

Skip the feature-importance/SHAP panel and the full port-constraint panel if you're tight on time — they're nice-to-have, not pillar-defining.

---

## 9. Dockerize & deploy (fast for you)

```dockerfile
# backend Dockerfile — FastAPI
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt --break-system-packages
COPY . .
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
`docker-compose up` locally is enough — judges care that it runs, not where it's hosted. If you want a public URL for the deck, Render or Railway free tier is the fastest path (matches PRD §12's MVP hosting choice). **Always also prepare a localhost/offline fallback** — PRD §17 flags this as a real risk, and Wi-Fi at hackathon venues is notoriously unreliable.

---

## 10. Suggested build calendar (adjust to your actual deadline)

| Days | Focus |
|---|---|
| 1 | Environment + repo + pull BDI, EIA fuel, Open-Meteo data; hardcode port/vessel/origin tables from PRD |
| 2–3 | Prophet forecast working end-to-end + MAPE reported |
| 4–5 | XGBoost + feature importance + simple ensemble |
| 6 | Vessel filter + ranking (Section 4) |
| 7 | Multi-voyage DP scheduler (Section 5), reproduce your deck's idle-reduction number for real |
| 8 | Sensitivity function (Section 6) |
| 9–10 | FastAPI endpoints wrapping everything |
| 11–13 | React dashboard, wire to API |
| 14 | Docker Compose, deploy, offline fallback dataset |
| 15 | Dry-run demo, fix rough edges, prep judge Q&A using PRD §19.2 answers |

Tell me your actual deadline and I'll compress or expand this.

---

## Fast reality check before you start coding
Do NOT try to build all 7 ports / 5 origins / 3-model ensemble / RL / Kafka for the live prototype. Build the **thin slice**: 1 route forecast → 1 port's vessel ranking → 1 three-voyage schedule → 1 working slider. Then, if time remains, widen scope. A judge sees a *working system*, not a spec sheet — and your PRD already gives you permission to demo the reduced version.
