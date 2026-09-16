import { useDashboardContext } from './DashboardLayout';
import ModelAccuracyPanel from '../components/ModelAccuracyPanel';
import RecommendationCard from '../components/RecommendationCard';
import MultiHorizonPanel from '../components/MultiHorizonPanel';
import ModelToggle from '../components/ModelToggle';
import HorizonSelector from '../components/HorizonSelector';
import ForecastChart from '../components/ForecastChart';
import FeatureImportanceChart from '../components/FeatureImportanceChart';
import SensitivityPanel from '../components/SensitivityPanel';

export default function MarketAnalysisPage() {
  const {
    forecastData,
    isForecastLoading,
    forecastError,
    activeHorizonData,
    currentRate,
    cargoVolume,
    activeHorizon,
    setActiveHorizon,
    activeModel,
    setActiveModel,
    fuelShock,
    setFuelShock,
    congestionShock,
    setCongestionShock
  } = useDashboardContext();

  return (
    <div className="space-y-8">
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
            factors={forecastData.factor_drivers}
            activeHorizon={activeHorizon}
            weatherRisk={forecastData.weather_risk}
            cargoVolume={cargoVolume}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
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
    </div>
  );
}
