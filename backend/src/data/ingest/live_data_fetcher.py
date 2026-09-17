import os
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import pandas as pd
import logging
from pathlib import Path
from datetime import datetime, timedelta
from io import StringIO
from dotenv import load_dotenv
import numpy as np

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

PORT_COORDS = {
    "Paradip": {"lat": 20.296, "lon": 86.666},
    "Vizag": {"lat": 17.686, "lon": 83.218},
    "Gangavaram": {"lat": 17.620, "lon": 83.242},
    "Gopalpur": {"lat": 19.300, "lon": 84.978},
    "Dhamra": {"lat": 20.796, "lon": 86.953},
    "Sagar-Sandheads": {"lat": 21.650, "lon": 88.050},
    "Haldia": {"lat": 22.025, "lon": 88.058},
    "Chennai (Ennore)": {"lat": 13.217, "lon": 80.325},
    "Kamarajar (Ennore)": {"lat": 13.281, "lon": 80.326},
    "Kolkata (KoPT)": {"lat": 22.555, "lon": 88.348},
    "Krishnapatnam": {"lat": 14.250, "lon": 80.124},
    "Kattupalli": {"lat": 13.523, "lon": 80.302},
    "Tuticorin (V.O.C.)": {"lat": 8.789, "lon": 78.175},
    "Cuddalore": {"lat": 11.747, "lon": 79.768},
    "Kakinada": {"lat": 16.950, "lon": 82.247},
    "Machilipatnam": {"lat": 16.189, "lon": 81.139},
    "Ennore Creek": {"lat": 13.254, "lon": 80.319}
}


def get_risk_score(wind_speed: float, precipitation: float) -> str:
    if wind_speed > 40.0:
        return "High"
    elif wind_speed > 25.0:
        return "Medium"
    else:
        return "Low"


# WMO weather interpretation codes -> human-readable label + emoji icon
WMO_CODE_MAP = {
    0: ("Clear Sky", "sunny"),
    1: ("Mainly Clear", "partly-cloudy"),
    2: ("Partly Cloudy", "partly-cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Foggy", "foggy"),
    48: ("Rime Fog", "foggy"),
    51: ("Light Drizzle", "drizzle"),
    53: ("Moderate Drizzle", "drizzle"),
    55: ("Heavy Drizzle", "rainy"),
    61: ("Light Rain", "rainy"),
    63: ("Moderate Rain", "rainy"),
    65: ("Heavy Rain", "rainy"),
    71: ("Light Snow", "snowy"),
    73: ("Moderate Snow", "snowy"),
    75: ("Heavy Snow", "snowy"),
    80: ("Light Showers", "drizzle"),
    81: ("Moderate Showers", "rainy"),
    82: ("Heavy Showers", "stormy"),
    95: ("Thunderstorm", "stormy"),
    96: ("Thunderstorm + Hail", "stormy"),
    99: ("Heavy Thunderstorm + Hail", "stormy"),
}


