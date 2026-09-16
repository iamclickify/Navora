import { useState, useEffect } from 'react';
import BASE_URL from '../api/client';
import { 
  AreaChart, Area, 
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';

export default function HistoricalRatesExplorer() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState("90");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/api/v1/historical-rates?limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        const mapped = result.data.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rate: parseFloat(d.freight_rate_usd_per_t),
          bdi: parseFloat(d.bdi_index),
          fuel: parseFloat(d["fuel in usd"]),
          congestion: parseFloat(d.congestion_score),
        }));
        
        setData(mapped.reverse());
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  const chartConfig = {
    rate: { label: "Spot Rate ($)", color: "hsl(var(--chart-1, 221.2 83.2% 53.3%))" },
    bdi: { label: "BDI Index", color: "hsl(var(--chart-2, 14.1 79% 53%))" },
    fuel: { label: "Fuel (USD)", color: "hsl(var(--chart-3, 44 91% 54%))" },
    congestion: { label: "Congestion", color: "hsl(var(--chart-4, 280 65% 60%))" },
  };

  const commonXAxis = (
    <XAxis 
      dataKey="date" axisLine={false} tickLine={false} 
      tick={{fill: '#64748b', fontSize: 10}} dy={10} minTickGap={30}
    />
  );
  
  const commonGrid = <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />;

  return (
    <Card className="rounded-2xl shadow-xl border-slate-200">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
        <div>
          <CardTitle className="font-bold text-2xl text-slate-800">Historical Market Explorer</CardTitle>
          <CardDescription className="text-slate-500 mt-1">
            Track past spot market fluctuations and underlying economic drivers
          </CardDescription>
        </div>
        
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-[160px] bg-white border-slate-200 text-slate-700 h-10 font-medium">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-700">
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="180">Last 6 Months</SelectItem>
            <SelectItem value="365">Last 1 Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center text-red-500 bg-red-50 rounded-xl">
            Failed to load historical data: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
            
            {/* Freight Rate Chart */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wide">Freight Rate (USD/t)</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    {commonGrid}
                    {commonXAxis}
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} width={45} />
                    <ChartTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl rounded-lg font-medium" />} />
                    <Area type="monotone" dataKey="rate" stroke="var(--color-rate)" strokeWidth={3} fill="url(#fillRate)" activeDot={{ r: 5, fill: "var(--color-rate)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* BDI Chart */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wide">Baltic Dry Index</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {commonGrid}
                    {commonXAxis}
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} width={45} />
                    <ChartTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl rounded-lg font-medium" />} />
                    <Line type="monotone" dataKey="bdi" stroke="var(--color-bdi)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "var(--color-bdi)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Fuel Price Chart */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wide">Bunker Fuel (USD/t)</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {commonGrid}
                    {commonXAxis}
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} width={45} />
                    <ChartTooltip cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl rounded-lg font-medium" />} />
                    <Line type="monotone" dataKey="fuel" stroke="var(--color-fuel)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "var(--color-fuel)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Congestion Chart */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-600 uppercase tracking-wide">Congestion Index</h3>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    {commonGrid}
                    {commonXAxis}
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[0, 1]} width={35} />
                    <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl rounded-lg font-medium" />} />
                    <Bar dataKey="congestion" fill="var(--color-congestion)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
