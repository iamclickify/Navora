# SIH26006: Intelligent Freight Forecasting Model
## AI Agent Implementation Guide

Use this prompt structure when delegating tasks to Claude, ChatGPT, or other coding agents:

---

## 1. DATA PIPELINE & SETUP

### Prompt for Data Engineer Agent:
```
You are building a freight rate forecasting system for SIH 2026. 

TASK: Set up data ingestion pipeline for freight forecasting.

REQUIREMENTS:
- Fetch historical freight rates (BDI, SCFI indices) from Kaggle Maritime datasets
- Fetch historical fuel prices from IEA/Trading Economics
- Clean and preprocess data: handle missing values with forward-fill, remove outliers (IQR method)
- Engineer time-series features: day_of_week, month, is_holiday, fuel_price_lag1_lag7, fuel_volatility
- Output: PostgreSQL schema for freight_rates, fuel_prices, vessel_data tables
- Use Pandas/Polars; output CSV with 1000+ rows covering 2+ years

DELIVERABLES:
1. Python script (data_pipeline.py) that fetches and cleans data
2. SQL schema (schema.sql) for PostgreSQL
3. EDA notebook showing seasonality, outliers, correlations
4. Feature list with descriptions

TECHNOLOGIES: Pandas, Polars, Airflow (optional), PostgreSQL, Great Expectations (validation)

SUCCESS CRITERIA:
- No missing values in final dataset
- Outliers flagged and documented
- Features engineered and normalized
```

---

## 2. MACHINE LEARNING MODEL TRAINING

### Prompt for ML Engineer Agent:
```
You are building a multi-model ensemble for freight rate forecasting.

TASK: Train and validate Prophet, LSTM, and XGBoost models.

INPUT DATA:
- Clean time-series: freight_rate (target), fuel_price, congestion_idx, commodity_price, day_of_week, is_holiday
- 2+ years historical data (~700 rows daily data)
- Train: 70%, Validation: 15%, Test: 15% (time-series split, no future leak)

MODEL REQUIREMENTS:

1. PROPHET (Baseline):
   - Yearly seasonality enabled
   - Detect changepoints
   - Include custom holidays (Indian holidays, monsoon season)
   - Output: trend component, seasonal component, forecast + 95% CI

2. LSTM (Neural Network):
   - Architecture: 2-layer LSTM (64, 32 units) → Dense(16) → Dense(1)
   - Input: Lookback window of 30 days
   - Features: [freight_rate, fuel_price, congestion, commodity_price, day_of_week, is_holiday]
   - Normalization: StandardScaler
   - Training: Adam optimizer, MSE loss, dropout=0.2, batch_size=32, epochs=50, early_stopping
   - Output: point forecasts only (not probabilistic)

3. XGBOOST (Gradient Boosting):
   - Features: freight_rate_lag1, fuel_price, congestion, commodity_price, day_of_week, month, fuel_volatility, port_queue_length, seasonal_flag
   - Hyperparams: max_depth=6, learning_rate=0.05, n_estimators=200, subsample=0.8
   - Output: predictions + SHAP feature importance

ENSEMBLE:
- Weighted blend: 0.25*Prophet + 0.40*LSTM + 0.35*XGBoost
- Cross-validate ensemble weights

EVALUATION:
- MAPE >85% (target <15% error)
- RMSE for regression quality
- Directional accuracy (predict ↑ or ↓ correctly)
- Prediction interval coverage (95%)

DELIVERABLES:
1. MLflow-tracked experiments (train_models.py)
2. Trained model artifacts (ONNX or joblib format)
3. Validation report: MAPE, RMSE, directional accuracy per model and ensemble
4. Backtest results: "Model would have saved X% on historical data"
5. Feature importance plots (SHAP + XGBoost)

TECHNOLOGIES: Prophet, TensorFlow/PyTorch, XGBoost, scikit-learn, MLflow, SHAP

SUCCESS CRITERIA:
- Ensemble MAPE ≤15% on test set
- No overfitting (train/test MAPE gap <2%)
- Models trained reproducibly (seed set)
```

---

## 3. BACKEND API

