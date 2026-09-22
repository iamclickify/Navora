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
  ReferenceLine
} from 'recharts';

export default function ForecastChart({ forecastData, activeModel = 'ensemble', activeHorizon }) {
  if (!forecastData || !forecastData.historical || !forecastData.horizons || !forecastData.horizons[activeHorizon]) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">No forecast data available</div>;
  }

  const { historical } = forecastData;
  const horizonData = forecastData.horizons[activeHorizon] || {};
  const activeForecast = horizonData[activeModel] || horizonData.data || [];

  const lastHist = historical.length > 0 ? historical[historical.length - 1] : null;
  const lastHistRate = lastHist ? lastHist.rate : null;

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

  // Seamlessly bridge the last historical data point into the forecast line
  if (lastHist && forecastMapped.length > 0 && forecastMapped[0].date !== lastHist.date) {
    forecastMapped.unshift({
      date: lastHist.date,
      forecastRate: lastHist.rate,
      confidenceInterval: [lastHist.rate, lastHist.rate]
    });
  }

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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-800">{activeHorizon}-Day BDI Forecast</h3>
          <p className="text-sm text-slate-500 mt-1">Projected rates using {activeModel} model</p>
        </div>
        {lastHistRate && (
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Rate</p>
            <p className="text-xl font-bold text-slate-800">${Math.round(lastHistRate).toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <div className="flex-grow min-h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorCI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 11}} 
              dy={10}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94a3b8', fontSize: 11}}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: '500' }}
              labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '8px' }}
              formatter={(value, name) => {
                if (name === 'confidenceInterval') return [`$${Math.round(value[0])} - $${Math.round(value[1])}`, '95% CI'];
                return [`$${Math.round(value)}`, name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
            
            {lastHistRate && (
              <ReferenceLine y={lastHistRate} stroke="#e2e8f0" strokeDasharray="3 3" />
            )}

            <Area 
              type="linear" 
              dataKey="confidenceInterval" 
              fill="url(#colorCI)" 
              stroke="none" 
              name="95% Confidence Interval" 
            />
            
            <Area 
              type="linear" 
              dataKey="historicalRate" 
              fill="url(#colorHist)" 
              stroke="#0f172a" 
              strokeWidth={2.5} 
              name="Historical" 
              connectNulls
            />
            
            <Line 
              type="linear" 
              dataKey="forecastRate" 
              stroke="#3b82f6" 
              strokeWidth={2.5} 
              strokeDasharray="4 4"
              dot={{ r: 2, fill: '#3b82f6' }}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              name={`Forecast`}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
