import itertools
import copy

def schedule_voyages(voyages, vessel_available_day):
    """
    Minimizes idle days between a bundle of voyages using permutation search (DP/Greedy exact).
    voyages: list of dicts [{'id': str, 'earliest_start': int, 'duration': int}]
    vessel_available_day: int
    """
    best_schedule = None
    best_idle_days = float('inf')
    
    # Try all permutations of the given voyages to find the global optimum
    for perm in itertools.permutations(voyages):
        current_day = vessel_available_day
        idle_days = 0
        schedule = []
        
        for voyage in perm:
            # If the vessel is available before the cargo's earliest start, it sits idle
            if current_day < voyage['earliest_start']:
                idle_wait = voyage['earliest_start'] - current_day
                idle_days += idle_wait
                start_day = voyage['earliest_start']
            else:
                idle_wait = 0
                start_day = current_day
                
            schedule.append({
                'id': voyage['id'],
                'start_day': start_day,
                'end_day': start_day + voyage['duration'],
                'idle_before_start': idle_wait
            })
            
            current_day = start_day + voyage['duration']
            
        if idle_days < best_idle_days:
            best_idle_days = idle_days
            best_schedule = schedule
            
    return best_schedule, best_idle_days

if __name__ == "__main__":
    # PRD Mock Test Case
    # Overlapping windows that require scheduling to minimize wait times
    voyages = [
        {'id': 'Mozambique_Coal', 'earliest_start': 5, 'duration': 20},
        {'id': 'Russia_Coal', 'earliest_start': 22, 'duration': 18},
        {'id': 'Australia_IronOre', 'earliest_start': 40, 'duration': 25}
    ]
    
    vessel_available = 0
    
    print("Testing Voyage Scheduler (PRD 3-Voyage Bundle)")
    print("-" * 50)
    
    # Calculate the worst case to demonstrate optimization
    worst_idle = 0
    for perm in itertools.permutations(voyages):
        curr = vessel_available
        idle = 0
        for v in perm:
            start = max(curr, v['earliest_start'])
            idle += (start - curr)
            curr = start + v['duration']
        if idle > worst_idle:
            worst_idle = idle

    best_schedule, best_idle = schedule_voyages(voyages, vessel_available)
    
    total_voyage_days = sum(v['duration'] for v in voyages)
    best_total_days = total_voyage_days + best_idle
    worst_total_days = total_voyage_days + worst_idle
    
    print(f"Optimal Schedule (Total Idle Days: {best_idle}):")
    for s in best_schedule:
        print(f"  -> {s['id']}: Start Day {s['start_day']}, End Day {s['end_day']} (Idle wait: {s['idle_before_start']} days)")
        
    print(f"\nIdle % BEFORE optimization (Worst Case): {(worst_idle / worst_total_days * 100):.2f}%")
    print(f"Idle % AFTER optimization (Best Case): {(best_idle / best_total_days * 100):.2f}%")