### Prompt for Backend Engineer Agent:
```
You are building a FastAPI backend for freight forecasting.

TASK: Create REST API with 4 core endpoints.

ARCHITECTURE:
- Framework: FastAPI + Uvicorn
- Database: PostgreSQL + TimescaleDB
- Cache: Redis for historical rate queries
- Async: All endpoints async for high throughput
- Response time target: <500ms (p95)

ENDPOINTS:

1. POST /api/v1/forecast
   Request: {
     "route": "Paradip-Rotterdam",
     "commodity": "iron_ore",
     "volume_tonnes": 50000,
     "forecast_horizon_days": 30
   }
   Response: {
     "route": "Paradip-Rotterdam",
     "commodity": "iron_ore",
     "forecast_date": "2026-09-15",
     "predicted_rate_usd_per_tonne": 28.50,
     "confidence_interval": [27.2, 29.8],
     "recommendation": "Optimal time to procure—rates expected to rise 3-5% next week",
     "factors": {
       "fuel_price_impact": 0.45,
       "seasonality": 0.30,
       "congestion": 0.15,
       "commodity_price": 0.10
     }
   }

2. GET /api/v1/historical-rates?route=Paradip-Rotterdam&commodity=iron_ore&start_date=2024-01-01&end_date=2026-08-31&granularity=daily
   Response: [{date, rate, fuel_price, congestion}, ...]

3. GET /api/v1/routes
   Response: [{origin, destination, commodity}, ...]

4. POST /api/v1/procurement-recommendation
   Request: {
     "budget_usd": 2000000,
     "commodities": [
       {"type": "iron_ore", "tonnes": 50000},
       {"type": "coal", "tonnes": 30000}
     ],
     "timeline_days": 90,
     "risk_tolerance": "medium"
   }
   Response: Prioritized list of procurement windows with expected savings

FEATURES:
- Pydantic validation for all requests
- Error handling: meaningful error messages (not 500 crashes)
- Logging: every forecast request logged (timestamp, inputs, outputs)
- Rate limiting: 100 requests/min per IP
- Health check: GET /health returns {status: "ok", timestamp}

PERFORMANCE:
- Model loading: cached in memory on startup
- Predictions: async background task
- Historical queries: cached in Redis (1-hour TTL)
- Database queries: use indexes on (route, commodity, date)

TESTING:
- Unit tests for each endpoint
- Integration tests: API → DB → model
- Load test with Locust: 100 concurrent requests
- Document latency metrics (p50, p95, p99)

DELIVERABLES:
1. FastAPI app structure (app/, models/, schemas/, utils/)
2. Database connection pool + migration scripts
3. Model loading service (singleton pattern)
4. API documentation (OpenAPI/Swagger)
5. Requirements.txt with pinned versions

TECHNOLOGIES: FastAPI, Uvicorn, Pydantic, SQLAlchemy, asyncpg, Redis, Locust

SUCCESS CRITERIA:
- API responds <500ms for single forecast
- Handles 100+ concurrent requests
- No crashes; all errors logged and returned gracefully
```

---

## 4. FRONTEND DASHBOARD

### Prompt for Frontend Engineer Agent:
```
You are building a React dashboard for freight forecasting.

TASK: Create interactive React dashboard with 5 core sections.

FRAMEWORK: React 18 + TailwindCSS

COMPONENTS:

1. Route & Commodity Selector
   - Dropdown: Select origin port, destination port, commodity
   - Auto-suggest: Search "Paradip to Rotterdam"
   - Display: Selected route details (distance, typical transit time)

2. Forecast Chart
   - Library: Recharts (interactive line chart)
   - Data: 90-day forecast with confidence bands (95% CI, shaded region)
   - Toggles: Show historical data, individual model predictions (Prophet/LSTM/XGBoost), ensemble
   - Hover tooltip: Date, predicted rate, confidence interval, top 3 drivers (fuel, congestion, commodity)
   - X-axis: Date, Y-axis: Rate (USD/tonne)

3. Recommendation Panel
   - Display: "Today's optimal action" as colored badge (Green: BUY NOW, Yellow: WAIT, Red: AVOID)
   - Rationale: Top 3 factors + expected savings (e.g., "$15K savings if you buy today vs. wait 5 days")
   - Action buttons: "Confirm Procurement", "Send to Team", "Schedule for Later"

4. Feature Importance Dashboard
   - Bar chart (Recharts): Contribution of fuel price, congestion, commodity price, seasonality
   - Percentages: e.g., "Fuel: 45%, Seasonality: 30%, Congestion: 15%, Commodity: 10%"
   - Refresh: Update every hour as new data arrives

5. Procurement Optimizer (Advanced)
   - Input form: Budget (USD), commodities (multi-select), timeline (days), risk tolerance (low/medium/high)
   - Output: Timeline with colored bars for each route, recommended procurement windows
   - Cost estimate: Total expected spend, potential savings vs. spot market

LAYOUT:
- Header: Logo, route selector, date range picker
- Left sidebar: Navigation (Dashboard, History, Optimizer, Settings)
- Main content: Forecast chart + recommendation panel side-by-side
- Below: Feature importance + historical rates table
- Responsive: Mobile-first (collapse sidebar on small screens)

STYLING:
- Color scheme: Professional (dark theme preferred for financial data)
- Typography: Clear hierarchy (headline, subheading, body)
- Accessibility: WCAG 2.1 AA (contrast ratios, keyboard nav)

API INTEGRATION:
- Axios for HTTP calls
- Error handling: Show toast notifications for API failures
- Loading states: Show skeleton loaders while fetching
- Polling: Refresh forecast every 30 minutes (or on-demand)

STATE MANAGEMENT:
- React hooks (useState, useContext) for simplicity
- Store: selected route, forecast data, UI state

TESTING:
- Jest unit tests for components
- React Testing Library for integration tests
- Storybook for component documentation

DELIVERABLES:
1. React app structure (pages/, components/, hooks/, utils/)
2. Component library with Storybook stories
3. Tailwind config with custom colors/spacing
4. Axios API client setup
5. Environment config (.env.example)

TECHNOLOGIES: React 18, TailwindCSS, Recharts, Axios, React Router

SUCCESS CRITERIA:
- Dashboard loads in <2s
- Charts render smoothly on 100K+ data points
- Mobile responsive (tested on iPhone, iPad, desktop)
- No console errors
```

