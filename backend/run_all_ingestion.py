import subprocess
import sys
from pathlib import Path
import time

def run_script(script_path, name):
    print(f"==================================================")
    print(f"Running: {name}")
    print(f"==================================================")
    
    start_time = time.time()
    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr)
        status = "SUCCESS"
    except subprocess.CalledProcessError as e:
        print(e.stdout)
        print(f"ERROR:\n{e.stderr}")
        status = "FAILED"
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        status = "FAILED"
        
    duration = time.time() - start_time
    print(f"[{status}] Finished {name} in {duration:.1f}s\n")
    return status, duration

def main():
    project_root = Path(__file__).resolve().parent
    ingest_dir = project_root / 'src' / 'data' / 'ingest'
    
    scripts_to_run = [
        ('validate_manual_references.py', 'Manual References Validation'),
        ('fetch_freight_rates.py', 'Freight Rates Ingestion'),
        ('fetch_fuel_prices.py', 'Fuel Prices Ingestion'),
        ('fetch_commodity_prices.py', 'Commodity Prices Ingestion'),
        ('fetch_weather.py', 'Weather Ingestion'),
        ('generate_congestion_proxy.py', 'Synthetic Congestion Generation')
    ]
    
    summary = []
    
    for script_name, description in scripts_to_run:
        script_path = ingest_dir / script_name
        if script_path.exists():
            status, duration = run_script(script_path, description)
            summary.append((description, status, f"{duration:.1f}s"))
        else:
            print(f"Script missing: {script_path}")
            summary.append((description, "SKIPPED (Missing)", "-"))
            
    print("\n")
    print("############################################################")
    print("               CONSOLIDATED INGESTION SUMMARY")
    print("############################################################")
    print(f"{'Task':<35} | {'Status':<15} | {'Duration'}")
    print("-" * 65)
    for task, status, dur in summary:
        print(f"{task:<35} | {status:<15} | {dur}")
    print("############################################################")

if __name__ == '__main__':
    main()
