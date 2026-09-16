import { useState, useEffect } from 'react';
import { useDashboardContext } from './DashboardLayout';
import RecommendationCard from '../components/RecommendationCard';
import MultiHorizonPanel from '../components/MultiHorizonPanel';
import ModelToggle from '../components/ModelToggle';
import HorizonSelector from '../components/HorizonSelector';
import ForecastChart from '../components/ForecastChart';
import SensitivityPanel from '../components/SensitivityPanel';
import heroImg from '../assets/Navora_logo_transparent.png';

const MARITIME_QUOTES = [
  { text: "The pessimist complains about the wind; the optimist expects it to change; the leader adjusts the sails.", author: "John Maxwell" },
  { text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },
  { text: "He that will not sail till all dangers are past must never put to sea.", author: "Thomas Fuller" },
  { text: "The goal is not to sail the boat, but rather to help the boat sail herself.", author: "John Rousmaniere" },
  { text: "Ships are safe in harbor, but that's not what ships are made for.", author: "William Shedd" },
];

function WelcomeBanner() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const today = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const quote = MARITIME_QUOTES[currentDate.getDay() % MARITIME_QUOTES.length];
  
  return (
    <div className="relative w-full bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl overflow-hidden mb-2 shadow-lg">
      {/* Subtle wave pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q15 10 30 30 Q45 50 60 30' stroke='white' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Logo + greeting */}
        <div className="flex items-center gap-8">
          <img src={heroImg} alt="Navora" className="h-20 w-auto object-contain drop-shadow-lg" />
          <div>
            <p className="text-blue-300 text-base font-bold tracking-widest uppercase mb-1">{today}</p>
            <h1 className="text-white text-5xl font-extrabold tracking-tight mt-0.5">Welcome to NAVORA</h1>
            <p className="text-slate-300 text-lg mt-2 font-medium">Your freight intelligence platform is ready. Scroll down to explore the analysis.</p>
          </div>
        </div>

        {/* Right: Quote */}
        <div className="max-w-sm border-l-2 border-blue-500/40 pl-6 hidden md:block">
          <p className="text-slate-300 text-base italic leading-relaxed font-medium">"{quote.text}"</p>
          <p className="text-blue-400 text-sm font-bold mt-2 tracking-wide">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}



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
      {/* Welcome Banner */}
      <WelcomeBanner />

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

      {/* Forecast Row */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 flex-wrap">
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
      <div className="w-full">
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
