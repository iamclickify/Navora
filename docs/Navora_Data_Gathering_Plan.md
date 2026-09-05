# Navora (SIH26006) — Master Dataset: Data Gathering & Cleaning Plan
### For: Data Gathering & Cleaning Owner
### Principle: gather the FULL scope once, now. The demo will only display a slice of it — that's a filtering decision made later in code, not a reason to gather less data today.

---

## 0. What you're building — the master dataset map

By the end of this, you should have **8 clean files** sitting in `data/processed/`, matching the data model in the PRD (§13.1). Two of these are things the *system* generates later (not your job) — the rest are yours.

| # | File | You gather this? | Grain (one row = ) |
|---|---|---|---|
| 1 | `freight_rates.csv` | **Yes** | one date × one route/index |
| 2 | `fuel_prices.csv` | **Yes** | one date |
| 3 | `commodity_prices.csv` | **Yes** | one date × one commodity |
| 4 | `weather.csv` | **Yes** | one date × one port location |
| 5 | `port_specs.csv` | **Yes** (static/reference) | one port |
| 6 | `vessel_specs.csv` | **Yes** (static/reference) | one vessel class |
| 7 | `origin_commodities.csv` | **Yes** (static/reference, from PRD) | one origin × commodity |
| 8 | `port_observations.csv` (congestion/queue) | **Yes**, but synthetic/proxy — see §8 | one date × one port |
| — | `forecast_runs`, `voyage_plans` | No — generated later by the ML/optimization code, not raw data | — |

Save **everything you download in its original raw form too**, in `data/raw/<source_name>/`, before you touch it. Never overwrite a raw download — always write cleaned output to a new file in `data/processed/`. This matters because if a cleaning step turns out wrong two weeks from now, you need to redo it from the original, not from an already-mangled file.

---

## 1. Freight rate data (`freight_rates.csv`) — THE MOST IMPORTANT FILE

This is the number the entire ML model is trying to predict. Get this right first; everything else is secondary.

**Primary source: Baltic Dry Index (BDI) — daily, since it's the global benchmark your PRD names**
- Try: `investing.com/indices/baltic-dry-historical-data` — has a downloadable historical table (select date range, export).
- Also search Kaggle directly for **"Baltic Dry Index"** or **"bulk shipping freight rate"** — multiple ready-made CSVs exist there; dataset links on Kaggle change often, so search rather than relying on a fixed URL. Prefer datasets that go back **at least 2–3 years of daily data**.
- Cross-check numbers against Trading Economics (`tradingeconomics.com/commodity/baltic`) — you won't get a free download there, but use it to sanity-check that your Kaggle/Investing.com numbers look right for known recent dates.

**Get if possible (nice-to-have, not blocking):** sub-indices — Capesize, Panamax, Supramax indices separately (same sources as above often list these too). These map directly to your four vessel classes and would strengthen Pillar B later.

**Target columns after cleaning:**
| column | type | notes |
|---|---|---|
| `date` | YYYY-MM-DD | must be sorted ascending, no duplicate dates |
| `bdi` | float | Baltic Dry Index value |
| `capesize_index` | float (nullable) | if available |
| `panamax_index` | float (nullable) | if available |
| `supramax_index` | float (nullable) | if available |

