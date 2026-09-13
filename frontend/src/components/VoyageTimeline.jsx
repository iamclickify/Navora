import { useState, useEffect } from 'react';

const DEFAULT_VOYAGES = [
  { id: 'V1', earliest_start: 0, duration: 25 },
  { id: 'V2', earliest_start: 20, duration: 20 },
  { id: 'V3', earliest_start: 45, duration: 22 }
];

export default function VoyageTimeline() {
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/multi-voyage-optimization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voyages: DEFAULT_VOYAGES,
            vessel_available_day: 0
          })
        });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        setScheduleData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4 flex-grow">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center text-red-500">
        Failed to load voyage schedule: {error}
      </div>
    );
  }

  const schedule = scheduleData?.optimal_schedule || [];
  const totalIdleDays = scheduleData?.total_idle_days || 0;

  if (!schedule.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex items-center justify-center text-slate-500">
        No schedule data available
      </div>
    );
  }

  const totalSpan = Math.max(...schedule.map(v => v.end_day)) + 5;

  // Calculate naive idle (unoptimized — just sequential)
  let naiveTotalIdle = 0;
  for (let i = 1; i < DEFAULT_VOYAGES.length; i++) {
    const prev = DEFAULT_VOYAGES[i - 1];
    const curr = DEFAULT_VOYAGES[i];
    const prevEnd = prev.earliest_start + prev.duration;
    naiveTotalIdle += Math.max(0, curr.earliest_start - prevEnd);
  }
  const naivePct = totalSpan > 0 ? Math.round((naiveTotalIdle / totalSpan) * 100) : 0;
  const optimizedPct = totalSpan > 0 ? Math.round((totalIdleDays / totalSpan) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-800">Multi-Voyage Optimization</h3>
          <p className="text-sm text-slate-500">Continuous routing vs. single-spot contracting</p>
        </div>
        <div className="mt-4 md:mt-0 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg flex items-center space-x-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Idle Time Reduced</span>
            <span className="text-xl font-bold text-emerald-700">{naivePct}% &rarr; {optimizedPct}%</span>
          </div>
        </div>
      </div>

      <div className="relative mt-8 mb-4">
        {/* Timeline Axis */}
        <div className="flex border-b border-slate-300 pb-2 mb-4" style={{ paddingLeft: '90px' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 text-center text-xs font-medium text-slate-400">
              D{Math.round((totalSpan / 10) * (i + 1))}
            </div>
          ))}
        </div>

        {/* Gantt Rows */}
        <div className="space-y-4">
          {schedule.map((voyage, index) => {
            const startPct = (voyage.start_day / totalSpan) * 100;
            const widthPct = ((voyage.end_day - voyage.start_day) / totalSpan) * 100;
            const idleDays = voyage.idle_before ?? 0;
            const idlePct = (idleDays / totalSpan) * 100;
            const idleStartPct = startPct - idlePct;

            return (
              <div key={voyage.id} className="relative flex items-center h-10">
                <div className="absolute left-0 w-[80px] text-xs font-medium text-slate-600 truncate pr-2">
                  {voyage.id}
                </div>
                <div className="ml-[90px] flex-1 relative h-full bg-slate-50 rounded-md overflow-hidden">
                  {idleDays > 0 && (
                    <div
                      className="absolute top-2 bottom-2 bg-amber-200/50 border border-amber-300 border-dashed rounded-sm"
                      style={{ left: `${Math.max(0, idleStartPct)}%`, width: `${idlePct}%` }}
                      title={`${idleDays} idle days`}
                    />
                  )}
                  <div
                    className="absolute top-1 bottom-1 bg-blue-600 rounded-md shadow-sm flex items-center px-3 text-xs font-medium text-white truncate"
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  >
                    {voyage.duration ?? voyage.end_day - voyage.start_day}d
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 mt-8 ml-[90px]">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>
            <span className="text-xs text-slate-600">Active Voyage</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-200/50 border border-amber-300 border-dashed rounded-sm"></div>
            <span className="text-xs text-slate-600">Idle / Repositioning</span>
          </div>
        </div>
      </div>
    </div>
  );
}