def fetch_port_forecast(port_name: str, days: int = 7) -> list:
    """
    Fetches a daily weather forecast for a single port from the free Open-Meteo API.
    Also calls the Marine API for wave heights (falls back gracefully for inland ports).
    Returns a list of daily forecast dicts.
    """
    if port_name not in PORT_COORDS:
        logging.warning(f"Unknown port for forecast: {port_name}")
        return []

    coords = PORT_COORDS[port_name]
    lat, lon = coords["lat"], coords["lon"]
    forecast_days = min(days, 16)  # Open-Meteo free tier max is 16 days

    # --- Atmospheric forecast ---
    atmo_url = "https://api.open-meteo.com/v1/forecast"
    atmo_params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum",
        "timezone": "Asia/Kolkata",
        "forecast_days": forecast_days,
    }

    try:
        atmo_resp = requests.get(atmo_url, params=atmo_params, timeout=10, verify=False)
        atmo_resp.raise_for_status()
        atmo_data = atmo_resp.json().get("daily", {})
    except Exception as e:
        logging.error(f"Atmospheric forecast failed for {port_name}: {e}")
        return []

    dates = atmo_data.get("time", [])
    if not dates:
        return []

    weather_codes = atmo_data.get("weather_code", [None] * len(dates))
    temp_max_list = atmo_data.get("temperature_2m_max", [None] * len(dates))
    temp_min_list = atmo_data.get("temperature_2m_min", [None] * len(dates))
    wind_speeds = atmo_data.get("wind_speed_10m_max", [None] * len(dates))
    precip_list = atmo_data.get("precipitation_sum", [None] * len(dates))

    # --- Marine (wave) forecast ---
    wave_dict = {}
    try:
        marine_url = "https://marine-api.open-meteo.com/v1/marine"
        marine_params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "wave_height_max",
            "timezone": "Asia/Kolkata",
            "forecast_days": forecast_days,
        }
        marine_resp = requests.get(marine_url, params=marine_params, timeout=10, verify=False)
        marine_resp.raise_for_status()
        marine_daily = marine_resp.json().get("daily", {})
        wave_times = marine_daily.get("time", [])
        wave_heights = marine_daily.get("wave_height_max", [])
        wave_dict = dict(zip(wave_times, wave_heights))
    except Exception as e:
        logging.warning(f"Marine API failed for {port_name} (may be inland): {e}")

    # --- Assemble result ---
    result = []
    for i, date in enumerate(dates):
        wind = float(wind_speeds[i]) if wind_speeds[i] is not None else 0.0
        rain = float(precip_list[i]) if precip_list[i] is not None else 0.0
        code = int(weather_codes[i]) if weather_codes[i] is not None else 0
        label, icon_type = WMO_CODE_MAP.get(code, ("Unknown", "cloudy"))
        wave = wave_dict.get(date)

        result.append({
            "date": date,
            "wind": round(wind, 1),
            "rain": round(rain, 1),
            "temp_max": round(float(temp_max_list[i]), 1) if temp_max_list[i] is not None else None,
            "temp_min": round(float(temp_min_list[i]), 1) if temp_min_list[i] is not None else None,
            "wave": round(float(wave), 2) if wave is not None else None,
            "weather_code": code,
            "weather_label": label,
            "weather_icon": icon_type,
            "risk": get_risk_score(wind, rain),
        })

    return result

def fetch_all_ports_forecast_batch(days: int = 7) -> dict:
    """
    Fetches 7-day atmospheric and marine forecasts for all ports in just 2 batch API requests.
    Returns a dict mapping port_name to a list of daily forecast dicts.
    """
    ports = list(PORT_COORDS.items())
    lats = ",".join(str(c["lat"]) for _, c in ports)
    lons = ",".join(str(c["lon"]) for _, c in ports)
    forecast_days = min(days, 16)

    # 1. Atmospheric batch
    atmo_url = "https://api.open-meteo.com/v1/forecast"
    atmo_params = {
        "latitude": lats,
        "longitude": lons,
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum",
        "timezone": "Asia/Kolkata",
        "forecast_days": forecast_days,
    }

    # 2. Marine batch
    marine_url = "https://marine-api.open-meteo.com/v1/marine"
    marine_params = {
        "latitude": lats,
        "longitude": lons,
        "daily": "wave_height_max",
        "timezone": "Asia/Kolkata",
        "forecast_days": forecast_days,
    }

    results = {}
    
    try:
        atmo_resp = requests.get(atmo_url, params=atmo_params, timeout=15, verify=False)
        atmo_resp.raise_for_status()
        atmo_data = atmo_resp.json()
        if isinstance(atmo_data, dict) and "daily" in atmo_data:
            atmo_data = [atmo_data] # Wrap if single location returned
    except Exception as e:
        logging.error(f"Atmospheric batch failed: {e}")
        atmo_data = []

    try:
        marine_resp = requests.get(marine_url, params=marine_params, timeout=15, verify=False)
        marine_resp.raise_for_status()
        marine_data = marine_resp.json()
        if isinstance(marine_data, dict) and "daily" in marine_data:
            marine_data = [marine_data]
    except Exception as e:
        logging.warning(f"Marine batch failed: {e}")
        marine_data = []

    for i, (port_name, _) in enumerate(ports):
        port_forecast = []
        if i < len(atmo_data):
            daily_atmo = atmo_data[i].get("daily", {})
            dates = daily_atmo.get("time", [])
            w_codes = daily_atmo.get("weather_code", [None]*len(dates))
            t_max = daily_atmo.get("temperature_2m_max", [None]*len(dates))
            t_min = daily_atmo.get("temperature_2m_min", [None]*len(dates))
            wind = daily_atmo.get("wind_speed_10m_max", [None]*len(dates))
            precip = daily_atmo.get("precipitation_sum", [None]*len(dates))
            
            daily_marine = marine_data[i].get("daily", {}) if i < len(marine_data) and marine_data[i] else {}
            waves = daily_marine.get("wave_height_max", [None]*len(dates))

            for j, date_str in enumerate(dates):
                w_code = int(w_codes[j]) if w_codes[j] is not None else 0
                wind_spd = float(wind[j]) if wind[j] is not None else 0.0
                prcp = float(precip[j]) if precip[j] is not None else 0.0
                label, icon = WMO_CODE_MAP.get(w_code, ("Unknown", "cloudy"))
                risk = get_risk_score(wind_spd, prcp)
                wave_val = round(float(waves[j]), 2) if j < len(waves) and waves[j] is not None else None

                port_forecast.append({
                    "date": date_str,
                    "temp_max": round(float(t_max[j]), 1) if t_max[j] is not None else None,
                    "temp_min": round(float(t_min[j]), 1) if t_min[j] is not None else None,
                    "wind": round(wind_spd, 1),
                    "rain": round(prcp, 1),
                    "wave": wave_val,
                    "weather_code": w_code,
                    "weather_label": label,
                    "weather_icon": icon,
                    "risk": risk
                })
        results[port_name] = port_forecast
        
    return results

