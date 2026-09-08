import { Link } from 'react-router-dom';

export default function RouteSelector({ scenarios, selectedRoute, onSelectRoute, selectedCommodity, onSelectCommodity }) {
  const routes = Object.keys(scenarios);
  const currentScenario = scenarios[selectedRoute];

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-xl text-slate-800 hover:text-blue-600 transition-colors cursor-pointer">
          Navora
        </Link>
        <div className="h-6 w-px bg-slate-300"></div>
        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Dashboard</div>
      </div>

      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-600">Route:</label>
          <select 
            value={selectedRoute} 
            onChange={(e) => onSelectRoute(e.target.value)}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {routes.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>
        </div>
        
        {currentScenario && (
          <>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-600">Commodity:</label>
              <select 
                value={selectedCommodity} 
                onChange={(e) => onSelectCommodity(e.target.value)}
                className="border border-slate-300 rounded-md py-1.5 px-3 text-sm text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {currentScenario.validCommodities.map(comm => (
                  <option key={comm} value={comm}>{comm}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              <span>Volume: <span className="font-semibold text-slate-700">{currentScenario.volumes[selectedCommodity]?.toLocaleString()} t</span></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