**Cleaning checklist:**
- Convert whatever date format the source uses to `YYYY-MM-DD`.
- Sort chronologically ascending.
- Check for gaps (missing dates, e.g. weekends/holidays where index isn't published) — **do not delete these rows if the source simply doesn't publish that day; that's expected**, but flag actual missing/corrupted values.
- Fill small gaps (1–2 missing days) with forward-fill (`ffill`); leave a note if any gap is longer than 5 days.
- Remove obvious typos/outliers (e.g. a single-day 10x spike that doesn't appear in any news) — but log what you removed, don't just silently delete.

---

## 2. Fuel / bunker price data (`fuel_prices.csv`)

**Source: EIA (U.S. Energy Information Administration) API v2 — free, official government data**
- Register a free key (30 seconds): `eia.gov/opendata/register.php`
- API docs / browser: `eia.gov/opendata`
- Use route: `petroleum/pri/spt` (petroleum spot prices) — pull **Crude Oil (WTI or Brent)** spot price as the fuel-cost driver proxy. This isn't literally "bunker fuel," it's the standard, well-correlated public proxy for it — label it as such.

**Target columns:**
| column | type | notes |
|---|---|---|
| `date` | YYYY-MM-DD | |
| `crude_oil_spot_usd` | float | WTI or Brent, pick one and be consistent |
| `source_series_id` | text | the EIA series ID you pulled, for traceability |

**Cleaning checklist:** same as freight rates — sort, dedupe, forward-fill small gaps, log outliers.

---

## 3. Commodity price data (`commodity_prices.csv`)

**Source: World Bank "Pink Sheet" Commodity Price Data — free, monthly, official**
- `worldbank.org/en/research/commodity-markets` — downloadable Excel file, updated monthly, includes **coal (Australian & South African)** and **iron ore** prices, which are exactly the commodities in your PRD's origin-commodity table.

**Target columns:**
| column | type | notes |
|---|---|---|
| `date` | YYYY-MM (monthly grain — that's what World Bank publishes) | |
| `commodity` | text | `iron_ore`, `coal_australian`, `coal_south_african`, etc. |
| `price_usd` | float | units as published (check the sheet header — usually $/mt) |

**Cleaning checklist:**
- The World Bank file comes as a wide Excel sheet (commodities as columns, months as rows) — **reshape it into long format** (one row per date×commodity, as above), don't keep it wide.
- Keep the unit from the source header in a `units` column if it varies by commodity.

---

## 4. Weather / sea-state data (`weather.csv`)

**Source: Open-Meteo — completely free, no API key needed, has historical + marine data**
- Standard historical weather: `open-meteo.com`
- Marine-specific (wave height, swell) — genuinely useful for your "port delay" risk factor: `marine-api.open-meteo.com`
- Pull data for the **lat/long of each of the 7 East Coast ports** (Paradip, Vizag, Gangavaram, Gopalpur, Dhamra, Sagar-Sandheads, Haldia) — look up each port's coordinates (a simple web search per port name + "coordinates" or "port location" gets you this).

**Target columns:**
| column | type | notes |
|---|---|---|
| `date` | YYYY-MM-DD | |
| `port` | text | must match the `port` name used in `port_specs.csv` exactly |
| `wind_speed_kmh` | float | |
| `wave_height_m` | float | from the marine API |
| `precipitation_mm` | float | monsoon signal |

**Cleaning checklist:** one file, all 7 ports stacked (long format, not 7 separate files). Sort by port then date.

---

## 5. Port specifications (`port_specs.csv`) — static reference table

**You already have this — it's in the PRD (§6.1) and was presumably sourced from the Ministry of Ports, Shipping & Waterways and individual port authority sites (both already cited in your PPT's references slide).** Your job here is just to formalize it as a clean CSV and double check the numbers against the original sources if time allows:
- Ministry of Ports, Shipping and Waterways: search "MoPSW annual report" / port statistics
- Visakhapatnam Port Authority, Paradip Port Authority — individual port sites for draft/LOA/berth specs

**Target columns (exactly matches PRD table):**
| column | type |
|---|---|
| `port` | text (Paradip, Vizag, Gangavaram, Gopalpur, Dhamra, Sagar-Sandheads, Haldia) |
| `draft_m` | float |
| `max_loa_m` | float |
| `beam_m` | float |
| `cargo_capacity_t` | int |
| `main_commodities` | text (comma-separated) |
| `suitable_vessel_types` | text (comma-separated) |
| `latitude` | float (add this — needed for weather API pulls above) |
| `longitude` | float (add this) |

---

## 6. Vessel specifications (`vessel_specs.csv`) — static reference table

This one wasn't fully in your PRD as a data table (only vessel *names* were), so it needs sourcing. Use industry-standard reference ranges (these are well-established maritime industry classifications, consistent across sources like MarineInsight and standard shipping references):

| vessel_class | draft_m (typical max) | loa_m (typical) | beam_m (typical) | dwt_range_t |
|---|---|---|---|---|
| Handysize | ~10–11 | 150–190 | ~27–30 | 15,000–39,999 |
| Supramax | ~11–12.5 | 180–200 | ~32 | 50,000–60,000 |
| Panamax | ~13–14 | up to 294 | ~32.2–32.3 | 65,000–80,000 |
| Capesize | ~17–18 | 290+ | ~45+ | 100,000–200,000+ |

**Action for you:** search "[vessel class] bulk carrier specifications draft beam LOA" for each of the 4 classes to pull 2–3 confirming sources and settle on single representative numbers (not ranges) for the CSV — the optimization code needs one number per column, not a range. Also research **typical daily operating cost (opex)** per class and **typical port fees** — search "[vessel class] daily charter rate" or "[vessel class] operating cost per day" — this feeds the vessel-ranking cost formula.

**Target columns:**
| column | type |
|---|---|
| `vessel_class` | text (Handysize/Supramax/Panamax/Capesize) |
| `draft_m` | float |
| `loa_m` | float |
| `beam_m` | float |
| `capacity_t` | int (use the midpoint of the DWT range) |
| `daily_opex_usd` | float |
| `typical_port_fee_usd` | float |

---

## 7. Origin–commodity flow data (`origin_commodities.csv`) — static reference table

**You already have this too — it's PRD §6.2.** Just turn it into a clean CSV:

| column | type |
|---|---|
| `origin` | text (Australia, US East Coast, Mozambique, Russia, Indonesia) |
| `commodity` | text |
| `commodity_share_pct` | float |
| `target_ports` | text (comma-separated port names — must match `port_specs.csv`) |
| `typical_vessel_class` | text |
| `typical_transit_days_min` | int |
| `typical_transit_days_max` | int |

---

## 8. Port congestion / queue data (`port_observations.csv`) — PROXY, not real AIS

**Do not spend time chasing real AIS/MarineTraffic data — it's paid and not worth the effort for a demo.** Instead, build a documented synthetic generator so the number is at least *calibrated* to something real:

- Anchor values you already have and cited in your own deck: **average vessel turnaround ≈ 49.5 hours, ≈16.5% idle time** (Ministry of Ports, Shipping & Waterways, Press Release FY 2024-25 — you already have this link in your PPT references).
- Build a per-port-per-day "congestion score" (0–1 scale) using something like: `base_congestion (per port, based on relative traffic volume) + random noise + seasonal bump during monsoon months`.
- **Document the exact formula you use in a comment at the top of the script**, and store it as `port_observations.csv`:

| column | type |
|---|---|
| `date` | YYYY-MM-DD |
| `port` | text |
| `congestion_score` | float (0–1) |
| `avg_queue_length_vessels` | int (derived from congestion_score) |
| `avg_wait_hours` | float (derived, anchored to the 49.5 hr benchmark) |
| `is_synthetic` | boolean — always `TRUE` for this file, so nobody downstream forgets it's a proxy |

---

## 9. Folder structure to deliver

```
data/
├── raw/                          <- untouched downloads, one subfolder per source
│   ├── bdi/
│   ├── eia_fuel/
│   ├── worldbank_commodities/
│   ├── openmeteo_weather/
│   └── manual_reference/         <- port specs, vessel specs, origin flows (before cleaning)
└── processed/                    <- the 8 clean files listed in §0, final versions
    ├── freight_rates.csv
    ├── fuel_prices.csv
    ├── commodity_prices.csv
    ├── weather.csv
    ├── port_specs.csv
    ├── vessel_specs.csv
    ├── origin_commodities.csv
    └── port_observations.csv
```

Also write one short `data/README.md` documenting: source + link + date pulled + date range covered, for each of the 8 files. This is what goes into your final project README and what a judge would ask about if they question your data provenance.

---

## 10. Data quality checklist (run before marking any file "done")

- [ ] No duplicate rows on the grain key (e.g. no two rows for the same `date` in `freight_rates.csv`)
- [ ] Dates are all valid, consistent format (`YYYY-MM-DD`), sorted ascending
- [ ] No column left as raw scraped text where it should be numeric (check for stray `$`, `,`, `%` symbols not stripped)
- [ ] Every `port` name and `vessel_class` name is spelled **identically** across all files that reference it (this is the #1 source of silent bugs later — a join failing because "Vizag" vs "Visakhapatnam" won't error, it'll just silently drop rows)
- [ ] Missing values are handled deliberately (forward-fill, drop, or flag) — never silently left as blank/NaN without a decision
- [ ] Each file has at least 1–2 years of history where a real time series is involved (freight, fuel, commodities, weather)
- [ ] `data/README.md` written with source + link + pull date for every file

---

## 11. Suggested order of work (do NOT wait to gather everything before starting Prophet — hand off `freight_rates.csv` first)

| Priority | File | Why first/last |
|---|---|---|
| 1 | `freight_rates.csv` | Blocks all ML work — hand this off to the forecasting person the moment it's clean, even before the rest is done |
| 2 | `port_specs.csv`, `vessel_specs.csv`, `origin_commodities.csv` | Static, fast, unblocks Pillar B (vessel optimization) early |
| 3 | `fuel_prices.csv`, `commodity_prices.csv` | Needed for XGBoost driver features, but forecasting can start with just freight rates + date features while these are being prepared |
| 4 | `weather.csv` | Lower priority — only needed for the risk/sensitivity pillar, can come later |
| 5 | `port_observations.csv` (synthetic) | Last — needs `port_specs.csv` to exist first, and is the least data-integrity-sensitive since it's documented as a proxy |

**Bottom line for your teammate:** don't block the ML person waiting for a "complete" master dataset — ship `freight_rates.csv` clean and early, then keep filling in the rest of the files in the priority order above while forecasting work proceeds in parallel.
