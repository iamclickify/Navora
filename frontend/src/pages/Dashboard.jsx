import { useState, useEffect } from 'react';
import RouteSelector from '../components/RouteSelector';
import MarketSummaryBar from '../components/MarketSummaryBar';
import PortConstraints from '../components/PortConstraints';
import MarketTrendsChart from '../components/MarketTrendsChart';
import WeatherForecastPanel from '../components/WeatherForecastPanel';
import IndiaPortMap from '../components/IndiaPortMap';

import ForecastChart from '../components/ForecastChart';
import RecommendationCard from '../components/RecommendationCard';
import ModelToggle from '../components/ModelToggle';
import ModelAccuracyPanel from '../components/ModelAccuracyPanel';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import SensitivityPanel from '../components/SensitivityPanel';
import HistoricalRatesExplorer from '../components/HistoricalRatesExplorer';
import VesselTable from '../components/VesselTable';
import VoyageTimeline from '../components/VoyageTimeline';
import HorizonSelector from '../components/HorizonSelector';
import MultiHorizonPanel from '../components/MultiHorizonPanel';

import { mockScenarios } from '../data/mockData';
import { marketTrends } from '../data/importedData';

export default function Dashboard() {
  const [selectedRoute, setSelectedRoute] = useState(Object.keys(mockScenarios)[0]);
  const [selectedCommodity, setSelectedCommodity] = useState(mockScenarios[Object.keys(mockScenarios)[0]].validCommodities[0]);
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

  const [portConstraints, setPortConstraints] = useState(null);
  const [isConstraintsLoading, setIsConstraintsLoading] = useState(true);

  const scenario = mockScenarios[selectedRoute];
  const destPort = scenario.routeInfo.destination;


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

  // Load Forecast Data
  useEffect(() => {
    async function loadForecast() {
      setIsForecastLoading(true);
      setForecastError(null);
      try {
        let url = `http://127.0.0.1:8000/api/v1/multi-horizon-forecast?route=${encodeURIComponent(selectedRoute)}&commodity=${encodeURIComponent(selectedCommodity)}`;
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
  }, [fuelShock, congestionShock, selectedRoute, selectedCommodity]);

  const activeHorizonData = forecastData?.horizons?.[activeHorizon];
  const currentRate = forecastData ? forecastData.current_bdi : 1500;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 flex flex-col">
      <div className="sticky top-0 z-50">
        <RouteSelector 
          scenarios={mockScenarios} 
          selectedRoute={selectedRoute} 
          onSelectRoute={setSelectedRoute} 
          selectedCommodity={selectedCommodity}
          onSelectCommodity={setSelectedCommodity}
          cargoVolume={cargoVolume}
          onSelectCargoVolume={setCargoVolume}
        />
        <MarketSummaryBar />
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Model Accuracy Banner */}
        <ModelAccuracyPanel />

        {/* Hero Row: Recommendation */}
        <div className="w-full">
          {isForecastLoading && !forecastData ? (
            <div className="h-64 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center animate-pulse">
              <span className="text-slate-500">Generating forecast...</span>
            </div>
          ) : forecastError ? (
            <div className="h-64 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-red-500">
              {forecastError}
            </div>
          ) : forecastData && activeHorizonData ? (
            <RecommendationCard 
              action={activeHorizonData.recommendation} 
              rationale={activeHorizonData.rationale} 
              expectedSavings={activeHorizonData.expected_savings} 
              currentRate={currentRate}
              route={forecastData.route}
              commodity={forecastData.commodity}
              factors={forecastData.factor_drivers}
              activeHorizon={activeHorizon}
              weatherRisk={forecastData.weather_risk}
            />
          ) : null}
        </div>

        {/* Multi-Horizon Panel */}
        {forecastData && (
          <MultiHorizonPanel 
            horizonsData={forecastData.horizons}
            activeHorizon={activeHorizon}
            onSelectHorizon={setActiveHorizon}
            weatherRisk={forecastData.weather_risk}
          />
        )}

        {/* Forecast Row */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <ModelToggle activeModel={activeModel} onSelectModel={setActiveModel} />
            <HorizonSelector activeHorizon={activeHorizon} onSelectHorizon={setActiveHorizon} />
          </div>
          
          <div className="h-[450px]">
            {isForecastLoading && !forecastData ? (
              <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center animate-pulse">
                <span className="text-slate-500">Loading chart...</span>
              </div>
            ) : forecastError ? (
               <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-red-500">
                 {forecastError}
               </div>
            ) : (
              <ForecastChart forecastData={forecastData} activeModel={activeModel} activeHorizon={activeHorizon} />
            )}
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

        {/* Weather Trends & Port Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[450px]">
            <WeatherForecastPanel portName={destPort} />
          </div>
          <div className="h-[450px]">
            <IndiaPortMap selectedPort={destPort} />
          </div>
        </div>
        
        {/* Port Constraints */}
        <div className="w-full">
          <PortConstraints 
            portName={destPort} 
            constraints={portConstraints} 
            isLoading={isConstraintsLoading} 
          />
        </div>

      </main>
    </div>
  );
}
