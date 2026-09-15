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
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-800 flex items-center">
            {portName} Live Forecast
            <span className="ml-3 text-2xl">{today.weather_icon}</span>
          </h3>
          <p className="text-sm text-slate-500">Next 7 days (Open-Meteo API)</p>
        </div>
        <WeatherRiskBadge riskLevel={today.risk} />
      </div>

      {/* 7-Day Strip */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-3 snap-x scrollbar-hide">
        {forecast.map((day, i) => (
          <div key={day.date} className={`flex-shrink-0 w-24 p-3 rounded-lg border snap-center flex flex-col items-center ${i === 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-xs font-semibold text-slate-500 mb-1">
              {i === 0 ? 'Today' : formatDay(day.date)}
            </span>
            <span className="text-2xl mb-1">{day.weather_icon}</span>
            <span className="text-sm font-bold text-slate-700">{Math.round(day.temp_max)}°</span>
            <div className="flex items-center text-[10px] text-slate-500 mt-2 w-full justify-between">
              <span className="flex items-center"><span className="text-blue-400 mr-1">🌧</span>{day.rain}</span>
              <span className="flex items-center"><span className="text-slate-400 mr-1">💨</span>{day.wind}</span>
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
              tickFormatter={(val) => formatDay(val)}
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
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Bar 
              yAxisId="left"
              dataKey="rain" 
              name="Rain (mm)" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="wind" 
              name="Wind Speed (km/h)" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
