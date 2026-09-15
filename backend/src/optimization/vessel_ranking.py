import pandas as pd
from pathlib import Path

def rank_vessels(port_name: str, cargo_volume: float, predicted_freight_rate: float, transit_days: int, weather_risk_score: str = "Low", fuel_price: float = 600.0):
    """
    Ranks vessels for a given port and cargo based on total voyage cost.
    """
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    data_dir = project_root / 'data'
    raw_dir = project_root / 'backend' / 'data' / 'raw' / 'manual_reference'
    
    port_specs_path = data_dir / 'port_constraints.csv'
    vessel_specs_path = raw_dir / 'vessel_specs.csv'
    
    if not port_specs_path.exists() or not vessel_specs_path.exists():
        raise FileNotFoundError(f"Port ({port_specs_path}) or Vessel ({vessel_specs_path}) specs CSV not found.")
        
    ports_df = pd.read_csv(port_specs_path)
    vessels_df = pd.read_csv(vessel_specs_path)
    
    port_row = ports_df[ports_df['port'].str.lower() == port_name.lower()]
    if port_row.empty:
        raise ValueError(f"Port '{port_name}' not found in port_constraints.csv.")
        
    port_data = port_row.iloc[0]
    
    feasible = []
    infeasible = []
    
    for _, vessel in vessels_df.iterrows():
        reasons = []
        
        # Physical constraints check
        if vessel['draft_m'] > port_data['draft_m']:
            reasons.append(f"Draft exceeds port limit ({vessel['draft_m']} > {port_data['draft_m']})")
        if vessel['loa_m'] > port_data['max_loa_m']:
            reasons.append(f"LOA exceeds port limit ({vessel['loa_m']} > {port_data['max_loa_m']})")
        if vessel['beam_m'] > port_data['beam_m']:
            reasons.append(f"Beam exceeds port limit ({vessel['beam_m']} > {port_data['beam_m']})")
        if vessel['capacity_t'] < cargo_volume:
            reasons.append(f"Capacity insufficient ({vessel['capacity_t']} < {cargo_volume})")
            
        if reasons:
            infeasible.append({
                'vessel_class': vessel['vessel_class'],
                'reasons': "; ".join(reasons)
            })
        else:
            # Financial Cost Calculation
            freight_cost = vessel['capacity_t'] * predicted_freight_rate
            port_fee = vessel['typical_port_fee_usd']
            opex = vessel['daily_opex_usd'] * transit_days
            fuel_cost = vessel['fuel_per_day_t'] * fuel_price * transit_days
            
            base_total_cost = freight_cost + port_fee + opex + fuel_cost
            
            # Weather Risk Penalty
            # Base penalty multiplier for bad weather
            risk_mult = 0.0
            if weather_risk_score == "High":
                risk_mult = 0.10
            elif weather_risk_score == "Medium":
                risk_mult = 0.05
                
            # Adjust penalty based on vessel size (smaller vessels suffer more in bad weather)
            v_class = vessel['vessel_class'].lower()
            if v_class == 'handysize':
                risk_mult *= 1.5
            elif v_class == 'supramax':
                risk_mult *= 1.2
            elif v_class == 'capesize':
                risk_mult *= 0.3 # Capesize handles weather better
                
            risk_penalty = base_total_cost * risk_mult
            total_cost = base_total_cost + risk_penalty
            
            feasible.append({
                'vessel_class': vessel['vessel_class'],
                'total_cost': total_cost,
                'weather_risk_label': weather_risk_score,
                'risk_note': f"Risk penalty applied due to {weather_risk_score} weather" if risk_mult > 0 else "Normal operating conditions",
                'breakdown': {
                    'freight_cost': freight_cost,
                    'port_fee': port_fee,
                    'opex': opex,
                    'fuel_cost': fuel_cost,
                    'risk_penalty': risk_penalty
                }
            })
            
    # Rank by total cost (ascending)
    feasible.sort(key=lambda x: x['total_cost'])
    
    return feasible, infeasible

if __name__ == "__main__":
    print("Testing Vessel Ranking for 'Vizag' port...")
    print("Params: 60,000t cargo, $30/t freight rate, 15 transit days\n")
    feasible, infeasible = rank_vessels("Vizag", 60000, 30.0, 15)
    
    print("[+] FEASIBLE VESSELS (Ranked by Total Cost):")
    for v in feasible:
        print(f"- {v['vessel_class']}: ${v['total_cost']:,.2f}")
        print(f"    (Freight: ${v['breakdown']['freight_cost']:,.2f} | Port Fee: ${v['breakdown']['port_fee']:,.2f} | Opex: ${v['breakdown']['opex']:,.2f})")
        
    print("\n[-] INFEASIBLE VESSELS:")
    for v in infeasible:
        print(f"- {v['vessel_class']}: {v['reasons']}")
