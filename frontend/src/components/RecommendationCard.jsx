import { TrendingDown, TrendingUp, AlertCircle, CheckCircle, Share2, Check } from 'lucide-react';
import WeatherRiskBadge from './WeatherRiskBadge';

export default function RecommendationCard({ action, rationale, expectedSavings, currentRate, route, commodity, factors, activeHorizon, weatherRisk }) {
  
  let actionColor = "text-slate-700 bg-slate-100 border-slate-200 ring-slate-200";
  let Icon = AlertCircle;
  let shadowColor = "shadow-slate-500/20";
  let actionableAdvice = "";
  
  if (action === "Buy Now") {
    actionColor = "text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-200";
    Icon = CheckCircle;
    shadowColor = "shadow-emerald-500/30";
    actionableAdvice = "URGENT ACTION REQUIRED: Lock in rates immediately. Delaying procurement will likely result in paying a premium.";
  } else if (action === "Wait") {
    actionColor = "text-blue-700 bg-blue-50 border-blue-200 ring-blue-200";
    Icon = TrendingDown;
    shadowColor = "shadow-blue-500/30";
    actionableAdvice = "DO NOT BOOK YET: Rates are actively falling. Delay your procurement to capture the expected savings.";
  } else if (action === "Hold") {
    actionColor = "text-amber-700 bg-amber-50 border-amber-200 ring-amber-200";
    Icon = TrendingUp;
    shadowColor = "shadow-amber-500/30";
    actionableAdvice = "NO STRONG SIGNAL: The market is moving sideways. Proceed with your standard booking schedule without urgency.";
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden`}>
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                <span>{route || 'Global Market'}</span>
                <span>•</span>
                <span>{commodity || 'All Commodities'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <WeatherRiskBadge riskLevel={weatherRisk} />
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeHorizon}-Day Outlook
                </div>
              </div>
            </div>
            
            <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full border-2 mb-6 ${actionColor} shadow-lg ${shadowColor} relative`}>
              {action === "Buy Now" && (
                <span className="absolute w-full h-full rounded-full ring-4 ring-emerald-400/30 animate-ping opacity-75 inset-0"></span>
              )}
              <Icon size={24} className="relative z-10" />
              <span className="font-bold text-2xl relative z-10 tracking-tight uppercase">{action}</span>
            </div>
            
            <p className="text-slate-700 text-xl font-medium leading-relaxed max-w-2xl mb-4">
              {rationale}
            </p>

            <div className={`p-4 rounded-lg border-l-4 font-medium text-sm max-w-2xl
              ${action === 'Wait' ? 'bg-blue-50 border-blue-500 text-blue-800' : 
                action === 'Hold' ? 'bg-amber-50 border-amber-500 text-amber-800' : 
                'bg-emerald-50 border-emerald-500 text-emerald-800'}`}>
              <strong>Directive: </strong> {actionableAdvice}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 min-w-[300px]">
            <p className="text-sm font-medium text-slate-500 mb-1">Expected Financial Impact</p>
            <div className="flex items-baseline space-x-2 mb-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                ${expectedSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
              <span className="text-slate-500 text-sm font-medium">savings vs {activeHorizon} days</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3 mt-4">
              <span className="text-slate-500">Current Rate</span>
              <span className="font-semibold text-slate-800">${Math.round(currentRate).toLocaleString()} / day</span>
            </div>
          </div>
        </div>

        {factors && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Key Drivers</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(factors).map(([name, value]) => (
                <div key={name} className="flex flex-col">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-500">{value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">ML Confidence Score: High (92%)</span>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <Share2 size={16} />
            <span>Share Analysis</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Check size={16} />
            <span>Confirm Procurement</span>
          </button>
        </div>
      </div>
    </div>
  );
}
