# SIH26006 Implementation Checklist
## Freight Forecasting Model – Phase-by-Phase Tracking

---

## WEEK 1-2: DATA FOUNDATION ✓ Complete before Week 3

### Data Collection
- [ ] Download BDI/SCFI indices from Kaggle (2+ years)
- [ ] Scrape fuel prices from IEA/Trading Economics (daily, 2+ years)
- [ ] Collect AIS vessel data (subsample East Coast routes)
- [ ] Source port congestion indices (if available publicly)
- [ ] Source commodity prices (iron ore, coal, fertilizer, grain)

### Data Cleaning & Preprocessing
- [ ] Handle missing values: forward-fill for daily data, interpolate if <5% missing
- [ ] Detect & flag outliers (IQR method: keep, log in metadata)
- [ ] Check for duplicates in daily records
- [ ] Normalize/scale features: StandardScaler for ML-ready data
- [ ] Verify data quality: >95% non-null for key columns

### Feature Engineering (Week 2)
- [ ] Extract: day_of_week (0-6), month (1-12), is_holiday (boolean)
- [ ] Compute lagged features: freight_rate_lag1_7_14_30, fuel_price_lag1_7
- [ ] Calculate rolling statistics: fuel_volatility (7-day rolling std), congestion_trend (3-day MA)
- [ ] Create seasonal flags: is_monsoon (Jun-Sep), is_holiday_season (Nov-Dec)
- [ ] Create binary indicators: is_weekend, is_shipping_peak_season

### Exploratory Data Analysis (EDA)
- [ ] Plot time-series: freight rates over 2+ years (identify trends, seasonality)
- [ ] Autocorrelation plot: freight rates ACF/PACF (lag selection for ARIMA)
- [ ] Seasonal decomposition: STL or Prophet decompose (trend, seasonality, residuals)
- [ ] Correlation heatmap: all features vs. target
- [ ] Outlier analysis: identify extreme events, document them
- [ ] Missing data patterns: visualize missing value timeline

### Output & Handoff
- [ ] Clean dataset: freight_rates.csv (1000+ rows, 10+ columns)
- [ ] Metadata: data dictionary (column names, units, source, collection date)
- [ ] EDA notebook: visualizations + findings (commit to GitHub)
- [ ] Feature list: {feature_name, description, data_type, engineering_method}
- [ ] Data validation report: % nulls, duplicates, outliers by column

**GATE**: Dataset is clean, documented, and ready for ML. No missing values in final dataset.

---

## WEEK 3-4: MODEL DEVELOPMENT ✓ Complete before Week 5

### Prophet Model (Baseline)
- [ ] Install: `pip install prophet`
- [ ] Prepare data: Date index, single target column (freight_rate)
- [ ] Fit Prophet: Set yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False
- [ ] Tune: yearly_seasonality_prior_scale=10, seasonality_mode='additive'
- [ ] Detect changepoints: changepoint_range=0.9, changepoint_prior_scale=0.05
- [ ] Add holidays: Create DataFrame with Indian holidays (Diwali, Holi, etc.) + monsoon season
- [ ] Generate forecast: 90 days ahead, include uncertainty intervals (default 80%, custom 95%)
- [ ] Evaluate: MAPE on test set, plot predictions vs. actuals

### LSTM Model (Neural Network)
- [ ] Install: `pip install tensorflow pandas scikit-learn`
- [ ] Prepare sequences: Lookback=30, create (X_train, y_train) sequences
- [ ] Scale features: StandardScaler, fit on train, apply to test
- [ ] Build model:
  ```
  Input → LSTM(64, dropout=0.2) → LSTM(32, dropout=0.2) → Dense(16, activation='relu') → Dense(1)
  ```
- [ ] Compile: optimizer=Adam(lr=0.001), loss=MSE
- [ ] Train: batch_size=32, epochs=50, validation_split=0.15, callbacks=[EarlyStopping(patience=5)]
- [ ] Evaluate: MAPE on test set, plot loss curves
- [ ] Save model: model.h5 or SavedModel format

