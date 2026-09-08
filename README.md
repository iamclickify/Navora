# Navora

Navora is an advanced, data-driven maritime logistics platform designed to optimize freight rates, vessel selection, and voyage planning. Built to transform complex supply chain variables into actionable intelligence, Navora empowers shipping operators to reduce idle times, cut costs, and make informed decisions with high confidence.

This document details the technical architecture, technology choices, data pipelines, and machine learning models driving Navora's core capabilities.

---

## 🛠️ Technology Stack & Architectural Decisions

When architecting Navora, the primary goal was to bridge the gap between heavy machine learning workloads and a responsive, interactive user experience. We needed a stack that allowed rapid iteration while maintaining the rigor required for accurate forecasting.

### 1. Frontend: React + Vite + Tailwind CSS + Recharts
* **Why we chose it:** React is the industry standard for building modular, state-driven interfaces. Paired with Vite, it provides an incredibly fast development environment. Tailwind CSS ensures our UI remains consistent and performant without the overhead of heavy component libraries. Recharts was selected for its native React integration and ability to render complex time-series data with confidence intervals smoothly.
* **Alternatives considered:** Next.js (Overkill for a SPA dashboard that relies heavily on client-side interactivity rather than SEO), Angular (Steeper learning curve, slower iteration speed for a rapid prototype).

### 2. Backend API: FastAPI (Python)
* **Why we chose it:** FastAPI is asynchronous, incredibly fast, and integrates seamlessly with Python's data science ecosystem (Pandas, Scikit-Learn, Prophet, XGBoost). It automatically generates OpenAPI documentation and uses Pydantic for robust data validation, which is critical when handling numerical limits for vessel constraints and freight rates.
* **Alternatives considered:** Flask (Lacks native async support and out-of-the-box data validation), Django (Too monolithic and heavy for a microservices-style API serving ML predictions), Node.js/Express (Poor native support for Python-based ML models without complex IPC or microservice bridging).

### 3. Containerization: Docker
* **Why we chose it:** To eliminate "it works on my machine" issues and ensure consistent deployments across the ML team and frontend team.
* **Alternatives considered:** Local virtual environments only (Prone to dependency conflicts between ML libraries and OS-level drivers).

---

##  Data Engineering: Sources & Pipelines

Navora's intelligence relies on a robust data foundation. We intentionally targeted high-quality, publicly available data streams and official government proxies to maintain feasibility without compromising on the realism of our predictions.

### Core Data Sources
1. **Freight Rates (The Target Variable `y`)**
   * **Source:** Baltic Dry Index (BDI) historical data (via Investing.com / Kaggle).
   * **Timeline:** Dataset covers 2–3 years of daily historical data to accurately capture long-term trends and yearly seasonality.
   * **Why:** The BDI is the global benchmark for bulk shipping. It provides the daily ground truth that our models aim to predict.
2. **Fuel & Bunker Prices**
   * **Source:** U.S. Energy Information Administration (EIA) API v2.
   * **Details:** We use Crude Oil Spot Prices (WTI/Brent) as the primary fuel-cost driver proxy, which heavily correlates with marine bunker fuel costs.
3. **Commodity Prices**
   * **Source:** World Bank "Pink Sheet" Commodity Price Data.
   * **Details:** Monthly data for iron ore and coal (Australian & South African) to track macroeconomic demand signals.
4. **Weather & Sea State**
   * **Source:** Open-Meteo Marine API.
   * **Timeline:** Dataset covers 1–2 years of historical daily marine weather data.
   * **Details:** We pull localized wave height, swell, and wind speed for 7 East Coast Indian ports (e.g., Paradip, Vizag, Haldia) to model port delay risks.
5. **Static Reference Data & Port Constraints**
   * **Source:** Ministry of Ports, Shipping and Waterways (MoPSW) & Port Authority specs.
   * **Details:** Vessel capacities (Capesize, Panamax, Supramax, Handysize) and strict physical port constraints.
   * **Terminology:**
     * **Draft (m):** The maximum depth of the ship underwater. Ports restrict this based on their channel depth to prevent grounding.
     * **LOA (Length Overall) (m):** The total maximum length of a vessel the port's berth can safely accommodate.
     * **Beam (m):** The maximum width of a vessel, often restricted by the reach of loading cranes or lock gates.
     * **Cargo Capacity (t):** The maximum Deadweight Tonnage (DWT) the berth infrastructure is built to handle.
