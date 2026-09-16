import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Navigation, MapPin } from 'lucide-react';
import WeatherRiskBadge from './WeatherRiskBadge';

export default function PortOptimizationPanel({ portName, cargoVolume }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOptimization() {
      if (!portName) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/port-optimization?port=${encodeURIComponent(portName)}&cargo_volume=${cargoVolume}`);
        if (!res.ok) throw new Error("Failed to fetch port optimization data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadOptimization();
  }, [portName, cargoVolume]);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="flex gap-4">
          <div className="h-40 bg-slate-200 rounded w-1/3"></div>
          <div className="h-40 bg-slate-200 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full text-slate-500">
        <p>Could not load optimization data for {portName}</p>
      </div>
    );
  }

  const isHighRisk = data.primary_risk === "High";

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full overflow-hidden">
      {isHighRisk && (
        <div className="bg-red-500 text-white px-6 py-3 font-semibold flex items-center shadow-inner animate-pulse">
          <ShieldAlert size={20} className="mr-2" />
           {data.primary_port} is currently HIGH RISK for operations. See recommended alternative ports below.
        </div>
      )}

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Navigation size={24} className="mr-2 text-blue-600" />
              Smart Port Optimization
            </h2>
            <p className="text-slate-500 text-sm mt-1">Alternative ports based on live weather and congestion</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Primary Port Status */}
          <div className={`p-6 rounded-xl border-2 lg:w-1/3 flex flex-col ${isHighRisk ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Primary Destination</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-slate-800">{data.primary_port}</span>
              <WeatherRiskBadge riskLevel={data.primary_risk} />
            </div>
            
            <div className="mt-auto space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Status</span>
                <span className={`font-semibold ${isHighRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isHighRisk ? 'Infeasible' : 'Feasible'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Wind Speed</span>
                <span className="font-semibold text-slate-800">{data.primary_wind_kmh} km/h</span>
              </div>
            </div>
          </div>

          {/* Alternatives */}
          <div className="lg:w-2/3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recommended Alternatives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.alternatives.map((alt, idx) => (
                <div key={alt.port} className="border border-slate-200 rounded-xl p-4 flex flex-col hover:border-blue-300 hover:shadow-md transition-all bg-white relative">
                  {idx === 0 && (
                    <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">
                      Top Match
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-800 flex items-center">
                      {idx + 1}. {alt.port}
                    </h4>
                    <WeatherRiskBadge riskLevel={alt.weather_risk} />
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-3 flex items-center">
                    <MapPin size={12} className="mr-1" />
                    {alt.distance_km} km away
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Wind</span>
                      <span className="font-medium text-slate-700">{alt.wind_kmh} km/h</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-500">Congestion</span>
                        <span className={`font-bold ${alt.congestion >= 0.7 ? 'text-red-500' : alt.congestion >= 0.4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {Math.round(alt.congestion * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${alt.congestion >= 0.7 ? 'bg-red-400' : alt.congestion >= 0.4 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          style={{ width: `${alt.congestion * 100}%` }}
                        />
                      </div>
                    </div>
                    {alt.cargo_cap_t && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Capacity</span>
                        <span className="font-medium text-slate-700">{(alt.cargo_cap_t / 1000).toFixed(0)}k t</span>
                      </div>
                    )}
                  </div>
                  
                </div>
              ))}
              {data.alternatives.length === 0 && (
                <div className="col-span-2 text-center p-6 text-slate-500 border border-slate-200 border-dashed rounded-xl">
                  No better feasible alternatives found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
