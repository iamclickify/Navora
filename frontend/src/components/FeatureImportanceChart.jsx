import { useState, useEffect } from 'react';
import BASE_URL from '../api/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function FeatureImportanceChart() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${BASE_URL}/api/v1/feature-importance`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        // Normalize to percentages
        const total = result.data.reduce((acc, curr) => acc + curr.importance, 0);
        const normalized = result.data.map(d => ({
          ...d,
          importancePct: total > 0 ? (d.importance / total) * 100 : 0
        }));
        
        setData(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="h-64 flex items-center justify-center text-slate-500">Loading importance data...</div>;
  if (error) return <div className="h-64 flex items-center justify-center text-red-500">Failed to load feature importance: {error}</div>;

  const getColor = (feature) => {
    const f = feature.toLowerCase();
    if (f.includes('fuel')) return '#f59e0b'; // Amber
    if (f.includes('lag') || f.includes('rolling')) return '#3b82f6'; // Blue
    if (f.includes('month') || f.includes('day')) return '#8b5cf6'; // Purple
    if (f.includes('congestion')) return '#ef4444'; // Red
    return '#94a3b8'; // Slate
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm">
          <p className="font-semibold text-slate-800 mb-1">{data.feature}</p>
          <p className="text-slate-600">Impact Weight: <span className="font-bold text-slate-800">{data.importancePct.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="font-semibold text-lg text-slate-800 mb-2">What's driving this forecast</h3>
      <p className="text-sm text-slate-500 mb-6">Relative contribution of signals learned by XGBoost.</p>
      
      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis 
              type="number" 
              hide 
            />
            <YAxis 
              dataKey="feature" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{fill: '#475569', fontSize: 12, fontWeight: 500}}
              width={160}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="importancePct" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.feature)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-100 pt-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Fuel Costs</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Market Momentum</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Seasonality</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Port Congestion</span>
        </div>
      </div>
    </div>
  );
}
