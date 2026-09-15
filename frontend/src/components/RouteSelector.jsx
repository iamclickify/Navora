import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

// Cargo volume options in tonnes
const CARGO_OPTIONS = [
  { label: '25,000 t', value: 25000 },
  { label: '35,000 t', value: 35000 },
  { label: '50,000 t', value: 50000 },
  { label: '63,000 t', value: 63000 },
  { label: '75,000 t', value: 75000 },
  { label: '80,000 t', value: 80000 },
  { label: '100,000 t', value: 100000 },
  { label: '120,000 t', value: 120000 },
  { label: '150,000 t', value: 150000 },
];

export default function RouteSelector({
  scenarios,
  selectedRoute,
  onSelectRoute,
  selectedCommodity,
  onSelectCommodity,
  cargoVolume,
  onSelectCargoVolume,
}) {
  const routes = Object.keys(scenarios);
  const currentScenario = scenarios[selectedRoute];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-2xl text-white tracking-tight hover:text-blue-400 transition-colors cursor-pointer">
          Navora
        </Link>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {/* Route Selector */}
        <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
          <label className="text-xs font-semibold text-slate-400 uppercase ml-2 tracking-wide">Route</label>
          <select
            value={selectedRoute}
            onChange={(e) => onSelectRoute(e.target.value)}
            className="bg-slate-900 border-none rounded py-1 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {routes.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>
        </div>

        {/* Commodity Selector */}
        {currentScenario && (
          <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
            <label className="text-xs font-semibold text-slate-400 uppercase ml-2 tracking-wide">Commodity</label>
            <select
              value={selectedCommodity}
              onChange={(e) => onSelectCommodity(e.target.value)}
              className="bg-slate-900 border-none rounded py-1 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currentScenario.validCommodities.map(comm => (
                <option key={comm} value={comm}>{comm}</option>
              ))}
            </select>
          </div>
        )}

        {/* Cargo Volume Selector */}
        <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
          <Package size={14} className="text-amber-400 ml-2" />
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cargo</label>
          <select
            value={cargoVolume}
            onChange={(e) => onSelectCargoVolume(Number(e.target.value))}
            className="bg-slate-900 border-none rounded py-1 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {CARGO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