### XGBoost Model (Gradient Boosting)
- [ ] Install: `pip install xgboost`
- [ ] Engineer features: freight_rate_lag1, fuel_price, congestion, commodity_price, day_of_week, month, fuel_volatility, port_queue, seasonal_flag
- [ ] Handle categorical: Encode day_of_week as numerical (0-6)
- [ ] Split data: train/test (70/30), stratified if possible
- [ ] Hyperparameter grid: max_depth=[5,6,7], learning_rate=[0.01, 0.05, 0.1], n_estimators=[100, 200]
- [ ] Train: GridSearchCV or RandomSearchCV, 5-fold CV
- [ ] Evaluate: MAPE on test set, plot feature importance (gain, cover, frequency)
- [ ] Extract SHAP values: Explain predictions for top 10 samples

### Ensemble Creation
- [ ] Align predictions: Ensure all models output same date range, same format
- [ ] Normalize outputs: All models should output point forecast + optional intervals
- [ ] Weighted blend: y_ensemble = 0.25 * y_prophet + 0.40 * y_lstm + 0.35 * y_xgboost
- [ ] Cross-validate weights: Use validation set, optimize weights via grid search (0.0-1.0, step=0.05)
- [ ] Generate confidence intervals: Use Prophet intervals (0.25 weight), LSTM/XGBoost ensemble std
- [ ] Test on holdout: Compute ensemble MAPE, compare to individual models

### Backtesting
- [ ] Walk-forward validation: Retrain models weekly, evaluate on next week's data
- [ ] Simulate live forecasting: Use only data available at forecast time (no future leak)
- [ ] Directional accuracy: % of forecasts correctly predicting ↑ or ↓
- [ ] Coverage: Do 95% prediction intervals contain actual values? (Target: >90% coverage)
- [ ] Document: "Model would have saved X% on historical data if followed"

### Model Artifacts & Registry
- [ ] Save models: prophet_model.pkl, lstm_model.h5, xgboost_model.pkl
- [ ] MLflow tracking: Log experiments with params, metrics (MAPE, RMSE, directional_accuracy)
- [ ] Register best model: MLflow Model Registry, tag as "production"
- [ ] Version control: Commit model artifacts to GitHub (use .gitignore for large files)

### Output & Handoff
- [ ] Models directory: /models/prophet/, /models/lstm/, /models/xgboost/
- [ ] Validation report: Individual MAPE, RMSE, ensemble MAPE, directional accuracy
- [ ] Backtest results: "11.3% savings on historical 90-day period"
- [ ] Feature importance plots: SHAP summary plot, top 10 drivers
- [ ] Training notebook: Hyperparameter tuning, cross-validation results
- [ ] Model config: Feature names, scaling parameters (mean, std), preprocessing steps

**GATE**: Ensemble MAPE ≤15% on test set, models saved and versioned.

---

## WEEK 5: BACKEND API & DATA PIPELINE ✓ Complete before Week 6

### FastAPI Setup
- [ ] Initialize project: `pip install fastapi uvicorn pydantic sqlalchemy asyncpg redis`
- [ ] Create app structure:
  ```
  app/
  ├── main.py
  ├── models.py (Pydantic schemas)
  ├── schemas.py (request/response models)
  ├── database.py (PostgreSQL connection)
  ├── forecast.py (ML service)
  └── utils/
  ```
- [ ] Test locally: `uvicorn app.main:app --reload` on port 8000

### Database Setup
- [ ] PostgreSQL: `createdb sih26006_freight`
- [ ] Install TimescaleDB: `CREATE EXTENSION IF NOT EXISTS timescaledb`
- [ ] Create schema:
  ```sql
  CREATE TABLE freight_rates (
    date DATE,
    route VARCHAR(100),
    commodity VARCHAR(50),
    rate_usd FLOAT,
    fuel_price FLOAT,
    congestion_idx FLOAT,
    PRIMARY KEY (date, route, commodity)
  );
  CREATE INDEX idx_route_date ON freight_rates(route, date);
  ```
- [ ] Create hyper-table (TimescaleDB): `SELECT create_hypertable('freight_rates', 'date')`
- [ ] Load historical data: `COPY freight_rates FROM 'data.csv' WITH CSV HEADER`
- [ ] Verify: `SELECT COUNT(*) FROM freight_rates;` (should be >1000)

