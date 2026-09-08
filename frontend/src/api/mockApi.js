import { portSpecs, vesselSpecs } from '../data/mockData';

// Simulate network latency
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mocks the /api/v1/port-constraints endpoint
 * @param {string} portName 
 */
export const fetchPortConstraints = async (portName) => {
  await delay(400); // simulate latency
  const port = portSpecs[portName];
  if (!port) throw new Error("Port not found");
  return port;
};

/**
 * Mocks the /api/v1/vessel-recommendation endpoint
 * Calculates feasibility by comparing vessel draft against port draft,
 * and vessel capacity against cargo volume.
 * @param {string} portName 
 * @param {number} cargoVolume 
 */
export const fetchVesselRanking = async (portName, cargoVolume) => {
  await delay(600); // simulate latency
  const port = portSpecs[portName];
  if (!port) throw new Error("Port not found");

  const rankedVessels = vesselSpecs.map((vessel) => {
    const reasons = [];
    let feasible = true;

    // Check Draft Constraint
    if (vessel.draft_m > port.draft_m) {
      feasible = false;
      reasons.push(`Draft (${vessel.draft_m}m) exceeds port limit (${port.draft_m}m)`);
    }

    // Check Capacity Constraint (we want vessels large enough, or we need multiple)
    // For simplicity in MVP: if vessel is extremely small compared to volume, maybe flag it, 
    // but the PRD says to filter vessels that violate draft/LOA. 
    // We will flag if the vessel is too big for the port's cargo capacity limit.
    if (vessel.capacity_t > port.cargo_cap_t) {
      feasible = false;
      reasons.push(`Capacity (${vessel.capacity_t}t) exceeds port handling cap (${port.cargo_cap_t}t)`);
    }

    if (vessel.loa_m > port.max_loa_m) {
      feasible = false;
      reasons.push(`LOA (${vessel.loa_m}m) exceeds port limit (${port.max_loa_m}m)`);
    }

    return {
      ...vessel,
      feasible,
      reasons,
    };
  });

  // Sort feasible first, then by base cost ascending
  return rankedVessels.sort((a, b) => {
    if (a.feasible === b.feasible) {
      return a.base_cost_usd - b.base_cost_usd;
    }
    return a.feasible ? -1 : 1;
  });
};
