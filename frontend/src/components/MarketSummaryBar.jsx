import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Activity, Anchor, Fuel, CloudLightning } from 'lucide-react';

export default function MarketSummaryBar() {
  const [summary, setSummary] = useState(null);
  const [weatherRisk, setWeatherRisk] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, weatherRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/market-summary'),
          fetch('http://127.0.0.1:8000/api/v1/weather-risk')
        ]);
        
        if (!summaryRes.ok) throw new Error("Failed to fetch market summary");
        
        const summaryData = await summaryRes.json();
        setSummary(summaryData);

        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          setWeatherRisk(weatherData.weather_risk);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border-b border-slate-800 text-slate-400 px-6 py-2 flex items-center justify-between text-xs animate-pulse">
        <div className="flex space-x-6">
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
          <div className="h-4 w-24 bg-slate-800 rounded"></div>
        </div>
        <div className="h-4 w-32 bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (error || !summary) {
    return null; // hide gracefully if error
  }

  const TrendIcon = ({ trend }) => {
    if (trend > 0) return <TrendingUp size={14} className="text-emerald-400 ml-1" />;
    if (trend < 0) return <TrendingDown size={14} className="text-red-400 ml-1" />;
    return null;
  };

  const trendColor = (trend) => {
    if (trend > 0) return 'text-emerald-400';
    if (trend < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-300 px-6 py-2 flex items-center justify-between text-xs shadow-inner">
      <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap hide-scrollbar flex-1">
        
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-blue-400" />
          <span className="font-semibold text-white">BDI (Global):</span>
          <span className="font-mono">{summary.bdi.value.toLocaleString()}</span>
          <span className={`flex items-center font-mono ${trendColor(summary.bdi.trend_pct)}`}>
            ({summary.bdi.trend_pct > 0 ? '+' : ''}{summary.bdi.trend_pct}%)
            <TrendIcon trend={summary.bdi.trend_pct} />
          </span>
        </div>

        <div className="w-px h-4 bg-slate-700"></div>

        <div className="flex items-center space-x-2">
          <Fuel size={14} className="text-amber-400" />
          <span className="font-semibold text-white">Bunker Fuel (Proxy):</span>
          <span className="font-mono">${summary.fuel.value.toFixed(2)}</span>
          <span className={`flex items-center font-mono ${trendColor(summary.fuel.trend_pct)}`}>
            ({summary.fuel.trend_pct > 0 ? '+' : ''}{summary.fuel.trend_pct}%)
            <TrendIcon trend={summary.fuel.trend_pct} />
          </span>
        </div>

        <div className="w-px h-4 bg-slate-700"></div>

        <div className="flex items-center space-x-2">
          <Anchor size={14} className="text-rose-400" />
          <span className="font-semibold text-white">Avg Congestion:</span>
          <span className="font-mono">{summary.congestion.value.toFixed(2)} idx</span>
          <span className={`flex items-center font-mono ${trendColor(summary.congestion.trend_pct)}`}>
            ({summary.congestion.trend_pct > 0 ? '+' : ''}{summary.congestion.trend_pct}%)
            <TrendIcon trend={summary.congestion.trend_pct} />
          </span>
        </div>
        
        {/* Financial Risk Ticker */}
        {weatherRisk && (
          <>
            <div className="w-px h-4 bg-slate-700"></div>
            <div className="flex items-center space-x-4 animate-[marquee_25s_linear_infinite] overflow-hidden">
              <div className="flex items-center space-x-2 text-rose-300">
                <CloudLightning size={14} />
                <span className="font-semibold">Port Weather Risk:</span>
              </div>
              {Object.entries(weatherRisk).map(([port, data]) => {
                let color = "text-emerald-400";
                let penaltyText = "No Penalty";
                if (data.risk_score === "High") {
                  color = "text-red-400";
                  penaltyText = "Est. +15% Cost (Demurrage)";
                } else if (data.risk_score === "Medium") {
                  color = "text-amber-400";
                  penaltyText = "Est. +5% Cost";
                }
                
                return (
                  <div key={port} className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">
                    <span className="text-white font-medium">{port}</span>
                    <span className={color}>({data.risk_score})</span>
                    {data.risk_score !== "Low" && <span className="text-slate-400 ml-1">- {penaltyText}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      <div className="flex items-center space-x-2 text-slate-500 ml-4 hidden sm:flex">
        <Clock size={12} />
        <span>Last Updated: {summary.last_updated}</span>
      </div>
    </div>
  );
}