### API Endpoints Implementation
- [ ] Endpoint 1: POST /api/v1/forecast
  - [ ] Load trained models on startup (singleton pattern)
  - [ ] Validate request: route, commodity, volume, horizon exist
  - [ ] Fetch latest features from DB (fuel price, congestion, commodity price)
  - [ ] Inference: Call models, compute ensemble, add SHAP explanation
  - [ ] Return: forecast + confidence interval + recommendation + feature drivers
  - [ ] Log: request, inference time, response

- [ ] Endpoint 2: GET /api/v1/historical-rates
  - [ ] Query parameters: route, commodity, start_date, end_date, granularity
  - [ ] Fetch from PostgreSQL: ORDER BY date ASC
  - [ ] Return: time-series array (date, rate, fuel_price, congestion)
  - [ ] Cache: Redis (1-hour TTL)

- [ ] Endpoint 3: GET /api/v1/routes
  - [ ] Query distinct routes from DB
  - [ ] Return: {origin, destination, commodity, typical_transit_days}

- [ ] Endpoint 4: POST /api/v1/procurement-recommendation
  - [ ] Validate: budget, commodities, timeline, risk_tolerance
  - [ ] For each commodity: generate forecasts for all routes
  - [ ] Optimization: Select routes/dates to maximize savings within budget
  - [ ] Return: Ordered list of procurement windows with cost/confidence

- [ ] Endpoint 5: GET /health
  - [ ] Return: {status: "ok", timestamp, db_connected: true, models_loaded: true}

### Data Pipeline (Airflow DAG)
- [ ] DAG 1: daily_data_refresh (schedule: daily at 2 AM UTC)
  - [ ] Task 1: fetch_freight_rates (API/Kaggle)
  - [ ] Task 2: fetch_fuel_prices (IEA API)
  - [ ] Task 3: validate_data (Great Expectations checks)
  - [ ] Task 4: engineer_features (compute lagged, seasonal features)
  - [ ] Task 5: load_to_postgres (insert into DB)
  - [ ] Failure handling: Retry 3x, alert on persistent failure

- [ ] DAG 2: weekly_model_retrain (schedule: Sunday 3 AM UTC)
  - [ ] Task 1: fetch_training_data (query last 2 years)
  - [ ] Task 2: split_data (70/15/15)
  - [ ] Tasks 3-5: train Prophet, LSTM, XGBoost (parallel)
  - [ ] Task 6: validate_ensemble (backtest, compute MAPE)
  - [ ] Task 7: compare_models (new vs. old MAPE)
  - [ ] Task 8: deploy_if_better (if MAPE improved, promote to production)

### Error Handling & Logging
- [ ] API errors: Catch ValueError, return 400 + message
- [ ] Database errors: Catch psycopg2.Error, return 503 + "Database unavailable"
- [ ] Model loading errors: Catch FileNotFoundError, return 500 + "Models not found"
- [ ] Logging: Every request logged with timestamp, method, path, status, latency
- [ ] Structured logging: Use JSON format for log aggregation (ELK/Loki)

### Testing
- [ ] Unit tests: `pytest tests/test_api.py`
  - [ ] Test /forecast returns 200 with valid input
  - [ ] Test /forecast returns 400 with invalid route
  - [ ] Test /historical-rates returns data in chronological order
  - [ ] Test /health returns 200
- [ ] Integration test: Fetch historical rates → call forecast → verify response format
- [ ] Load test: Locust with 50 concurrent users, verify p95 latency <500ms

### Output & Handoff
- [ ] FastAPI app: app/ directory with all endpoints
- [ ] API documentation: Swagger at http://localhost:8000/docs
- [ ] PostgreSQL schema: schema.sql (can be applied with `psql < schema.sql`)
- [ ] Airflow DAGs: daily_refresh_dag.py, weekly_retrain_dag.py
- [ ] Environment config: .env.example (no secrets)
- [ ] Requirements.txt: All Python dependencies pinned

**GATE**: API responds <500ms, endpoints tested, data pipeline running locally.

---

## WEEK 6: FRONTEND & DEPLOYMENT ✓ Complete before Hackathon

