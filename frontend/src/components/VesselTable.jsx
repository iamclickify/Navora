import { useState, useEffect } from 'react';
import BASE_URL from '../api/client';
import { Anchor, DollarSign, AlertTriangle, Package, Fuel, Wrench, ShipWheel, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

// Rank badge styles
const RANK_STYLES = {
  0: { badge: 'bg-amber-400 text-amber-900 border-none hover:bg-amber-400', ring: '', label: '#1' },
  1: { badge: 'bg-slate-300 text-slate-700 border-none hover:bg-slate-300', ring: '', label: '#2' },
  2: { badge: 'bg-orange-300 text-orange-800 border-none hover:bg-orange-300', ring: '', label: '#3' },
};

function UtilizationBar({ pct }) {
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-slate-400';
  const textColor = pct >= 85 ? 'text-emerald-600' : pct >= 60 ? 'text-blue-600' : 'text-slate-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-600">Cargo Utilization</span>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      
    </div>
  );
}

function CostBreakdown({ breakdown, totalCost }) {
  const items = [
    { label: 'Freight', value: breakdown?.freight_cost, icon: TrendingDown, color: 'text-blue-500' },
    { label: 'Fuel', value: breakdown?.fuel_cost, icon: Fuel, color: 'text-amber-500' },
    { label: 'Port Fee', value: breakdown?.port_fee, icon: Anchor, color: 'text-violet-500' },
    { label: 'OpEx', value: breakdown?.opex, icon: Wrench, color: 'text-slate-400' },
  ].filter(i => i.value != null);

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
      {items.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon size={14} className={color} />
            <span className="text-slate-600">{label}</span>
          </div>
          <span className="font-bold text-slate-700">${(value / 1000).toFixed(0)}k</span>
        </div>
      ))}
    </div>
  );
}

export default function VesselTable({ portName, cargoVolume, predictedRate }) {
  const [vessels, setVessels] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!portName || !predictedRate) return;

    async function fetchVessels() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BASE_URL}/api/v1/vessel-recommendation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            port_name: portName,
            cargo_volume: cargoVolume || 50000,
            predicted_freight_rate: predictedRate,
            transit_days: 15
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.detail || `API error ${response.status}`);
        }
        const data = await response.json();
        setVessels(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchVessels();
  }, [portName, cargoVolume, predictedRate]);

  if (error) {
    return (
      <Card className="p-8 border-red-200 flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-slate-600 font-medium">Vessel ranking unavailable</p>
        <p className="text-red-500 text-sm max-w-xs">{error}</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 border-slate-200">
        <div className="h-7 bg-slate-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-slate-100 rounded w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const feasible = vessels?.feasible_vessels || [];
  const infeasible = vessels?.infeasible_vessels || [];

  // Best match = highest utilization
  const bestMatchClass = feasible.length > 0
    ? feasible.reduce((best, v) => (v.cargo_utilization_pct > best.cargo_utilization_pct ? v : best)).vessel_class
    : null;

  return (
    <Card className="rounded-2xl shadow-sm border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="font-bold text-2xl text-slate-800 flex items-center gap-2">
            <ShipWheel size={26} className="text-blue-500" />
            Vessel Ranking
          </CardTitle>
          <CardDescription className="text-base text-slate-500 mt-1">
            Ranked by total voyage cost for <span className="font-semibold text-slate-700">{portName}</span>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-bold shadow-sm">
          <Package size={16} />
          <span>{(cargoVolume / 1000).toFixed(0)}k t cargo</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-5 text-sm font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> ≥85% — Optimal fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 60–84% — Good fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> &lt;60% — Underutilized</span>
        </div>

        {/* Feasible Vessel Cards */}
        {feasible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {feasible.map((vessel, i) => {
              const rank = RANK_STYLES[i] || { badge: 'bg-slate-200 text-slate-600 border-none', ring: '', label: `#${i + 1}` };
              const isBest = vessel.vessel_class === bestMatchClass;
              const isWeatherRisk = vessel.weather_risk_label && vessel.weather_risk_label !== 'Low';

              return (
                <Card
                  key={`f-${i}`}
                  className={`relative flex flex-col gap-3 transition-all hover:shadow-md ${isBest ? 'border-emerald-200 shadow-sm shadow-emerald-100' : 'border-slate-200'} ${rank.ring}`}
                >
                  <CardContent className="p-4 flex flex-col h-full gap-3">
                    {/* Rank Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className={`${rank.badge} px-2 py-0.5 rounded-full`}>
                        {rank.label}
                      </Badge>
                      {isBest && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border-emerald-200">
                          Best Match
                        </Badge>
                      )}
                    </div>

                    {/* Vessel Name + Capacity */}
                    <div>
                      <div className="font-bold text-slate-800 text-lg leading-tight">{vessel.vessel_class}</div>
                      <div className="text-sm font-medium text-slate-500 mt-1">
                        {vessel.capacity_t ? `${(vessel.capacity_t / 1000).toFixed(0)}k t capacity` : '—'}
                      </div>
                    </div>

                    {/* Utilization Bar */}
                    {vessel.cargo_utilization_pct != null && (
                      <UtilizationBar pct={vessel.cargo_utilization_pct} />
                    )}

                    {/* Total Cost */}
                    <div className="flex items-baseline gap-1 mt-1">
                      <DollarSign size={16} className="text-slate-400 mb-0.5" />
                      <span className="font-extrabold text-slate-800 text-2xl tracking-tight">
                        {(vessel.total_cost / 1000000).toFixed(2)}M
                      </span>
                      <span className="text-sm font-medium text-slate-500">total</span>
                    </div>

                    {/* Cost Breakdown */}
                    {vessel.breakdown && <CostBreakdown breakdown={vessel.breakdown} totalCost={vessel.total_cost} />}

                    {/* Weather Warning */}
                    {isWeatherRisk && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1">
                        <AlertTriangle size={11} />
                        <span>Weather risk penalty applied</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Infeasible Vessels */}
        {infeasible.length > 0 && (
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 mt-4">
              Not Feasible for This Cargo
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {infeasible.map((vessel, i) => (
                <Card
                  key={`inf-${i}`}
                  className="bg-red-50/50 border-red-200 flex flex-col gap-1"
                >
                  <CardContent className="p-4">
                    <div className="font-bold text-slate-800 text-base mb-1">{vessel.vessel_class}</div>
                    <div className="font-bold text-xs text-red-600 leading-snug">
                      {typeof vessel.reasons === 'string'
                        ? vessel.reasons.split(';')[0]
                        : Array.isArray(vessel.reasons) ? vessel.reasons[0] : 'Infeasible'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {feasible.length === 0 && infeasible.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No vessel data available for {portName}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
