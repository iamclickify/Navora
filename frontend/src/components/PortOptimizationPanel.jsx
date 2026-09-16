import { useState, useEffect } from 'react';
import BASE_URL from '../api/client';
import { ShieldAlert, CheckCircle, Navigation, MapPin } from 'lucide-react';
import WeatherRiskBadge from './WeatherRiskBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

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
        const res = await fetch(`${BASE_URL}/api/v1/port-optimization?port=${encodeURIComponent(portName)}&cargo_volume=${cargoVolume}`);
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
      <Card className="w-full border-slate-200">
        <CardContent className="p-6">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-6 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-40 bg-slate-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-40 bg-slate-200 rounded flex-1 animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full border-slate-200">
        <CardContent className="p-6 text-slate-500">
          <p>Could not load optimization data for {portName}</p>
        </CardContent>
      </Card>
    );
  }

  const isHighRisk = data.primary_risk === "High";

  return (
    <Card className="shadow-lg border-slate-200 w-full overflow-hidden">
      {isHighRisk && (
        <div className="bg-red-500 text-white px-6 py-3 font-semibold flex items-center shadow-inner animate-pulse">
          <ShieldAlert size={20} className="mr-2" />
           {data.primary_port} is currently HIGH RISK for operations. See recommended alternative ports below.
        </div>
      )}

      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
          <Navigation size={24} className="mr-2 text-blue-600" />
          Port Optimization
        </CardTitle>
        <CardDescription className="text-slate-500 text-sm mt-1">Alternative ports based on live weather and congestion</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Port Horizontal Banner */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isHighRisk ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-4">
             <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <MapPin size={24} className={isHighRisk ? "text-red-500" : "text-blue-500"} />
             </div>
             <div>
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Primary Destination</h3>
               <div className="text-2xl font-bold text-slate-800">{data.primary_port}</div>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
             <div>
               <div className="text-xs text-slate-500 mb-1">Status</div>
               <span className={`font-bold text-sm ${isHighRisk ? 'text-red-600' : 'text-emerald-600'}`}>
                 {isHighRisk ? 'Infeasible' : 'Feasible'}
               </span>
             </div>
             <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
             <div>
               <div className="text-xs text-slate-500 mb-1">Weather</div>
               <WeatherRiskBadge riskLevel={data.primary_risk} />
             </div>
             <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
             <div>
               <div className="text-xs text-slate-500 mb-1">Wind</div>
               <div className="font-bold text-slate-800 text-sm">{data.primary_wind_kmh} km/h</div>
             </div>
             <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
             <div>
               <div className="text-xs text-slate-500 mb-1">Congestion</div>
               <div className={`font-bold text-sm ${data.primary_congestion >= 0.7 ? 'text-red-600' : data.primary_congestion >= 0.4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                 {data.primary_congestion != null ? Math.round(data.primary_congestion * 100) + '%' : 'N/A'}
               </div>
             </div>
          </div>
        </div>

        {/* Alternatives List */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Recommended Alternatives</h3>
          <div className="space-y-3">
             {data.alternatives.map((alt, idx) => (
                <div key={alt.port} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all gap-4 relative overflow-hidden group">
                   {idx === 0 && (
                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                   )}
                   <div className="flex items-center gap-4 min-w-[220px]">
                      <Badge className={`ml-2 shadow-sm ${idx === 0 ? "bg-amber-400 text-amber-900 hover:bg-amber-400 font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-100"}`}>
                        #{idx + 1}
                      </Badge>
                      <div>
                        <h4 className="font-bold text-lg text-slate-800">{alt.port}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                          <MapPin size={12} className="text-slate-400" /> {alt.distance_km} km away
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-end flex-1 gap-x-8 gap-y-4">
                     <div className="min-w-[80px]">
                       <div className="text-xs text-slate-500 mb-1">Weather</div>
                       <WeatherRiskBadge riskLevel={alt.weather_risk} />
                     </div>
                     <div className="min-w-[80px]">
                       <div className="text-xs text-slate-500 mb-1">Congestion</div>
                       <div className={`font-bold text-sm ${alt.congestion >= 0.7 ? 'text-red-500' : alt.congestion >= 0.4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                         {Math.round(alt.congestion * 100)}%
                       </div>
                     </div>
                     {alt.cargo_cap_t && (
                       <div className="min-w-[80px]">
                         <div className="text-xs text-slate-500 mb-1">Capacity</div>
                         <div className="font-bold text-sm text-slate-700">{(alt.cargo_cap_t / 1000).toFixed(0)}k t</div>
                       </div>
                     )}
                     
                     <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                     
                     <div className="text-right min-w-[130px]">
                       <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Extra Fuel Cost</div>
                       <div className="font-extrabold text-xl text-amber-600">
                         ${Math.abs(alt.extra_fuel_cost_usd || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </div>
                     </div>
                   </div>
                </div>
             ))}
             {data.alternatives.length === 0 && (
                <div className="text-center p-8 text-slate-500 border border-slate-200 border-dashed rounded-xl bg-slate-50">
                  No better feasible alternatives found.
                </div>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
