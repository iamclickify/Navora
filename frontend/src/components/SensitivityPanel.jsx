import { Settings2, Zap } from 'lucide-react';

export default function SensitivityPanel({ 
  fuelChange, 
  setFuelChange, 
  congestionChange, 
  setCongestionChange 
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl text-slate-800 flex items-center space-x-2">
            <Settings2 className="text-blue-500" size={24} />
            <span>Live Sensitivity Analysis</span>
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Instantly see how extreme market shifts affect the forecast.
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-100">
          <Zap size={16} />
          <span>Real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
        {/* Fuel Slider */}
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label htmlFor="fuel-slider" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Fuel Price Shock
            </label>
            <div className={`px-3 py-1 rounded-full font-bold text-sm border ${fuelChange === 0 ? 'bg-slate-100 text-slate-600 border-slate-200' : fuelChange > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              {fuelChange > 0 ? '+' : ''}{fuelChange}%
            </div>
          </div>
          
          <input 
            id="fuel-slider"
            type="range" 
            min="-20" 
            max="30" 
            step="1"
            value={fuelChange}
            onChange={(e) => setFuelChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>-20% (Crash)</span>
            <span>0% (Current)</span>
            <span>+30% (Spike)</span>
          </div>
        </div>

        {/* Congestion Slider */}
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <label htmlFor="congestion-slider" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              Port Congestion Delay
            </label>
            <div className={`px-3 py-1 rounded-full font-bold text-sm border ${congestionChange === 0 ? 'bg-slate-100 text-slate-600 border-slate-200' : congestionChange > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              {congestionChange > 0 ? '+' : ''}{congestionChange}%
            </div>
          </div>
          
          <input 
            id="congestion-slider"
            type="range" 
            min="-20" 
            max="30" 
            step="1"
            value={congestionChange}
            onChange={(e) => setCongestionChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>-20% (Smooth)</span>
            <span>0% (Current)</span>
            <span>+30% (Gridlock)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
