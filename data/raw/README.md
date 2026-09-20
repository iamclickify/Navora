# data/raw/

## manual_reference/

Static reference files that are **committed to git** and used at runtime.

| File | Used By | Notes |
|------|---------|-------|
| `vessel_specs.csv` | `vessel_ranking.py` (live API) | Canonical vessel data — all 7 classes with full cost schema (`fuel_per_day_t`, `daily_opex_usd`, `typical_port_fee_usd`) |

> **Do not duplicate** this file elsewhere in the repo.
> The root-level `data/vessel_specs.csv` and `data/processed/vessel_specs.csv`
> were removed (incomplete schema) — `manual_reference/vessel_specs.csv` is the single source of truth.
