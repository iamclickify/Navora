// Port specifications based on SIH26006 PRD matrix
export const portSpecs = {
  "Paradip": { draft_m: 13.0, max_loa_m: 240, beam_m: 32.2, cargo_cap_t: 140000, congestion_score: 0.6 },
  "Vizag": { draft_m: 12.5, max_loa_m: 238, beam_m: 32.2, cargo_cap_t: 120000, congestion_score: 0.8 },
  "Gangavaram": { draft_m: 12.0, max_loa_m: 200, beam_m: 32.0, cargo_cap_t: 80000, congestion_score: 0.4 },
  "Gopalpur": { draft_m: 10.5, max_loa_m: 180, beam_m: 30.0, cargo_cap_t: 60000, congestion_score: 0.2 },
  "Dhamra": { draft_m: 11.0, max_loa_m: 210, beam_m: 32.0, cargo_cap_t: 100000, congestion_score: 0.5 },
  "Sagar-Sandheads": { draft_m: 9.5, max_loa_m: 170, beam_m: 28.0, cargo_cap_t: 50000, congestion_score: 0.7 },
  "Haldia": { draft_m: 8.5, max_loa_m: 160, beam_m: 27.5, cargo_cap_t: 40000, congestion_score: 0.9 },
  "Chennai (Ennore)": { draft_m: 16.5, max_loa_m: 300, beam_m: 45.0, cargo_cap_t: 180000, congestion_score: 0.7 },
  "Kamarajar (Ennore)": { draft_m: 18.0, max_loa_m: 300, beam_m: 45.0, cargo_cap_t: 200000, congestion_score: 0.6 },
  "Kolkata (KoPT)": { draft_m: 7.5, max_loa_m: 150, beam_m: 25.0, cargo_cap_t: 30000, congestion_score: 0.8 },
  "Krishnapatnam": { draft_m: 18.5, max_loa_m: 320, beam_m: 46.0, cargo_cap_t: 220000, congestion_score: 0.5 },
  "Kattupalli": { draft_m: 14.5, max_loa_m: 280, beam_m: 40.0, cargo_cap_t: 150000, congestion_score: 0.4 },
  "Tuticorin (V.O.C.)": { draft_m: 14.2, max_loa_m: 250, beam_m: 38.0, cargo_cap_t: 140000, congestion_score: 0.6 },
  "Cuddalore": { draft_m: 9.0, max_loa_m: 160, beam_m: 28.0, cargo_cap_t: 45000, congestion_score: 0.3 },
  "Kakinada": { draft_m: 11.5, max_loa_m: 220, beam_m: 32.0, cargo_cap_t: 80000, congestion_score: 0.5 },
  "Machilipatnam": { draft_m: 10.0, max_loa_m: 180, beam_m: 30.0, cargo_cap_t: 60000, congestion_score: 0.3 },
  "Ennore Creek": { draft_m: 14.0, max_loa_m: 260, beam_m: 38.0, cargo_cap_t: 130000, congestion_score: 0.4 }
};

// Standard vessel specifications
export const vesselSpecs = [
  { id: 1, vessel_class: "Handysize", capacity_t: 35000, draft_m: 10.0, loa_m: 170, beam_m: 27.0, base_cost_usd: 550000 },
  { id: 2, vessel_class: "Supramax", capacity_t: 55000, draft_m: 12.0, loa_m: 190, beam_m: 32.0, base_cost_usd: 612000 },
  { id: 3, vessel_class: "Panamax", capacity_t: 80000, draft_m: 14.5, loa_m: 225, beam_m: 32.2, base_cost_usd: 720000 },
  { id: 4, vessel_class: "Capesize", capacity_t: 170000, draft_m: 17.5, loa_m: 289, beam_m: 45.0, base_cost_usd: 1250000 }
];

export const mockScenarios = {
  "Australia - Paradip": {
    routeInfo: { origin: "Australia", destination: "Paradip" },
    validCommodities: ["Iron Ore", "Coal"],
    volumes: { "Iron Ore": 140000, "Coal": 120000 }
  },
  "Australia - Vizag": {
    routeInfo: { origin: "Australia", destination: "Vizag" },
    validCommodities: ["Coal", "Iron Ore"],
    volumes: { "Coal": 120000, "Iron Ore": 140000 }
  },
  "Indonesia - Gangavaram": {
    routeInfo: { origin: "Indonesia", destination: "Gangavaram" },
    validCommodities: ["Coal"],
    volumes: { "Coal": 80000 }
  },
  "Mozambique - Gopalpur": {
    routeInfo: { origin: "Mozambique", destination: "Gopalpur" },
    validCommodities: ["Mineral Sands", "Coal"],
    volumes: { "Mineral Sands": 60000, "Coal": 75000 }
  },
  "Russia - Dhamra": {
    routeInfo: { origin: "Russia", destination: "Dhamra" },
    validCommodities: ["Fertilizers", "Coal"],
    volumes: { "Fertilizers": 100000, "Coal": 90000 }
  },
  "US - Sagar-Sandheads": {
    routeInfo: { origin: "US East Coast", destination: "Sagar-Sandheads" },
    validCommodities: ["General Cargo", "Coal"],
    volumes: { "General Cargo": 50000, "Coal": 65000 }
  },
  "Indonesia - Haldia": {
    routeInfo: { origin: "Indonesia", destination: "Haldia" },
    validCommodities: ["Coal"],
    volumes: { "Coal": 40000 }
  },
  "Australia - Chennai": {
    routeInfo: { origin: "Australia", destination: "Chennai (Ennore)" },
    validCommodities: ["Coal", "Iron Ore"],
    volumes: { "Coal": 120000, "Iron Ore": 150000 }
  },
  "Indonesia - Kakinada": {
    routeInfo: { origin: "Indonesia", destination: "Kakinada" },
    validCommodities: ["Coal"],
    volumes: { "Coal": 80000 }
  },
  "South Africa - Krishnapatnam": {
    routeInfo: { origin: "South Africa", destination: "Krishnapatnam" },
    validCommodities: ["Coal"],
    volumes: { "Coal": 160000 }
  }
};
