import pandas as pd
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def main():
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    raw_ref_dir = project_root / 'data' / 'raw' / 'manual_reference'
    processed_dir = project_root / 'data' / 'processed'
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    files_to_validate = {
        'port_specs.csv': ['port', 'draft_m', 'max_loa_m', 'beam_m', 'cargo_capacity_t', 'main_commodities', 'suitable_vessel_types', 'latitude', 'longitude'],
        'vessel_specs.csv': ['vessel_class', 'draft_m', 'loa_m', 'beam_m', 'capacity_t', 'daily_opex_usd', 'typical_port_fee_usd'],
        'origin_commodities.csv': ['origin', 'commodity', 'commodity_share_pct', 'target_ports', 'typical_vessel_class', 'typical_transit_days_min', 'typical_transit_days_max']
    }
    
    for filename, required_cols in files_to_validate.items():
        filepath = raw_ref_dir / filename
        if not filepath.exists():
            logging.warning(f"File missing: {filepath}. Skipping validation.")
            continue
            
        try:
            df = pd.read_csv(filepath)
            
            # Standardize column names to lower case and strip spaces
            df.columns = df.columns.str.lower().str.strip()
            
            # Ensure required columns exist, insert as NaN if missing
            for col in required_cols:
                if col not in df.columns:
                    logging.warning(f"Missing column '{col}' in {filename}. Filling with empty values.")
                    df[col] = pd.NA
                    
            # Subset exactly to required cols to ensure exact schema
            df = df[required_cols]
            
            # Check for missing values across the dataset
            null_counts = df.isnull().sum()
            if null_counts.sum() > 0:
                logging.info(f"Found missing values in {filename}:\n{null_counts[null_counts > 0].to_string()}")
                
            # Consistent naming could include stripping whitespace from string columns
            for col in df.select_dtypes(include=['object']).columns:
                df[col] = df[col].astype(str).str.strip()
                
            # Copy to processed directory
            out_file = processed_dir / filename
            df.to_csv(out_file, index=False)
            logging.info(f"Successfully validated and saved {filename} to {out_file}")
            
        except Exception as e:
            logging.error(f"Failed to process {filename}: {e}")

if __name__ == '__main__':
    main()
