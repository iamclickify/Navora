import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertCircle } from 'lucide-react';

export default function MultiHorizonPanel({ horizonsData, activeHorizon, onSelectHorizon, weatherRisk }) {
  if (!horizonsData) return null;

  const getIcon = (recommendation) => {
    if (recommendation === 'Buy Now') return <CheckCircle size={16} className="text-emerald-600" />;
    if (recommendation === 'Wait' || recommendation === 'Monitor') return <TrendingDown size={16} className="text-blue-600" />;
    return <Minus size={16} className="text-amber-600" />;
  };

  const getRecColor = (recommendation) => {
    if (recommendation === 'Buy Now') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (recommendation === 'Wait' || recommendation === 'Monitor') return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getDisplayRec = (rec) => {
    if (rec === 'Wait') return 'Monitor';
    if (rec === 'Hold') return 'Standard Schedule';
    return rec;
  };

  const getTrendColor = (pct) => {
    if (pct > 0) return 'text-emerald-600';
    if (pct < 0) return 'text-blue-600';
    return 'text-slate-500';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <h3 className="font-semibold text-lg text-slate-800 mb-4">Multi-Horizon Outlook</h3>
      <div className="flex flex-wrap gap-4 overflow-x-auto pb-2">
        {['7', '15', '30', '60', '90'].map(horizonKey => {
          const data = horizonsData[horizonKey];
          if (!data) return null;
          
          const isSelected = activeHorizon === horizonKey;
          const showRiskNote = horizonKey === '7' && (weatherRisk === 'High' || weatherRisk === 'Medium');

          return (
            <div 
              key={horizonKey}
              onClick={() => onSelectHorizon(horizonKey)}
              className={`flex-1 min-w-[150px] cursor-pointer border rounded-xl p-4 transition-all flex flex-col justify-between ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-md bg-blue-50/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{horizonKey} Days</p>
                
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-bold uppercase mb-3 border ${getRecColor(data.recommendation)}`}>
                  {getIcon(data.recommendation)}
                  <span>{getDisplayRec(data.recommendation)}</span>
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-slate-800">${Math.round(data.avg_rate).toLocaleString()}</span>
                </div>
                <div className={`flex items-center text-sm font-medium mt-1 ${getTrendColor(data.pct_change)}`}>
                  {data.pct_change > 0 ? <TrendingUp size={14} className="mr-1"/> : (data.pct_change < 0 ? <TrendingDown size={14} className="mr-1"/> : null)}
                  {data.pct_change > 0 ? '+' : ''}{data.pct_change.toFixed(1)}%
                </div>
              </div>
              
              {showRiskNote && (
                <div className={`mt-3 text-xs font-medium px-2 py-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-start space-x-1.5`}>
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{weatherRisk} risk alert: loading delays possible.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
