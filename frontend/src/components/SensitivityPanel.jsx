import { Settings2, Zap, Fuel, Anchor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Slider } from './ui/slider';

export default function SensitivityPanel({ 
  fuelChange, 
  setFuelChange, 
  congestionChange, 
  setCongestionChange 
}) {
  return (
    <Card className="rounded-2xl shadow-xl border-slate-200 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="font-bold text-xl text-slate-800 flex items-center space-x-2">
            <Settings2 className="text-blue-500" size={24} />
            <span>Live Sensitivity Analysis</span>
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm mt-1">
            Instantly see how extreme market shifts affect the forecast.
          </CardDescription>
        </div>
        
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
              <div className={`px-4 py-1.5 rounded-full font-bold text-lg shadow-sm border ${fuelChange === 0 ? 'bg-white text-slate-600 border-slate-200' : fuelChange > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
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
              <div className={`px-4 py-1.5 rounded-full font-bold text-lg shadow-sm border ${congestionChange === 0 ? 'bg-white text-slate-600 border-slate-200' : congestionChange > 0 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
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
