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
} from 'recharts';

export default function ForecastChart({ forecastData, activeModel = 'ensemble' }) {
  if (!forecastData || !forecastData.historical || !forecastData.model_predictions) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">No forecast data available</div>;
  }

  const { historical, model_predictions } = forecastData;
  const activeForecast = model_predictions[activeModel] || [];

  // Combine historical and forecast for the chart
  const historicalMapped = historical.map(d => ({
    date: d.date,
    historicalRate: d.rate,
  }));

  const forecastMapped = activeForecast.map(d => ({
    date: d.date,
    forecastRate: d.rate,
    confidenceInterval: (d.lower !== undefined && d.upper !== undefined) ? [d.lower, d.upper] : null
  }));

  // Merge data by date for ComposedChart
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
              domain={['auto', 'auto']}
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
              name="95% Confidence Interval" 
              fillOpacity={0.4}
            />
            
            <Line 
              type="monotone" 
              dataKey="historicalRate" 
              stroke="#0f172a" 
              strokeWidth={2} 
              dot={false}
              name="Historical" 
              connectNulls
            />
            
            <Line 
              type="monotone" 
              dataKey="forecastRate" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
              name={`Forecast (${activeModel})`}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