### React Frontend
- [ ] Initialize: `npx create-react-app frontend`
- [ ] Install dependencies: React Router, Recharts, Axios, TailwindCSS
- [ ] Component structure:
  ```
  src/
  ├── pages/
  │   ├── Dashboard.jsx
  │   ├── History.jsx
  │   └── Optimizer.jsx
  ├── components/
  │   ├── RouteSelector.jsx
  │   ├── ForecastChart.jsx
  │   ├── RecommendationPanel.jsx
  │   ├── FeatureImportance.jsx
  │   └── ProcurementOptimizer.jsx
  ├── hooks/
  │   └── useForecast.js
  ├── utils/
  │   └── api.js (Axios client)
  └── App.jsx
  ```

### Dashboard Components
- [ ] RouteSelector: Dropdowns for origin, destination, commodity, volume
- [ ] ForecastChart: Recharts LineChart with 90-day forecast + confidence bands
  - [ ] X-axis: Date, Y-axis: Rate (USD/tonne)
  - [ ] Toggles: Show historical, individual models, ensemble
  - [ ] Tooltip: Hover shows date, rate, confidence, top 3 drivers
- [ ] RecommendationPanel: Colored badge (Green/Yellow/Red) + reasoning + action buttons
- [ ] FeatureImportance: Bar chart showing fuel (45%), seasonality (30%), etc.
- [ ] ProcurementOptimizer: Form + timeline output with procurement windows

### Styling
- [ ] TailwindCSS: Install, configure tailwind.config.js
- [ ] Color scheme: Professional (dark theme recommended)
- [ ] Responsive design: Mobile-first, test on 375px, 768px, 1920px viewports
- [ ] Accessibility: WCAG 2.1 AA (min contrast 4.5:1, keyboard navigation)

### API Integration
- [ ] Create Axios client: `src/utils/api.js`
- [ ] Setup: baseURL, headers, error interceptors
- [ ] Implement hooks:
  - [ ] useForecast(route, commodity, horizon): Fetch forecast
  - [ ] useHistoricalRates(route, commodity, dateRange): Fetch history
  - [ ] useRoutes(): Fetch available routes
  - [ ] useProcurementRec(budget, commodities, timeline): Fetch recommendations
- [ ] Error handling: Show toast notifications, retry logic
- [ ] Loading states: Skeleton loaders, spinning icons

### Testing (Frontend)
- [ ] Jest: Unit tests for components
  - [ ] RouteSelector renders dropdowns
  - [ ] ForecastChart renders with mock data
  - [ ] RecommendationPanel shows correct badge color
- [ ] React Testing Library: Integration tests
  - [ ] User selects route → chart updates
  - [ ] User submits procurement form → receives recommendations

### Docker & Deployment
- [ ] Backend Dockerfile:
  ```dockerfile
  FROM python:3.10-slim
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install -r requirements.txt
  COPY app/ .
  EXPOSE 8000
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
  ```
- [ ] Frontend Dockerfile:
  ```dockerfile
  FROM node:18-alpine AS build
  WORKDIR /app
  COPY package.json .
  RUN npm install && npm run build
  FROM nginx:alpine
  COPY --from=build /app/build /usr/share/nginx/html
  EXPOSE 80
  ```
- [ ] Docker Compose: backend, frontend, postgres, redis services
- [ ] Test locally: `docker-compose up` (all services start)

### CI/CD Pipeline (GitHub Actions)
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Trigger: Push to main
  - [ ] Jobs:
    1. Lint: Black, Ruff (Python), ESLint (JS)
    2. Test: Pytest (backend), Jest (frontend)
    3. Build: Docker images
    4. Deploy: Push to Render/Railway
- [ ] Secrets: Store DATABASE_URL, API_KEY in GitHub Secrets

### Deployment to Render.com
- [ ] Create render.yml:
  ```yaml
  services:
    - type: web
      name: freight-api
      env: python
      buildCommand: pip install -r requirements.txt
      startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
  databases:
    - name: freight-db
      databaseName: sih26006
      user: postgres
  ```
- [ ] Deploy: Push to GitHub, Render auto-deploys
- [ ] Verify: API responds at https://freight-api-xxxx.render.com/docs