---

## 5. DEPLOYMENT & DEVOPS

### Prompt for DevOps Engineer Agent:
```
You are deploying a containerized freight forecasting system.

TASK: Set up Docker, CI/CD, and cloud deployment.

CONTAINERIZATION:

1. Backend Dockerfile:
   - Base: python:3.10-slim
   - Install: FastAPI, TensorFlow, XGBoost, Prophet, PostgreSQL client
   - Expose: port 8000
   - CMD: uvicorn app.main:app --host 0.0.0.0 --port 8000
   - Health check: curl http://localhost:8000/health

2. Frontend Dockerfile:
   - Base: node:18-alpine
   - Build: npm run build
   - Serve: nginx from build output
   - Expose: port 3000

3. Docker Compose (Development):
   Services:
   - backend (FastAPI)
   - frontend (React)
   - postgres (PostgreSQL + TimescaleDB)
   - redis (caching)
   - airflow-scheduler (data refresh, optional)
   
   Volumes: postgres data, model artifacts
   Networks: backend, frontend, database

CI/CD PIPELINE (GitHub Actions):

Trigger: Push to main branch

Steps:
1. Lint: Black (Python), Ruff, ESLint (JS)
2. Test: Pytest (backend), Jest (frontend)
3. Build: Docker images for backend/frontend
4. Push: Docker images to registry (if using Docker Hub/ECR)
5. Deploy: To production (Render, Railway, or AWS)

DEPLOYMENT OPTIONS:

Option 1: Render.com (Recommended for MVP)
- Deploy backend as Web Service (auto-scales)
- Deploy frontend as Static Site
- Connect to managed PostgreSQL
- Cost: Free tier (~$5/month for prod)

Option 2: Railway.app
- Similar to Render, competitive pricing
- GitHub integration for auto-deploy

Option 3: AWS (Production scale)
- Backend: EC2 + ALB (auto-scaling group)
- Database: RDS PostgreSQL with Read Replicas
- Frontend: CloudFront + S3
- Model storage: S3 bucket
- Model serving: SageMaker (optional, for auto-scaling)

MONITORING & LOGGING:

1. Application Metrics (Prometheus):
   - http_request_duration_seconds (histogram)
   - forecast_request_count (counter)
   - model_inference_time (histogram)

2. Dashboards (Grafana):
   - API latency (p50, p95, p99)
   - Error rate
   - Forecast accuracy (MAPE over time)
   - Database query performance

3. Logging (ELK Stack or Loki):
   - All FastAPI requests logged (method, path, status, latency)
   - Model errors and retraining events
   - Database connection pool metrics

4. Alerting:
   - Alert if API latency > 500ms
   - Alert if error rate > 5%
   - Alert if database disk full

ENVIRONMENT VARIABLES:
- DATABASE_URL=postgresql://...
- REDIS_URL=redis://...
- MODEL_STORAGE_PATH=/models
- LOG_LEVEL=info

DELIVERABLES:
1. Dockerfile for backend and frontend
2. docker-compose.yml for local dev
3. GitHub Actions workflow (.github/workflows/deploy.yml)
4. Environment config templates
5. Deployment runbook (how to deploy, rollback, scale)
6. Monitoring dashboard config (Grafana JSON)

TECHNOLOGIES: Docker, GitHub Actions, Render/Railway/AWS, Prometheus, Grafana, Loki

SUCCESS CRITERIA:
- docker-compose up starts full stack locally
- GitHub Actions passes on every commit
- CI/CD deploys to prod in <5 minutes
- Monitoring dashboards show all key metrics
```

