export default function SensitivityPanel({ 
  fuelChange, 
  setFuelChange, 
  congestionChange, 
  setCongestionChange 
}) {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="mb-6">
          <h3 className="font-semibold text-lg flex items-center space-x-2">
            <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
            <span>Live Sensitivity Analysis</span>
          </h3>
          <p className="text-slate-400 text-sm mt-1 ml-4">
            Adjust macro factors to instantly stress-test the forecast and recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Fuel Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="fuel-slider" className="text-sm font-medium text-slate-300">
                Fuel Price Shock
              </label>
              <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700 font-mono text-sm text-blue-400">
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>-20%</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Congestion Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="congestion-slider" className="text-sm font-medium text-slate-300">
                Port Congestion Delay
              </label>
              <div className="bg-slate-800 px-3 py-1 rounded border border-slate-700 font-mono text-sm text-amber-400">
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>-20%</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
