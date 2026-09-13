import { useState, useEffect } from 'react';
import RouteSelector from '../components/RouteSelector';
import PortConstraints from '../components/PortConstraints';
import MarketTrendsChart from '../components/MarketTrendsChart';
import WeatherChart from '../components/WeatherChart';

import ForecastChart from '../components/ForecastChart';
import RecommendationCard from '../components/RecommendationCard';
import ModelToggle from '../components/ModelToggle';
import ModelAccuracyPanel from '../components/ModelAccuracyPanel';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import SensitivityPanel from '../components/SensitivityPanel';
import HistoricalRatesExplorer from '../components/HistoricalRatesExplorer';
import VesselTable from '../components/VesselTable';
import VoyageTimeline from '../components/VoyageTimeline';

import { mockScenarios } from '../data/mockData';
import { marketTrends, weatherData } from '../data/importedData';

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState(Object.keys(mockScenarios)[0]);
  const [selectedCommodity, setSelectedCommodity] = useState(mockScenarios[Object.keys(mockScenarios)[0]].validCommodities[0]);
  
  const [activeModel, setActiveModel] = useState('ensemble');

  // Sensitivity State
  const [fuelShock, setFuelShock] = useState(0);
  const [congestionShock, setCongestionShock] = useState(0);

  // API States
  const [forecastData, setForecastData] = useState(null);
  const [isForecastLoading, setIsForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

  const [portConstraints, setPortConstraints] = useState(null);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState(true);

  const scenario = mockScenarios[selectedRoute];
  const destPort = scenario.routeInfo.destination;
  const cargoVolume = scenario.volumes[selectedCommodity] || 50000;
  const portWeather = weatherData[destPort] || [];

  // When route changes, reset commodity if the current one isn't valid for the new route
  useEffect(() => {
    const validComms = mockScenarios[selectedRoute].validCommodities;
    if (!validComms.includes(selectedCommodity)) {
      setSelectedCommodity(validComms[0]);
    }
  }, [selectedRoute, selectedCommodity]);

  // Load Port Constraints
  useEffect(() => {
    async function loadConstraints() {
      setIsConstraintsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/port-constraints');
        if (!response.ok) throw new Error("Failed to fetch port constraints");
        const data = await response.json();
        const portData = data.ports.find(p => p.port === destPort);
        setPortConstraints(portData || null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsConstraintsLoading(false);
      }
    }
    loadConstraints();
  }, [destPort]);

  // Load Forecast Data (using sensitivity endpoint if shocks applied)
  useEffect(() => {
    async function loadForecast() {
      setIsForecastLoading(true);
      setForecastError(null);
      try {
        let url = 'http://127.0.0.1:8000/api/v1/forecast';
        let body = { horizon: 30 };

        if (fuelShock !== 0 || congestionShock !== 0) {
          url = 'http://127.0.0.1:8000/api/v1/sensitivity-analysis';
          body = {
            base_row: {
              fuel_in_usd: 0,
              congestion_score: 0,
              month: 1,
              dayofweek: 1,
              bdi_lag_1: 0,
              bdi_lag_7: 0,
              bdi_roll_mean_7: 0,
              bdi_roll_std_7: 0
            },
            fuel_shock_pct: fuelShock,
            congestion_shock_pct: congestionShock
          };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`Failed to fetch forecast: ${response.statusText}`);
        
        const data = await response.json();
        setForecastData(data);
      } catch (err) {
        setForecastError(err.message);
      } finally {
        setIsForecastLoading(false);
      }
    }
    
    // Debounce to prevent spamming API while dragging slider
    const timeoutId = setTimeout(() => {
      loadForecast();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [fuelShock, congestionShock]);

  // Derived state for the vessel/voyage optimizers
  const currentRate = forecastData ? forecastData.model_predictions[activeModel][0].rate : 1500;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <RouteSelector 
        scenarios={mockScenarios} 
        selectedRoute={selectedRoute} 
        onSelectRoute={setSelectedRoute} 
        selectedCommodity={selectedCommodity}
        onSelectCommodity={setSelectedCommodity}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Model Accuracy Banner */}
        <ModelAccuracyPanel />

        {/* Forecast & Recommendation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col">
            <ModelToggle activeModel={activeModel} onSelectModel={setActiveModel} />
            <div className="flex-grow h-[400px]">
              {isForecastLoading && !forecastData ? (
                 <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center animate-pulse">
                   <span className="text-slate-500">Generating forecast...</span>
                 </div>
              ) : forecastError ? (
                 <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-red-500">
                   {forecastError}
                 </div>
              ) : (
                <ForecastChart forecastData={forecastData} activeModel={activeModel} />
              )}
            </div>
          </div>
          
          <div className="flex flex-col pt-[52px]">
            {isForecastLoading && !forecastData ? (
                 <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 animate-pulse" />
            ) : forecastError ? (
                 <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200" />
            ) : forecastData ? (
              <RecommendationCard 
                action={forecastData.recommendation} 
                rationale={forecastData.rationale} 
                expectedSavings={forecastData.expected_savings} 
                currentRate={currentRate}
              />
            ) : null}
          </div>
        </div>

        {/* Transparency & Sensitivity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FeatureImportanceChart />
          <SensitivityPanel 
            fuelChange={fuelShock}
            setFuelChange={setFuelShock}
            congestionChange={congestionShock}
            setCongestionChange={setCongestionShock}
          />
        </div>

        {/* Optimization Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VesselTable portName={destPort} cargoVolume={cargoVolume} predictedRate={currentRate} />
          <VoyageTimeline />
        </div>

        {/* Historical Explorer Row */}
        <HistoricalRatesExplorer />

        {/* Original Weather & Port Constraints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[350px]">
            <WeatherChart data={portWeather} portName={destPort} />
          </div>
          <div className="flex flex-col">
            <PortConstraints 
              portName={destPort} 
              constraints={portConstraints} 
              isLoading={isConstraintsLoading} 
            />
          </div>
        </div>

      </main>
    </div>
  );
}