---

## 6. ORCHESTRATION & RETRAINING (AIRFLOW)

### Prompt for Data Engineer Agent (Advanced):
```
You are setting up Apache Airflow for automated data refresh and model retraining.

TASK: Create Airflow DAG for daily data refresh and weekly model retraining.

DAG 1: daily_data_refresh
- Schedule: Daily at 2 AM UTC (after market close)
- Tasks:
  1. fetch_freight_rates: Download latest BDI/SCFI from Kaggle/API
  2. fetch_fuel_prices: Download latest bunker prices from IEA
  3. validate_data: Great Expectations checks (schema, missing values, outliers)
  4. engineer_features: Compute day_of_week, fuel_lag, volatility
  5. load_to_postgres: Insert into timescaledb table
  6. log_metrics: Record data freshness, # rows inserted
- Failure handling: Retry 3x with exponential backoff; alert on persistent failure
- Duration: <10 minutes

DAG 2: weekly_model_retrain
- Schedule: Sunday at 3 AM UTC
- Tasks:
  1. fetch_training_data: Query last 2 years from PostgreSQL
  2. split_data: Train/val/test split (70/15/15)
  3. train_prophet: Fit Prophet model
  4. train_lstm: Train LSTM on GPU (free Colab or Lambda Labs GPU)
  5. train_xgboost: Train XGBoost
  6. ensemble_validation: Backtest ensemble on test set
  7. compare_models: Compare MAPE with previous week's model
  8. model_registry: Register new model in MLflow if MAPE improved
  9. deploy_if_better: If MAPE improved >0.5%, promote to production
- Failure handling: Rollback to previous model if new model fails tests
- Duration: <30 minutes (parallel tasks: train_prophet, train_lstm, train_xgboost)

FEATURES:
- Xcom: Pass data between tasks (model artifact paths, metrics)
- Branching: Conditional deploy based on MAPE comparison
- Monitoring: Airflow UI shows all DAG runs, logs, errors
- Email alerts: On failure or promotion to production
- SLA: Tasks should complete in <5 min each (alert if exceed)

DELIVERABLES:
1. daily_refresh_dag.py
2. weekly_retrain_dag.py
3. Airflow configuration (airflow.cfg)
4. Docker Compose for Airflow + PostgreSQL + Redis
5. Documentation on how to trigger manual DAG runs

TECHNOLOGIES: Apache Airflow, Great Expectations, MLflow, PostgreSQL

SUCCESS CRITERIA:
- DAGs run on schedule without manual intervention
- Data freshness: Always <24h old
- Model retraining: Completes weekly, deploys only if improved
```

---

## 7. TESTING STRATEGY

### Prompt for QA Engineer Agent:
```
You are building test suite for freight forecasting system.

TASK: Create unit, integration, and performance tests.

UNIT TESTS (Pytest):

1. test_feature_engineering.py:
   - Test day_of_week encoding (0-6)
   - Test fuel_lag computation (no future leak)
   - Test outlier detection (IQR method)
   - Test seasonality flag (is_holiday, monsoon period)

2. test_models.py:
   - Test Prophet: Can load model, generate forecast
   - Test LSTM: Input/output shapes correct, predictions in range
   - Test XGBoost: Feature count matches, predictions numeric
   - Test ensemble: Weights sum to 1, blended prediction in range

3. test_api.py:
   - Test /forecast endpoint with valid input → 200, JSON response
   - Test /forecast with invalid route → 400, error message
   - Test /historical-rates with date range → data returned in chronological order
   - Test /routes endpoint → non-empty list

4. test_database.py:
   - Test PostgreSQL connection
   - Test insert freight_rates (no duplicates)
   - Test query performance: historical rates query <1s

INTEGRATION TESTS:

1. test_pipeline_end_to_end.py:
   - Fetch sample data → clean → engineer features → train models → API predict
   - Verify forecast is within expected range
   - Verify confidence intervals contain actual test values

2. test_api_to_db.py:
   - Call /forecast endpoint → fetch historical rates from DB → verify response includes DB data

PERFORMANCE TESTS (Locust):

1. test_forecast_load.py:
   - Simulate 100 concurrent users, each making /forecast requests
   - Measure: avg latency, p95, p99
   - Verify: p95 latency <500ms, error rate <1%

CONTINUOUS INTEGRATION:

- GitHub Actions: On every commit
  1. Lint: Black, Ruff (Python), ESLint (JS)
  2. Unit tests: Pytest, Jest
  3. Integration tests: pytest-docker (spin up test DB)
  4. Coverage: Report coverage >80%
  5. Performance: Locust smoke test (10 users, 30s duration)

DELIVERABLES:
1. tests/ directory structure
2. pytest.ini, conftest.py
3. Test fixtures (sample data, mock models)
4. .github/workflows/test.yml
5. Coverage report

TECHNOLOGIES: Pytest, Jest, Locust, GitHub Actions, pytest-cov

SUCCESS CRITERIA:
- >80% code coverage
- All tests pass in CI before merge
- Performance tests show p95 latency <500ms
```