### Monitoring & Alerts (Optional)
- [ ] Prometheus metrics: http_request_duration_seconds, forecast_count
- [ ] Grafana dashboards: API latency (p50, p95, p99), error rate, model accuracy
- [ ] Alerts: Slack notification if latency >500ms or error rate >5%

### Output & Handoff
- [ ] Frontend repo: GitHub /sih26006-freight-forecasting/frontend
- [ ] Docker images: Dockerfile for backend, frontend
- [ ] Docker Compose: docker-compose.yml for local dev
- [ ] GitHub Actions: .github/workflows/deploy.yml
- [ ] Deployment guide: How to deploy to Render/AWS
- [ ] Live URL: https://sih26006-frontend.render.com (public)

**GATE**: Live dashboard accessible, API responding, docker-compose up works locally.

---

## WEEK 7: PRE-HACKATHON REHEARSAL ✓ 1 week before hackathon

### Integration Testing
- [ ] End-to-end flow: Data refresh → Model inference → API response → Dashboard display
- [ ] Data quality: Historical rates are recent (updated within 24h)
- [ ] Model performance: Verify MAPE <15% on current data
- [ ] API load test: 100 concurrent requests, p95 latency <500ms
- [ ] Dashboard: Load 5+ routes, charts render smoothly

### Demo Dry-Run
- [ ] Rehearse live demo (15 min):
  1. Problem statement (2 min): "15% cost overruns in freight, no prediction tools"
  2. Demo (5 min): Select route → show forecast → demonstrate recommendation
  3. Impact (3 min): MAPE, backtesting savings, scale to 200M tonnes
  4. Tech (3 min): Ensemble, FastAPI, React, PostgreSQL
- [ ] Record demo: Identify any crashes, latency issues, unclear explanations
- [ ] Fix issues: Address any bugs found during dry-run

### Documentation
- [ ] README.md: Project overview, architecture, quickstart
- [ ] API documentation: OpenAPI/Swagger (auto-generated by FastAPI)
- [ ] Developer guide: How to set up locally, run tests, deploy
- [ ] Architecture diagram: Data flow, model pipeline, API structure (use Mermaid or Figma)
- [ ] Backtest report: Document 11.3% savings claim with data/dates

### Code Quality
- [ ] Black formatting: `black app/ frontend/src/`
- [ ] Ruff linting: `ruff check app/`
- [ ] ESLint: `npm run lint` (frontend)
- [ ] Test coverage: >80% (use pytest-cov, nyc)
- [ ] No print() statements: Use proper logging instead
- [ ] No secrets in code: Use .env for sensitive data

### Presentation Materials
- [ ] Slide deck: Problem → Solution → Impact → Tech (10 slides max)
- [ ] Feature demo script: Canned data for multiple routes (avoid live API during demo)
- [ ] Backup demo: Offline mode if internet fails during presentation
- [ ] Impact metrics: Quantified savings, scalability potential
- [ ] Team introduction: Roles, experience, why you're qualified

### Final Checks
- [ ] GitHub repo: Clean, organized, all code committed
- [ ] Docker: `docker-compose up` starts full stack (no manual steps)
- [ ] Deployment: Live dashboard accessible at public URL
- [ ] Monitoring: Logs and metrics visible (Grafana, CloudWatch, etc.)
- [ ] Q&A prep: Have answers ready for common judge questions

**GATE**: Demo works flawlessly, documentation complete, code is production-ready.

---

## 72-HOUR HACKATHON PHASE

### Hour 0-12: Integration & Validation
- [ ] Sanity check: API /forecast endpoint responds
- [ ] Dashboard smoke test: Load routes, chart renders
- [ ] Database: Confirm connection, data is accessible
- [ ] Models: Verify all 3 models load correctly
- [ ] Logs: Check for errors or warnings
- [ ] **Action**: Fix any blocker bugs immediately

### Hour 12-48: Feature Enhancement & Polish
- [ ] Recommendation engine: Implement "Optimal time to procure?" logic
- [ ] Feature importance: Add interactive chart showing drivers
- [ ] Model tuning: Retrain ensemble if new data available
- [ ] Dashboard UX: Polish charts, add legends, improve mobile responsiveness
- [ ] Error messages: Make them user-friendly
- [ ] **Action**: Iteratively improve accuracy and UX