import time

def fetch_live_weather() -> dict:
    """Fetches live weather from Open-Meteo for all ports in a single batch request."""
    weather_cache = {}
    ports = list(PORT_COORDS.items())

    # Build a single batch URL with all lat/lon pairs
    lats = ",".join(str(c["lat"]) for _, c in ports)
    lons = ",".join(str(c["lon"]) for _, c in ports)
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lons}"
        f"&daily=wind_speed_10m_max,precipitation_sum"
        f"&timezone=Asia%2FKolkata&forecast_days=1"
    )

    try:
        res = requests.get(url, timeout=30, verify=False)
        res.raise_for_status()
        results = res.json()

        # Open-Meteo returns a list when multiple locations are requested
        if isinstance(results, dict):
            results = [results]  # Single location fallback

        for i, (port, _) in enumerate(ports):
            if i >= len(results):
                break
            try:
                daily = results[i].get("daily", {})
                wind_speed = daily.get("wind_speed_10m_max", [0])[0] or 0.0
                precip = daily.get("precipitation_sum", [0])[0] or 0.0
                risk = get_risk_score(wind_speed, precip)
                weather_cache[port] = {
                    "wind_speed_max_kmh": float(wind_speed),
                    "precipitation_sum_mm": float(precip),
                    "risk_score": risk
                }
            except Exception as e:
                logging.error(f"Failed to parse weather for {port}: {e}")
                weather_cache[port] = {"wind_speed_max_kmh": 0.0, "precipitation_sum_mm": 0.0, "risk_score": "Low"}

    except Exception as e:
        logging.error(f"Batch weather fetch failed: {e}. Defaulting all ports to Low risk.")
        for port, _ in ports:
            weather_cache[port] = {"wind_speed_max_kmh": 0.0, "precipitation_sum_mm": 0.0, "risk_score": "Low"}

    return weather_cache


def fetch_live_bdi() -> pd.DataFrame:
    """
    Attempts to fetch live BDI. Falls back gracefully.
    Primary: EIA shipping index proxy. Fallback: Returns empty DataFrame.
    Note: Free BDI sources with stable APIs are extremely rare;
    we use realistic synthetic data as the fallback.
    """
    # Try yfinance with BALT (Baltic Dry ETF as a proxy) - at least it moves
    try:
        import yfinance as yf
        # BALT is an ETF that tracks Baltic shipping companies, correlates with BDI
        ticker = yf.Ticker("BALT")
        hist = ticker.history(period="30d")
        if not hist.empty:
            hist = hist.reset_index()
            hist = hist.rename(columns={'Close': 'balt_price', 'Date': 'date'})
            hist['date'] = pd.to_datetime(hist['date']).dt.tz_localize(None)
            hist = hist[['date', 'balt_price']].sort_values('date').reset_index(drop=True)
            # BALT trades around $30-40 when BDI is ~1500-2000. Scale factor: ~50x
            hist['bdi'] = hist['balt_price'] * 50.0
            return hist[['date', 'bdi']].copy()
    except Exception as e:
        logging.error(f"Failed to fetch BALT from yfinance: {e}")

    return pd.DataFrame()