---

## 8. QUICK PROMPTS FOR SPECIFIC TASKS

### Train XGBoost with SHAP Feature Importance:
```
Train an XGBoost model for freight rate forecasting with SHAP feature importance.

Data: freight_rate (target), fuel_price, congestion, commodity_price, day_of_week, month, fuel_volatility
Split: train/test (70/30)
Hyperparams: max_depth=6, learning_rate=0.05, n_estimators=200, subsample=0.8

Output:
1. Trained model (joblib)
2. SHAP summary plot (top 10 features)
3. MAPE on test set
4. Feature importance scores
```

### Convert Trained Model to ONNX for Deployment:
```
Convert Prophet, LSTM, and XGBoost models to ONNX format for low-latency inference.

Input: Trained model files (joblib, .h5, .pkl)
Output: ONNX models (.onnx files)
Verify: ONNX predictions match original model predictions (within 1e-5 tolerance)
```

### Deploy FastAPI to Render:
```
Containerize and deploy a FastAPI backend to Render.com.

Dockerfile: python:3.10-slim, install requirements, expose 8000
render.yml: Deploy as Web Service, connect to PostgreSQL, set environment variables
GitHub Integration: Auto-deploy on git push to main
Verify: API responds at https://your-service.render.com/docs
```

### Build React Dashboard with Recharts:
```
Create a React dashboard component displaying 90-day freight forecast.

Libraries: React 18, Recharts, Axios, TailwindCSS
Features:
- Line chart: historical rates + forecast + confidence bands
- Tooltip: date, rate, key drivers
- Responsive: mobile + desktop
- Loader: show spinner while fetching
```

---

## 9. COMMON PITFALLS & SOLUTIONS

| Pitfall | Solution |
|---------|----------|
| **Model overfits to training data** | Use time-series cross-validation (walk-forward), add regularization (dropout, max_depth), early stopping |
| **Data leakage from future values** | Always use lagged features, time-series split only |
| **API latency >500ms** | Load model once at startup (singleton), cache predictions in Redis, use async/await |
| **LSTM training too slow** | Use free GPU (Colab, Kaggle), reduce lookback window to 14 days, use smaller batch size |
| **React chart doesn't update on new data** | Use useEffect with dependency array, refetch data on interval |
| **Database queries slow** | Add indexes on (route, commodity, date), use TimescaleDB hyper-tables, cache in Redis |
| **Docker image too large** | Use -slim base images, multi-stage builds, don't include test files in prod image |
| **Forecast goes negative** | Clip predictions to sensible range (min_price=15, max_price=100), add constraints to model |
| **Confidence intervals too wide** | Collect more training data, reduce outliers, tune model uncertainty estimation |
| **Judges ask "why this forecast?"** | Have SHAP plots ready, show top 3 feature drivers, explain model logic clearly |

---

## 10. JUDGING DEMO CHECKLIST

- [ ] Live forecast on 2-3 routes without crashes
- [ ] MAPE <15% documented with backtest results
- [ ] API responds <500ms (show in browser DevTools)
- [ ] Recommendation logic clear ("Buy Now" with reasoning)
- [ ] Feature importance chart visible
- [ ] Code is clean: no print() statements, proper logging
- [ ] Docker runs locally: `docker-compose up`
- [ ] GitHub repo organized with README
- [ ] Pitch is 15 min: problem (2min) → demo (5min) → impact (3min) → tech (3min) → QA (2min)

---

## FINAL NOTE

**You are software-dominant team**: Leverage fast backend development (FastAPI), interactive frontend (React). Pre-train models in Week 5; focus hackathon on integration, polishing, demo. **Do NOT spend hackathon time training models from scratch**—that's prep work.

**Golden Rule**: A working, deployed solution beats a theoretically perfect solution in a hackathon. Prioritize: MVP → accuracy → scalability.

---

*Generated for SIH 2026 | Problem Statement 26006*
