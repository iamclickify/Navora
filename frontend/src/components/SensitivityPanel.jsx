import { Settings2, Zap, Fuel, Anchor, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Slider } from './ui/slider';

export default function SensitivityPanel({ 
  fuelChange = 0, 
  setFuelChange, 
  congestionChange = 0, 
  setCongestionChange,
  activeHorizonData,
  currentRate = 1700,
  cargoVolume = 50000,
  activeHorizon = '30'
}) {
  const hasShock = fuelChange !== 0 || congestionChange !== 0;

  // Real maritime economic elasticity (Bunker Fuel: 38%, Port Congestion: 18%)
  const netShiftPct = (fuelChange * 0.38) + (congestionChange * 0.18);
  const deltaRate = currentRate * (netShiftPct / 100);
  const voyageImpact = deltaRate * cargoVolume;

  return (
    <Card className="rounded-2xl shadow-xl border-slate-200 overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="font-bold text-xl text-slate-800 flex items-center space-x-2">
            <Settings2 className="text-blue-500" size={24} />
            <span>Live Sensitivity & Risk Scenario Analysis</span>
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm mt-1">
            Simulate macroeconomic shocks and see real-time shifts in freight rate forecasts and recommendations.
          </CardDescription>
        </div>

        {hasShock && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 shadow-sm ${
              deltaRate > 0 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Zap size={16} className={deltaRate > 0 ? 'text-red-500' : 'text-emerald-500'} />
              <span>
                Net Rate Impact: <strong>{deltaRate > 0 ? '+' : ''}${Math.round(deltaRate)}/t ({netShiftPct > 0 ? '+' : ''}{netShiftPct.toFixed(1)}%)</strong>
              </span>
              <span className="text-xs opacity-75 hidden md:inline">
                | Voyage: {voyageImpact > 0 ? '+' : ''}${Math.round(voyageImpact).toLocaleString()}
              </span>
            </div>
            <button 
              onClick={() => { setFuelChange(0); setCongestionChange(0); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              title="Reset all scenario shocks"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fuel Slider */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 relative overflow-hidden group hover:border-blue-300 transition-colors">
            <div className="absolute -bottom-6 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Fuel size={120} />
            </div>
            <div className="flex justify-between items-center relative z-10">
              <label htmlFor="fuel-slider" className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Fuel size={16} className="text-blue-500"/> Fuel Price Shock
              </label>
              <div className={`px-4 py-1.5 rounded-full font-bold text-lg shadow-sm border ${
                fuelChange === 0 
                  ? 'bg-white text-slate-600 border-slate-200' 
                  : fuelChange > 0 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {fuelChange > 0 ? '+' : ''}{fuelChange}%
              </div>
            </div>
            
            <div className="relative z-10 px-2 py-4">
              <Slider 
                id="fuel-slider"
                value={[fuelChange]}
                onValueChange={(val) => setFuelChange(val[0])}
                min={-20} 
                max={30} 
                step={1}
                className="cursor-pointer [&_[role=slider]]:bg-blue-600 [&_[role=slider]]:border-blue-600 [&_[role=slider]]:shadow-md [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&>span:first-child]:bg-slate-200 [&_[data-orientation=horizontal]>span:first-child>span]:bg-blue-500"
              />
            </div>
            
            <div className="flex justify-between relative z-10 gap-2">
              <button onClick={() => setFuelChange(-20)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                -20% (Crash)
              </button>
              <button onClick={() => setFuelChange(0)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                0% (Reset)
              </button>
              <button onClick={() => setFuelChange(30)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                +30% (Spike)
              </button>
            </div>
          </div>

          {/* Congestion Slider */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 relative overflow-hidden group hover:border-amber-300 transition-colors">
            <div className="absolute -bottom-6 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Anchor size={120} />
            </div>
            <div className="flex justify-between items-center relative z-10">
              <label htmlFor="congestion-slider" className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <Anchor size={16} className="text-amber-500"/> Port Congestion Delay
              </label>
              <div className={`px-4 py-1.5 rounded-full font-bold text-lg shadow-sm border ${
                congestionChange === 0 
                  ? 'bg-white text-slate-600 border-slate-200' 
                  : congestionChange > 0 
                    ? 'bg-amber-50 text-amber-600 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {congestionChange > 0 ? '+' : ''}{congestionChange}%
              </div>
            </div>
            
            <div className="relative z-10 px-2 py-4">
              <Slider 
                id="congestion-slider"
                value={[congestionChange]}
                onValueChange={(val) => setCongestionChange(val[0])}
                min={-20} 
                max={30} 
                step={1}
                className="cursor-pointer [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-500 [&_[role=slider]]:shadow-md [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&>span:first-child]:bg-slate-200 [&_[data-orientation=horizontal]>span:first-child>span]:bg-amber-400"
              />
            </div>
            
            <div className="flex justify-between relative z-10 gap-2">
              <button onClick={() => setCongestionChange(-20)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                -20% (Smooth)
              </button>
              <button onClick={() => setCongestionChange(0)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                0% (Reset)
              </button>
              <button onClick={() => setCongestionChange(30)} className="flex-1 py-1.5 px-2 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                +30% (Gridlock)
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