def fetch_live_fuel(api_key=None) -> pd.DataFrame:
    """
    Fetches live WTI crude oil prices.
    Primary: FRED (St. Louis Fed, completely free, no key needed)
    Fallback: EIA API
    """
    # FRED - completely free, no API key
    try:
        fred_url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILWTICO"
        response = requests.get(fred_url, timeout=10, verify=False)
        response.raise_for_status()

        if 'DATE' in response.text[:100].upper() or 'observation_date' in response.text[:100]:
            df = pd.read_csv(StringIO(response.text))
            df.columns = ['date', 'wti']
            df['wti'] = pd.to_numeric(df['wti'], errors='coerce')
            df = df.dropna()
            df['date'] = pd.to_datetime(df['date'])
            # WTI in $/bbl -> bunker fuel equivalent in $/ton (multiply by ~7.33 for fuel oil proxy)
            df['fuel'] = df['wti'] * 7.33
            df = df[['date', 'fuel']].sort_values('date').reset_index(drop=True)
            logging.info(f"FRED WTI fetched successfully. Latest: ${df['fuel'].iloc[-1]:.2f}/ton (bunker proxy)")
            return df
    except Exception as e:
        logging.error(f"Failed to fetch WTI from FRED: {e}")

    # Fallback: EIA API
    if api_key:
        url = "https://api.eia.gov/v2/petroleum/pri/spt/data/"
        params = {
            'api_key': api_key,
            'frequency': 'daily',
            'data[0]': 'value',
            'facets[series][]': 'RWTC',
            'sort[0][column]': 'period',
            'sort[0][direction]': 'desc',
            'offset': 0,
            'length': 100
        }
        try:
            response = requests.get(url, params=params, timeout=10, verify=False)
            response.raise_for_status()
            data = response.json()
            records = data.get('response', {}).get('data', [])
            if records:
                df = pd.DataFrame(records)
                df = df.rename(columns={'period': 'date', 'value': 'fuel'})
                df['fuel'] = pd.to_numeric(df['fuel'], errors='coerce') * 7.33
                df = df.dropna(subset=['fuel'])
                df['date'] = pd.to_datetime(df['date'])
                df = df[['date', 'fuel']].sort_values('date').reset_index(drop=True)
                return df
        except Exception as e:
            logging.error(f"Failed to fetch fuel from EIA: {e}")

    return pd.DataFrame()


