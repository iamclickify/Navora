import { Check, X, Info } from 'lucide-react';

export default function VesselTable({ vessels, isLoading }) {
  if (isLoading || !vessels) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="font-semibold text-lg text-slate-800 mb-4">Vessel Feasibility Ranking</h3>
      
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Class & Cap</th>
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {vessels.map((vessel) => (
              <tr 
                key={vessel.id} 
                className={`border-b border-slate-100 last:border-0 ${!vessel.feasible ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50 transition-colors'}`}
              >
                <td className="py-4 px-2">
                  <div className="font-medium text-slate-800">{vessel.vessel_class}</div>
                  <div className="text-xs text-slate-500">{(vessel.capacity_t / 1000).toFixed(0)}k tons</div>
                </td>
                <td className="py-4 px-2">
                  {vessel.feasible ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      <Check size={12} />
                      <span>Fits port & cargo</span>
                    </span>
                  ) : (
                    <div className="flex flex-col space-y-1">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-max">
                        <X size={12} />
                        <span>Infeasible</span>
                      </span>
                      {vessel.reasons && vessel.reasons.length > 0 && (
                        <div className="text-[10px] text-red-600 flex items-start space-x-1 max-w-[140px] leading-tight">
                          <Info size={10} className="mt-0.5 flex-shrink-0" />
                          <span>{vessel.reasons[0]}</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-2 text-right">
                  {vessel.feasible && vessel.base_cost_usd ? (
                    <span className="font-semibold text-slate-700">
                      ${(vessel.base_cost_usd / 1000).toFixed(0)}k
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
