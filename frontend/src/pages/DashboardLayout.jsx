import { useState, useEffect } from 'react';
import BASE_URL from '../api/client';
import { Outlet, useOutletContext } from 'react-router-dom';
import RouteSelector from '../components/RouteSelector';
import MarketSummaryBar from '../components/MarketSummaryBar';
import Sidebar from '../components/Sidebar';
import { mockScenarios } from '../data/mockData';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(Object.keys(mockScenarios)[0]);
  const [cargoVolume, setCargoVolume] = useState(50000);
  
  const [activeModel, setActiveModel] = useState('ensemble');
  const [activeHorizon, setActiveHorizon] = useState('30'); // '7', '15', '30', '60', '90'

  // Sensitivity State
  const [fuelShock, setFuelShock] = useState(0);
  const [congestionShock, setCongestionShock] = useState(0);

  // API States
  const [forecastData, setForecastData] = useState(null);
  const [isForecastLoading, setIsForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

  const scenario = mockScenarios[selectedRoute];
  const destPort = scenario.routeInfo.destination;

  // Keep-alive ping: Render free tier spins down after 15min of inactivity.
  // Ping the health endpoint every 13 minutes to keep it warm.
  useEffect(() => {
    const ping = () => fetch(`${BASE_URL}/docs`).catch(() => {});
    ping(); // Ping immediately on mount (wakes up Render if sleeping)
    const interval = setInterval(ping, 13 * 60 * 1000); // Every 13 minutes
    return () => clearInterval(interval);
  }, []);

  // Load Forecast Data
  useEffect(() => {
    async function loadForecast() {
      setIsForecastLoading(true);
      setForecastError(null);
      try {
        let url = `${BASE_URL}/api/v1/multi-horizon-forecast?route=${encodeURIComponent(selectedRoute)}&cargo_volume=${cargoVolume}`;
        if (fuelShock !== 0) url += `&fuel_shock_pct=${fuelShock}`;
        if (congestionShock !== 0) url += `&congestion_shock_pct=${congestionShock}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch forecast: ${response.statusText}`);
        
        const data = await response.json();
        setForecastData(data);
      } catch (err) {
        setForecastError(err.message);
      } finally {
        setIsForecastLoading(false);
      }
    }
    
    // Debounce to prevent spamming API
    const timeoutId = setTimeout(() => {
      loadForecast();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [fuelShock, congestionShock, selectedRoute, cargoVolume]);

  const activeHorizonData = forecastData?.horizons?.[activeHorizon];
  const currentRate = forecastData ? forecastData.current_bdi : 1500;

  // Context to be passed to child routes
  const contextValue = {
    selectedRoute,
    cargoVolume,
    activeModel,
    setActiveModel,
    activeHorizon,
    setActiveHorizon,
    fuelShock,
    setFuelShock,
    congestionShock,
    setCongestionShock,
    forecastData,
    isForecastLoading,
    forecastError,
    destPort,
    activeHorizonData,
    currentRate
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div>
        <RouteSelector 
          scenarios={mockScenarios} 
          selectedRoute={selectedRoute} 
          onSelectRoute={setSelectedRoute} 
          cargoVolume={cargoVolume}
          onSelectCargoVolume={setCargoVolume}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <MarketSummaryBar />
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

// Custom hook for child components to easily consume context
export function useDashboardContext() {
  return useOutletContext();
}
