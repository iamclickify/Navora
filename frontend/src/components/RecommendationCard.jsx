import { TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function RecommendationCard({ action, rationale, expectedSavings, currentRate }) {
  
  let actionColor = "text-slate-700 bg-slate-100 border-slate-200";
  let Icon = AlertCircle;
  
  if (action === "Buy Now") {
    actionColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    Icon = CheckCircle;
  } else if (action === "Wait") {
    actionColor = "text-blue-700 bg-blue-50 border-blue-200";
    Icon = TrendingDown;
  } else {
    actionColor = "text-amber-700 bg-amber-50 border-amber-200";
    Icon = TrendingUp;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-4">Strategic Recommendation</h3>
        
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border mb-4 ${actionColor}`}>
          <Icon size={20} />
          <span className="font-bold text-lg">{action}</span>
        </div>
        
        <p className="text-slate-600 mb-6">{rationale}</p>
        
        <div className="bg-white rounded-lg p-4 flex items-center justify-between border border-slate-100 mb-6">
          <div className="flex items-center space-x-3">
            <TrendingDown className="text-emerald-600" size={20} />
            <span className="text-slate-600 font-medium">Expected Savings vs Delay</span>
          </div>
          <span className="font-bold text-lg text-emerald-700">
            ${expectedSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}
          </span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
        <div className="text-right ml-auto">
          <p className="text-xs text-slate-500 mb-1">Current Base Rate</p>
          <p className="text-lg font-semibold text-slate-700">
            ${Math.round(currentRate).toLocaleString()}/day
          </p>
        </div>
      </div>
    </div>
  );
}
