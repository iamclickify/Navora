import { TrendingDown, TrendingUp, AlertCircle, CheckCircle, Share2, Fuel, Anchor, Wind, BarChart2, Package } from 'lucide-react';
import WeatherRiskBadge from './WeatherRiskBadge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

const DRIVER_ICONS = {
  'Fuel Impact': Fuel,
  'Port Congestion': Anchor,
  'Seasonality (Calendar)': BarChart2,
  'Market Momentum (Lags)': TrendingUp,
  // Fallbacks
  'Fuel': Fuel,
  'Congestion': Anchor,
  'Weather': Wind,
};

const DRIVER_COLORS = {
  0: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  1: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  2: { bar: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50' },
};

export default function RecommendationCard({ action, rationale, expectedSavings, currentRate, route, factors, activeHorizon, weatherRisk, cargoVolume }) {
  
  let actionColor = "text-slate-700 bg-slate-100 border-slate-200 ring-slate-200";
  let Icon = AlertCircle;
  let shadowColor = "shadow-slate-500/20";
  let actionableAdvice = "";
  
  if (action === "Buy Now") {
    actionColor = "text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-200";
    Icon = CheckCircle;
    shadowColor = "shadow-emerald-500/30";
    actionableAdvice = "URGENT ACTION REQUIRED: Lock in rates immediately. Delaying procurement will likely result in paying a premium.";
  } else if (action === "Wait" || action === "Monitor") {
    actionColor = "text-blue-700 bg-blue-50 border-blue-200 ring-blue-200";
    Icon = TrendingDown;
    shadowColor = "shadow-blue-500/30";
    actionableAdvice = "DEFER BOOKING: Rates are actively falling. Delay your procurement to capture the expected savings.";
  } else if (action === "Hold") {
    actionColor = "text-amber-700 bg-amber-50 border-amber-200 ring-amber-200";
    Icon = TrendingUp;
    shadowColor = "shadow-amber-500/30";
    actionableAdvice = "STANDARD SCHEDULE: The market is moving sideways. Proceed with your standard booking schedule without urgency.";
  }

  // Get top 3 drivers sorted by impact
  const topDrivers = factors && Object.keys(factors).length > 0
    ? Object.entries(factors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  const cargoLabel = cargoVolume
    ? `${(cargoVolume / 1000).toFixed(0)}k t`
    : '50k t';

  const displayAction = action === "Wait" ? "Monitor" : action;

  return (
    <Card className={`rounded-2xl shadow-xl border-slate-200 overflow-hidden`}>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">Market Analysis & Forecasting</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium">
                <span>{route || 'Global Market'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <WeatherRiskBadge riskLevel={weatherRisk} />
                <Badge variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeHorizon}-Day Outlook
                </Badge>
              </div>
            </div>
            
            <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full border-2 mb-6 ${actionColor} shadow-lg ${shadowColor} relative`}>
              {displayAction === "Buy Now" && (
                <span className="absolute w-full h-full rounded-full ring-4 ring-emerald-400/30 animate-ping opacity-75 inset-0"></span>
              )}
              <Icon size={24} className="relative z-10" />
              <span className="font-bold text-2xl relative z-10 tracking-tight uppercase">{displayAction}</span>
            </div>
            
            <p className="text-slate-700 text-xl font-medium leading-relaxed max-w-2xl mb-4">
              {rationale}
            </p>

            <div className={`p-4 rounded-lg border-l-4 font-medium text-sm max-w-2xl
              ${(action === 'Wait' || action === 'Monitor') ? 'bg-blue-50 border-blue-500 text-blue-800' : 
                action === 'Hold' ? 'bg-amber-50 border-amber-500 text-amber-800' : 
                'bg-emerald-50 border-emerald-500 text-emerald-800'}`}>
              <strong>Directive: </strong> {actionableAdvice}
            </div>
          </div>

          <Card className="bg-slate-50 border-slate-100 min-w-[300px]">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-1">Expected Financial Impact</p>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-extrabold text-emerald-600">
                  ${expectedSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </span>
                <span className="text-slate-500 text-sm font-medium">savings vs {activeHorizon} days</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-3">
                <Package size={12} />
                <span>Based on {cargoLabel} cargo</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3 mt-1">
                <span className="text-slate-500">Current Rate</span>
                <span className="font-semibold text-slate-800">${Math.round(currentRate).toLocaleString()} / day</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forecast Drivers — top 3 */}
        {topDrivers.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">What's Driving This Forecast</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topDrivers.map(([name, value], idx) => {
                const colors = DRIVER_COLORS[idx] || DRIVER_COLORS[2];
                const DriverIcon = DRIVER_ICONS[name] || BarChart2;
                return (
                  <div key={name} className={`${colors.bg} rounded-xl p-4 border border-slate-100`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
                        <DriverIcon size={14} className={colors.text} />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">{name}</span>
                    </div>
                    <Progress value={value} className="h-2 mb-2 bg-white" indicatorColor={colors.bar} />
                    <div className={`text-xs font-bold ${colors.text}`}>{value}% impact</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between m-0">
        <span className="text-xs text-slate-400 font-medium">ML Confidence Score: High (92%)</span>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2 bg-white text-slate-600">
            <Share2 size={16} />
            <span>Share Analysis</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
