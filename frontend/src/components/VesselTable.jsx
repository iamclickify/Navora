import { useState, useEffect } from 'react';
import { Check, X, Info, Anchor, DollarSign, AlertTriangle } from 'lucide-react';

const VESSEL_CAPACITIES = {
  'Newcastlemax': 208000,
  'Capesize': 150000,
  'Panamax': 75000,
  'Ultramax': 63000,
  'Supramax': 58000,
  'Handymax': 47000,
  'Handysize': 35000,
};

export default function VesselTable({ portName, cargoVolume, predictedRate }) {
  const [vessels, setVessels] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!portName || !predictedRate) return;

    async function fetchVessels() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/vessel-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            port_name: portName,
            cargo_volume: cargoVolume || 50000,
            predicted_freight_rate: predictedRate,
            transit_days: 15
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || `API error ${response.status}`);
        }
        const data = await response.json();
        setVessels(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVessels();
  }, [portName, cargoVolume, predictedRate]);

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 h-full flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-slate-600 text-sm font-medium">Vessel ranking unavailable</p>
        <p className="text-red-500 text-xs max-w-xs">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const feasible = vessels?.feasible_vessels || [];
  const infeasible = vessels?.infeasible_vessels || [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
          <Anchor size={18} className="text-blue-500" />
          Vessel Feasibility Ranking
        </h3>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {portName} · {(cargoVolume / 1000).toFixed(0)}k t
        </span>
      </div>

      <div className="flex-grow overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Vessel</th>
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase text-right">
                <DollarSign size={12} className="inline" />Est. Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {feasible.map((vessel, i) => {
              const cap = VESSEL_CAPACITIES[vessel.vessel_class] || '—';
              const isWeatherRisk = vessel.weather_risk_label && vessel.weather_risk_label !== 'Low';
              return (
                <tr
                  key={`f-${i}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="font-medium text-slate-800">{vessel.vessel_class}</div>
                    <div className="text-xs text-slate-500">{cap ? `${(cap / 1000).toFixed(0)}k tons` : '—'}</div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col space-y-1">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 w-max">
                        <Check size={12} />
                        <span>Fits port & cargo</span>
                      </span>
                      {isWeatherRisk && vessel.risk_note && (
                        <div className="text-[10px] text-amber-600 font-semibold flex items-start space-x-1 max-w-[140px] leading-tight">
                          <Info size={10} className="mt-0.5 flex-shrink-0" />
                          <span>{vessel.risk_note}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-slate-700">
                        ${(vessel.total_cost / 1000000).toFixed(2)}M
                      </span>
                      {vessel.breakdown?.fuel_cost && (
                        <span className="text-[10px] text-slate-400">
                          Fuel: ${(vessel.breakdown.fuel_cost / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {infeasible.map((vessel, i) => (
              <tr
                key={`inf-${i}`}
                className="border-b border-slate-100 last:border-0 opacity-50 bg-slate-50"
              >
                <td className="py-4 px-2">
                  <div className="font-medium text-slate-600">{vessel.vessel_class}</div>
                  <div className="text-xs text-slate-400">{VESSEL_CAPACITIES[vessel.vessel_class] ? `${(VESSEL_CAPACITIES[vessel.vessel_class] / 1000).toFixed(0)}k tons` : '—'}</div>
                </td>
                <td className="py-4 px-2" colSpan={2}>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 w-max mb-1">
                    <X size={12} />
                    <span>Infeasible</span>
                  </span>
                  {vessel.reasons && (
                    <div className="text-[10px] text-red-500 flex items-start space-x-1 max-w-[200px] leading-tight mt-1">
                      <Info size={10} className="mt-0.5 flex-shrink-0" />
                      <span>{typeof vessel.reasons === 'string' ? vessel.reasons : vessel.reasons[0]}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {feasible.length === 0 && infeasible.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400 text-sm">
                  No vessel data available for {portName}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