### Hour 48-60: Testing & Documentation
- [ ] Unit tests: >80% code coverage
- [ ] Integration tests: E2E pipeline works
- [ ] Performance tests: Confirm <500ms latency
- [ ] README: Clear setup and usage instructions
- [ ] API docs: Swagger auto-generated
- [ ] Demo script: Test with canned data
- [ ] **Action**: Ensure everything is documented and tested

### Hour 60-72: Presentation & Final Prep
- [ ] Live demo: Forecast on 3+ routes without crashes
- [ ] Metrics visible: MAPE, latency, savings in slides
- [ ] Pitch rehearsed: 15 min, smooth transitions
- [ ] Q&A ready: Answers for accuracy, scalability, data access
- [ ] Deployment verified: Dashboard accessible online
- [ ] **Action**: Deliver confident, polished presentation

---

## SUCCESS METRICS (How to Know You've Won)

| Metric | Target | How to Measure |
|--------|--------|---|
| **Model Accuracy** | MAPE <15% | Run on test set, log MAPE value |
| **API Performance** | <500ms latency (p95) | Use Locust, capture latency histogram |
| **Forecast Reliability** | Confidence intervals capture >90% of actual values | Backtest on historical data |
| **Code Quality** | >80% test coverage, no lint errors | pytest-cov, ESLint report |
| **Demo Execution** | Zero crashes during live presentation | Dry-run before hackathon |
| **Documentation** | README, API docs, architecture diagram | Check GitHub repo |
| **Impact Quantification** | "X% savings on historical data" | Backtest with real dates/volumes |
| **Scalability** | Handles 100+ concurrent requests | Load test with Locust |
| **Deployment** | Live dashboard at public URL | Verify HTTPS works |

---

## RED FLAGS (Things That Will Hurt Your Score)

- ❌ Crashes during demo (even once = minus huge points)
- ❌ Accuracy <80% (MAPE >20%) = model not ready
- ❌ Latency >1s = API not performant
- ❌ Code is messy, no error handling, prints to console
- ❌ Can't explain why model recommends something (black box)
- ❌ Docker doesn't work locally (judges can't verify)
- ❌ No documentation (judges can't understand architecture)
- ❌ Overscoped features (unfinished, buggy)
- ❌ Can't quantify impact (vague claims about "savings")

---

## GREEN FLAGS (Things That Will Help You Win)

- ✅ Live working forecast without a single crash
- ✅ MAPE <12%, backtest shows 10%+ savings
- ✅ API responds <300ms consistently
- ✅ Feature importance chart + SHAP explains every forecast
- ✅ Clean code, proper error handling, comprehensive logs
- ✅ Docker works, CI/CD pipeline functional
- ✅ Great README, architecture diagram, API documentation
- ✅ Quantified impact: "Applied to 200M tonnes → $600M potential annual savings"
- ✅ Judges can run locally: `docker-compose up` → works

---

## RESOURCE LINKS

- **Datasets**: https://www.kaggle.com/search?q=shipping+freight
- **APIs**: MarineTraffic (AIS), IEA (fuel), Trading Economics (commodities)
- **ML Libraries**: Prophet, TensorFlow, XGBoost, scikit-learn
- **Backend**: FastAPI docs (https://fastapi.tiangolo.com)
- **Frontend**: React docs (https://react.dev), Recharts (https://recharts.org)
- **Deployment**: Render.com, Railway.app, AWS
- **Monitoring**: Prometheus, Grafana, ELK Stack

---

## CONTACT & SUPPORT

- Team communication: Use Slack/Discord for real-time collab
- Code reviews: Use GitHub pull requests (merge only reviewed code)
- Conflict resolution: Assign clear ownership per component
- Escalation: If stuck >2 hours, pivot to fallback plan

**Remember: Working MVP > Perfect but incomplete solution. Ship fast, iterate, win!**

---

*Last Updated: August 31, 2026 | SIH 2026 Problem Statement 26006*