6. **Origin-Commodity Flows**
   * **Details:** We map logical trade lanes based on real-world commodity exports to avoid nonsensical routing.
   * **Source & Research:** 
     * **Australia:** World's leading exporter of Iron Ore and Metallurgical Coal (Source: Australian Government Dept. of Industry).
     * **Indonesia:** World's leading exporter of Thermal Coal (Source: IEA).
     * **Mozambique:** Coking coal and mineral sands.
     * **Russia:** Fertilizers (MOP, NPK) and Coal.
7. **Port Congestion (Proxy)**
   * **Details:** Instead of relying on expensive, paid real-time AIS data for the prototype, we use a calibrated synthetic congestion score anchored to real MoPSW benchmarks (49.5 hours average turnaround, 16.5% idle time).

### Data Pipeline Flow
Raw data is stored immutably in `data/raw/`. It undergoes rigorous cleaning: chronological sorting, forward-filling for non-trading days, and cross-source alignment (ensuring "Vizag" is identically named everywhere). Cleaned, model-ready data resides in `data/processed/`.

---

##  Machine Learning & Optimization Models

Navora rests on four analytical pillars. We favor explainability and reliability over opaque, overly complex models.

### Pillar A: Freight Rate Forecasting (The Ensemble Model)
Our core forecasting engine is an ensemble of two distinct algorithms, designed to balance time-series mechanics with external economic drivers.

1. **Meta's Prophet**
   * **Role:** Captures the baseline time-series mechanics (trend, yearly/weekly seasonality, and holiday effects).
   * **Why:** Prophet is exceptionally robust to missing data and shifts in trend. It provides the baseline trajectory and statistical confidence intervals natively.
2. **XGBoost (eXtreme Gradient Boosting)**
   * **Role:** Learns the complex, non-linear relationships between the freight rate and external drivers (fuel prices, lagged historical rates, commodity prices).
   * **Why:** Unlike Prophet, XGBoost can tell us *why* a rate is changing. We use it to generate explainable feature importance (e.g., "Fuel prices are driving 40% of this spike").
* **The Ensemble:** The final forecast is a weighted combination of Prophet's trajectory and XGBoost's driver-based adjustments.
* **Alternatives considered:** LSTM (Long Short-Term Memory neural networks). While LSTMs are powerful for sequence prediction, they require massive data, are computationally expensive to train, and act as "black boxes." In shipping, operators need to understand *why* a rate is predicted to move; hence, the explainable Prophet + XGBoost ensemble was chosen for the MVP.

### Pillar B: Vessel Feasibility & Cost Ranking
Before a vessel is recommended, it must physically fit the port.
* **Approach:** A deterministic constraint filter. We filter vessels based on strict physical limits: `vessel_draft <= port_draft`, `vessel_loa <= port_max_loa`.
* **Ranking:** Surviving vessels are ranked via a transparent cost function: `Total Cost = (Capacity * Predicted Freight Rate) + Port Fees + (Daily Opex * Transit Days)`.
* **Why not ML here?:** Physical constraints are absolute. An ML model "guessing" if a Capesize fits into a shallow port is dangerous and unnecessary. Deterministic logic is faster and safer.

### Pillar C: Multi-Voyage Optimization (Minimizing Idle Time)
* **Approach:** Greedy Dynamic Programming (DP) Scheduler.
* **How it works:** Given multiple voyage windows and vessel availabilities, the algorithm sequentially assigns voyages to the earliest feasible slots, aggressively minimizing the delta (idle time) between a vessel's drop-off and its next pick-up.
* **Alternatives considered:** Reinforcement Learning (RL). While RL is the theoretical gold standard for multi-agent scheduling, it is notoriously unstable and difficult to converge quickly. The Greedy DP approach guarantees a mathematical optimum for our defined scope, successfully demonstrating our target reduction of idle time (from ~35% down to ~8%).

### Pillar D: Sensitivity & Risk Analysis
* **Approach:** Parameterized scenario modeling.
* **How it works:** The XGBoost model's input features are dynamically adjusted via the frontend (e.g., injecting a +15% fuel price shock). The model is instantly re-run to project the new freight rate. This allows operators to test "what-if" scenarios in real-time.

---
<img src="" alt=""></img>

