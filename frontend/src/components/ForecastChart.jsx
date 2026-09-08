import { useState } from 'react';
import { 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';

export default function ForecastChart({ forecastData, adjustmentFactor = 1.0 }) {
  const [horizon, setHorizon] = useState(30);

  // Pick the right forecast array based on horizon toggle
  const forecastArrayKey = `forecast_${horizon}`;
  const forecastArray = forecastData[forecastArrayKey] || forecastData.forecast_30;

  // Combine historical and forecast for the chart
  const historicalMapped = forecastData.historical.map(d => ({
    date: d.date,
    historicalRate: d.rate,
  }));

  // Apply adjustment factor to forecast
  const forecastMapped = forecastArray.map(d => ({
    date: d.date,
    forecastRate: d.rate * adjustmentFactor,
    lowerBound: d.lower * adjustmentFactor,
    upperBound: d.upper * adjustmentFactor,
    // Provide an array for Area chart to draw range [lower, upper]
    confidenceInterval: [d.lower * adjustmentFactor, d.upper * adjustmentFactor]
  }));

  // We need a connected point between historical and forecast
  // Just for visual continuity, we can overlap the last historical point or just plot them together.
  // Actually, we'll just merge the data by date
  const allDates = Array.from(new Set([...historicalMapped.map(d=>d.date), ...forecastMapped.map(d=>d.date)])).sort();
  
  const chartData = allDates.map(date => {
    const hist = historicalMapped.find(d => d.date === date);
    const fore = forecastMapped.find(d => d.date === date);
    return {
      date,
      historicalRate: hist ? hist.historicalRate : null,
      forecastRate: fore ? fore.forecastRate : null,
      confidenceInterval: fore ? fore.confidenceInterval : null,
    };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-slate-800">Freight Rate Forecast</h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {[14, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setHorizon(days)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                horizon === days 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}}
              domain={['dataMin - 200', 'dataMax + 200']}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Area 
              type="monotone" 
              dataKey="confidenceInterval" 
              fill="#cbd5e1" 
              stroke="none" 
              name="Confidence Interval" 
              fillOpacity={0.4}
            />
            
            <Line 
              type="monotone" 
              dataKey="historicalRate" 
              stroke="#0f172a" 
              strokeWidth={2} 
              dot={{r: 3, fill: '#0f172a'}} 
              name="Historical" 
              connectNulls
            />
            
            <Line 
              type="monotone" 
              dataKey="forecastRate" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={{r: 3, fill: '#3b82f6'}} 
              name="Forecast" 
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
