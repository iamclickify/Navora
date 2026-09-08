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

export default function WeatherChart({ data, portName }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="flex-1 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="font-semibold text-lg text-slate-800">{portName} Weather Trends</h3>
        <p className="text-sm text-slate-500">Wind Speed vs Precipitation</p>
      </div>
      
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              label={{ value: 'Rain (mm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14, fontWeight: 'bold' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              label={{ value: 'Wind Speed (km/h)', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14, fontWeight: 'bold' } }}
            />
            <Tooltip 
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
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
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
