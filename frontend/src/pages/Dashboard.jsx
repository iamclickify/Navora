import { useState, useEffect } from 'react';
import RouteSelector from '../components/RouteSelector';
import PortConstraints from '../components/PortConstraints';
import MarketTrendsChart from '../components/MarketTrendsChart';
import WeatherChart from '../components/WeatherChart';

import { mockScenarios } from '../data/mockData';
import { fetchPortConstraints } from '../api/mockApi';
import { marketTrends, weatherData } from '../data/importedData';

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState(Object.keys(mockScenarios)[0]);
  const [selectedCommodity, setSelectedCommodity] = useState(mockScenarios[Object.keys(mockScenarios)[0]].validCommodities[0]);

  // When route changes, reset commodity if the current one isn't valid for the new route
  useEffect(() => {
    const validComms = mockScenarios[selectedRoute].validCommodities;
    if (!validComms.includes(selectedCommodity)) {
      setSelectedCommodity(validComms[0]);
    }
  }, [selectedRoute, selectedCommodity]);

  // API Data States
  const [portConstraints, setPortConstraints] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const scenario = mockScenarios[selectedRoute];
  const destPort = scenario.routeInfo.destination;

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      setIsDataLoading(true);
      try {
        const constraintsData = await fetchPortConstraints(destPort);

        if (isMounted) {
          setPortConstraints(constraintsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedRoute, destPort]);

  // Get port-specific weather data
  const portWeather = weatherData[destPort] || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation / Route Selector */}
      <RouteSelector 
        scenarios={mockScenarios} 
        selectedRoute={selectedRoute} 
        onSelectRoute={setSelectedRoute} 
        selectedCommodity={selectedCommodity}
        onSelectCommodity={setSelectedCommodity}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Top Row: Market Trends (Full Width) */}
        <div className="h-[400px]">
          <MarketTrendsChart data={marketTrends} />
        </div>

        {/* Middle Row: Weather & Port Constraints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[350px]">
            <WeatherChart data={portWeather} portName={destPort} />
          </div>
          <div className="flex flex-col">
            <PortConstraints 
              portName={destPort} 
              constraints={portConstraints} 
              isLoading={isDataLoading} 
            />
          </div>
        </div>

      </main>
    </div>
  );
}
