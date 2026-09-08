import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function MarketTrendsChart({ data }) {
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
        <h3 className="font-semibold text-lg text-slate-800">Market Trends</h3>
        <p className="text-sm text-slate-500">Historical BDI & Fuel Prices</p>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBdi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              label={{ value: 'BDI', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14, fontWeight: 'bold' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={true} 
              tickLine={true} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              label={{ value: 'Fuel Price (USD)', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14, fontWeight: 'bold' } }}
            />
            <Tooltip 
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="bdi" 
              name="Baltic Dry Index"
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBdi)" 
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="fuel" 
              name="Fuel Price (USD)"
              stroke="#f59e0b" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorFuel)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
