import { useState, useEffect } from 'react';
import { Target, Info } from 'lucide-react';

export default function ModelAccuracyPanel() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/model-metrics');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setMetrics(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (isLoading) return <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />;
  if (error) return <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">Failed to load metrics</div>;

  const pointsBeaten = (metrics.baseline_naive_mape - metrics.mape).toFixed(2);
  const isBetter = pointsBeaten > 0;

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
          <Target size={20} />
        </div>
        <div>
          <p className="text-emerald-900 font-medium">
            Forecast accuracy: {metrics.mape}% avg error — {isBetter ? 'beats' : 'trails'} simple trend-following by {Math.abs(pointsBeaten)} points
          </p>
          <p className="text-emerald-700 text-sm">
            Based on rigorous out-of-sample testing from {metrics.test_date_range}
          </p>
        </div>
      </div>
      
      <div className="group relative">
        <button className="text-emerald-600 hover:text-emerald-800 p-2">
          <Info size={18} />
        </button>
        <div className="absolute right-0 top-10 w-64 bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <p className="mb-2"><strong>MAPE (Mean Absolute Percentage Error):</strong> The average percentage the model's predictions differ from the actual rates.</p>
          <p><strong>CI Calibration ({metrics.ci_calibration_pct}%):</strong> The percentage of actual values that fell within the model's projected 95% confidence bounds during testing.</p>
        </div>
      </div>
    </div>
  );
}
