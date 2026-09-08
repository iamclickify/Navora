import { Ruler, Anchor, Package, Maximize2 } from 'lucide-react';

export default function PortConstraints({ portName, constraints, isLoading }) {
  if (isLoading || !constraints) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-between">
        <span>{portName} Constraints</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Draft Limit */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Anchor size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Max Draft</p>
            <p className="text-lg font-bold text-slate-900">{constraints.draft_m} m</p>
          </div>
        </div>

        {/* LOA Limit */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Ruler size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Max LOA</p>
            <p className="text-lg font-bold text-slate-900">{constraints.max_loa_m} m</p>
          </div>
        </div>

        {/* Beam Limit */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Maximize2 size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Max Beam</p>
            <p className="text-lg font-bold text-slate-900">{constraints.beam_m} m</p>
          </div>
        </div>

        {/* Cargo Capacity Limit */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Package size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Port Cap (T)</p>
            <p className="text-lg font-bold text-slate-900">{(constraints.cargo_cap_t / 1000).toFixed(0)}k</p>
          </div>
        </div>
      </div>
    </div>
  );
}
