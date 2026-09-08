import { TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function RecommendationCard({ recommendation, adjustedRate }) {
  const { expected_savings_usd, base_rate, rationale } = recommendation;
  
  // Calculate dynamic recommendation based on adjusted rate
  let actionLabel = recommendation.action;
  let actionColor = "text-slate-700 bg-slate-100 border-slate-200";
  let Icon = AlertCircle;
  let dynamicRationale = rationale;
  
  const ratio = adjustedRate / base_rate;
  
  if (ratio > 1.05) {
    actionLabel = "Buy Now";
    actionColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    Icon = CheckCircle;
    dynamicRationale = "Adjusted forecast indicates rates will rise significantly. Secure vessels immediately.";
  } else if (ratio < 0.95) {
    actionLabel = "Wait";
    actionColor = "text-blue-700 bg-blue-50 border-blue-200";
    Icon = TrendingDown;
    dynamicRationale = "Adjusted forecast indicates rates will fall. Delay procurement for better pricing.";
  } else {
    actionLabel = "Hold / Monitor";
    actionColor = "text-amber-700 bg-amber-50 border-amber-200";
    Icon = TrendingUp; // Or just a neutral icon
    dynamicRationale = "Rates are expected to remain stable. Monitor market conditions closely.";
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-4">Strategic Recommendation</h3>
        
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border mb-4 ${actionColor}`}>
          <Icon size={20} />
          <span className="font-bold text-lg">{actionLabel}</span>
        </div>
        
        <p className="text-slate-600 mb-6 line-clamp-3">
          {dynamicRationale}
        </p>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Expected Savings vs Spot</p>
          <p className="text-2xl font-bold text-slate-800">
            ${expected_savings_usd.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Current Base Rate</p>
          <p className="text-lg font-semibold text-slate-700">
            ${Math.round(adjustedRate).toLocaleString()}/day
          </p>
        </div>
      </div>
    </div>
  );
}