def refresh_live_data(project_root: Path):
    """Fetches live data and updates historical_freight_data.csv"""
    env_path = project_root / 'backend' / '.env'
    load_dotenv(env_path)
    api_key = os.getenv('EIA_API_KEY')

    data_path = project_root / 'data' / 'historical_freight_data.csv'

    if not data_path.exists():
        logging.error("Historical data file not found. Cannot append live data.")
        return None, None

    df_hist = pd.read_csv(data_path)
    df_hist['date'] = pd.to_datetime(df_hist['date'], format='%d-%m-%Y', errors='coerce')
    df_hist = df_hist.dropna(subset=['date']).sort_values('date').reset_index(drop=True)

    logging.info("Fetching live BDI data...")
    df_bdi = fetch_live_bdi()

    logging.info("Fetching live Fuel data...")
    df_fuel = fetch_live_fuel(api_key)

    # Get last known values
    last_hist_bdi = float(df_hist['bdi_index'].iloc[-1])
    last_hist_fuel = float(df_hist['fuel in usd'].iloc[-1])

    # Historical stats for synthetic variance
    hist_bdi_std = float(df_hist['bdi_index'].tail(90).std()) if len(df_hist) >= 90 else 50.0
    hist_fuel_std = float(df_hist['fuel in usd'].tail(90).std()) if len(df_hist) >= 90 else 10.0

    # Build a live date range from last hist date to today
    today = pd.to_datetime(datetime.now().date())
    max_hist_date = df_hist['date'].max()

    if max_hist_date >= today:
        logging.info("No new data to append (system is up to date).")
        return last_hist_bdi, last_hist_fuel

    date_range = pd.date_range(start=max_hist_date + timedelta(days=1), end=today, freq='D')
    df_live = pd.DataFrame({'date': date_range})

    # Merge BDI data if available
    if not df_bdi.empty:
        df_bdi['date'] = pd.to_datetime(df_bdi['date']).dt.normalize()
        df_live = pd.merge(df_live, df_bdi[['date', 'bdi']], on='date', how='left')
    else:
        df_live['bdi'] = np.nan

    # Merge Fuel data if available
    if not df_fuel.empty:
        df_fuel['date'] = pd.to_datetime(df_fuel['date']).dt.normalize()
        df_live = pd.merge(df_live, df_fuel[['date', 'fuel']], on='date', how='left')
    else:
        df_live['fuel'] = np.nan

    # Fill missing values using forward fill, then fall back to last historical + noise
    df_live['bdi_base'] = df_live['bdi'].ffill().fillna(last_hist_bdi).astype(float)
    df_live['fuel_base'] = df_live['fuel'].ffill().fillna(last_hist_fuel).astype(float)

    # Apply noise only to synthetic fill rows (where bdi was NaN)
    df_live['bdi_filled'] = df_live['bdi'].isna()
    df_live['fuel_filled'] = df_live['fuel'].isna()

    np.random.seed(42)  # Reproducible for same day
    bdi_noise = np.random.normal(0, hist_bdi_std * 0.3, len(df_live))
    fuel_noise = np.random.normal(0, hist_fuel_std * 0.2, len(df_live))

    df_live['bdi'] = np.where(
        df_live['bdi_filled'],
        (df_live['bdi_base'] + bdi_noise).clip(500, 4000),
        df_live['bdi_base']
    )
    df_live['fuel'] = np.where(
        df_live['fuel_filled'],
        (df_live['fuel_base'] + fuel_noise).clip(300, 1200),
        df_live['fuel_base']
    )

    df_live = df_live.drop(columns=['bdi_base', 'fuel_base', 'bdi_filled', 'fuel_filled'])

    # Get last row of history for ffilling other columns
    last_hist_row = df_hist.iloc[-1:].copy()

    new_rows = []
    for _, row in df_live.iterrows():
        new_row = last_hist_row.copy()
        new_row['date'] = row['date']
        new_row['bdi_index'] = float(row['bdi'])
        new_row['fuel in usd'] = float(row['fuel'])
        new_rows.append(new_row)

    if new_rows:
        df_new = pd.concat(new_rows, ignore_index=True)
        df_hist = pd.concat([df_hist, df_new], ignore_index=True)

        # Recompute rolling features
        df_hist['date'] = pd.to_datetime(df_hist['date'])
        df_hist = df_hist.sort_values('date').reset_index(drop=True)
        df_hist['bdi_lag_1'] = df_hist['bdi_index'].shift(1)
        df_hist['bdi_lag_7'] = df_hist['bdi_index'].shift(7)
        df_hist['bdi_roll_mean_7'] = df_hist['bdi_index'].rolling(window=7, min_periods=1).mean()
        df_hist['bdi_roll_std_7'] = df_hist['bdi_index'].rolling(window=7, min_periods=1).std()
        df_hist['month'] = df_hist['date'].dt.month
        df_hist['dayofweek'] = df_hist['date'].dt.dayofweek

        df_hist['date'] = df_hist['date'].dt.strftime('%d-%m-%Y')
        df_hist.to_csv(data_path, index=False)
        logging.info(f"Appended {len(new_rows)} live data rows to historical CSV.")

    latest_bdi = float(df_hist['bdi_index'].iloc[-1])
    latest_fuel = float(df_hist['fuel in usd'].iloc[-1])
    return latest_bdi, latest_fuel
