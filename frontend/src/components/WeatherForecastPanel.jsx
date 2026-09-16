import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import WeatherRiskBadge from './WeatherRiskBadge';
import { CloudRain, Wind } from 'lucide-react';

export default function WeatherForecastPanel({ portName }) {
  const [forecast, setForecast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadForecast() {
      if (!portName) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/weather-forecast?port=${encodeURIComponent(portName)}`);
        if (!res.ok) throw new Error("Failed to fetch weather forecast");
        const data = await res.json();
        setForecast(data.forecast || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadForecast();
  }, [portName]);

  const today = forecast.length > 0 ? forecast[0] : null;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="flex space-x-4 mb-6">
           <div className="h-24 bg-slate-200 rounded w-1/4"></div>
           <div className="h-24 bg-slate-200 rounded w-1/4"></div>
           <div className="h-24 bg-slate-200 rounded w-1/4"></div>
           <div className="h-24 bg-slate-200 rounded w-1/4"></div>
        </div>
        <div className="flex-1 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (error || !today) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col justify-center items-center text-slate-500">
        <p>Could not load weather data for {portName}</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  // Format date safely safely
  const formatDay = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-500";
    if (risk === "Medium") return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-xl text-slate-800 flex items-center">
            {portName} Live Forecast
          </h3>
          <p className="text-sm text-slate-500 mt-1">Next 15 days (Open-Meteo API)</p>
        </div>
        <WeatherRiskBadge riskLevel={today.risk} />
      </div>

      {/* 15-Day Strip */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-3 snap-x scrollbar-hide">
        {forecast.map((day, i) => (
          <div key={day.date} className={`flex-shrink-0 w-28 p-3 rounded-xl border snap-center flex flex-col items-center hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {i === 0 ? 'Today' : formatDay(day.date)}
            </span>
            <span className="text-xl font-bold text-slate-800 mb-2">{Math.round(day.temp_max)}°C</span>
            
            <div className="flex flex-col gap-1 w-full text-[11px] font-medium text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center">
                <CloudRain size={12} className="text-blue-400" />
                <span>{day.rain} mm</span>
              </div>
              <div className="flex justify-between items-center">
                <Wind size={12} className="text-slate-400" />
                <span className={getRiskColor(day.risk)}>{day.wind} km/h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              tickFormatter={(val) => {
                const d = new Date(val);
                return `${d.getDate()}/${d.getMonth()+1}`;
              }}
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              label={{ value: 'Rain (mm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12, fontWeight: 'bold' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
              label={{ value: 'Wind (km/h)', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12, fontWeight: 'bold' } }}
            />
            <Tooltip 
              labelFormatter={(label) => formatDay(label)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Bar 
              yAxisId="left"
              dataKey="rain" 
              name="Rain (mm)" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="wind" 
              name="Wind Speed (km/h)" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
