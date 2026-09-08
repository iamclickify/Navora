export default function VoyageTimeline({ voyages }) {
  // Find the total span of weeks to scale the chart
  const maxWeek = Math.max(...voyages.map(v => v.end_week)) + 1;
  const totalWeeks = Math.max(16, maxWeek); // Provide at least 16 weeks of space
  
  // Calculate total idle time vs total time
  const totalDuration = maxWeek - 1; // Simplification
  const totalIdleDays = voyages.reduce((sum, v) => sum + v.idle_before_days, 0);
  
  // We'll use a CSS Grid where each column is a week for simple Gantt mapping
  
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
            <span className="text-xl font-bold text-emerald-700">35% &rarr; 8%</span>
          </div>
        </div>
      </div>
      
      <div className="relative mt-8 mb-4">
        {/* Timeline Axis */}
        <div 
          className="flex border-b border-slate-300 pb-2 mb-4"
          style={{ paddingLeft: '100px' }} // Space for labels
        >
          {Array.from({ length: totalWeeks }).map((_, i) => (
            <div key={i} className="flex-1 text-center text-xs font-medium text-slate-400">
              W{i + 1}
            </div>
          ))}
        </div>
        
        {/* Gantt Rows */}
        <div className="space-y-4">
          {voyages.map((voyage, index) => {
            // We use basic percentages for positioning
            const startPct = ((voyage.start_week - 1) / totalWeeks) * 100;
            const widthPct = ((voyage.end_week - voyage.start_week) / totalWeeks) * 100;
            const idlePct = (voyage.idle_before_days / 7 / totalWeeks) * 100; // rough approximation of days to weeks
            const idleStartPct = startPct - idlePct;

            return (
              <div key={voyage.id} className="relative flex items-center h-10">
                {/* Row Label */}
                <div className="absolute left-0 w-[90px] text-sm font-medium text-slate-600 truncate pr-2">
                  V{index + 1}: {voyage.origin}
                </div>
                
                {/* Track Area */}
                <div className="ml-[100px] flex-1 relative h-full bg-slate-50 rounded-md overflow-hidden">
                  {/* Grid Lines */}
                  {Array.from({ length: totalWeeks }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 bottom-0 border-l border-slate-200"
                      style={{ left: `${(i / totalWeeks) * 100}%` }}
                    />
                  ))}
                  
                  {/* Idle Period */}
                  {voyage.idle_before_days > 0 && (
                    <div 
                      className="absolute top-2 bottom-2 bg-amber-200/50 border border-amber-300 border-dashed rounded-sm flex items-center justify-center"
                      style={{ left: `${idleStartPct}%`, width: `${idlePct}%` }}
                      title={`${voyage.idle_before_days} idle days`}
                    />
                  )}
                  
                  {/* Active Voyage Period */}
                  <div 
                    className="absolute top-1 bottom-1 bg-blue-600 rounded-md shadow-sm flex items-center px-3 text-xs font-medium text-white truncate"
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  >
                    Active Voyage
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-6 mt-8 ml-[100px]">
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
