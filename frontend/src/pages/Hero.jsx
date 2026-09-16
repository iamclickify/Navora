import { useNavigate } from 'react-router-dom';
import { Ship, LineChart, Globe, ArrowRight, ShieldCheck, Zap, AlertTriangle, TrendingDown } from 'lucide-react';
import cargoIllustration from '../assets/premium_vector-1722588427618-85e923eb7d97.avif';
import heroImg from '../assets/Navora_logo_transparent.png';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      
      {/* Navbar */}
      <header className="w-full border-b border-blue-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={heroImg} alt="Navora Logo" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-2xl tracking-tight text-blue-900">Navora</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#problem" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">The Problem</a>
            <a href="#solution" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Our Solution</a>
            <a href="#impact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Impact</a>
          </nav>
          
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-grow">
        {/* Top Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            
            
            <h1 className="text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Navora
            </h1>
            
            <p className="text-2xl font-semibold text-blue-600">
              Intelligent Freight Forecasting & Vessel Optimization
            </p>
            
            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              A platform that helps companies make better shipping and cargo booking decisions. Navigate the complexities of maritime trade with technological insights.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center space-x-2"
              >
                <span>Enter Dashboard</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative">
            {/* Decorative background blob */}
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 transform scale-110 -translate-x-10 translate-y-10"></div>
            
            {/* Illustration */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <img 
                src={cargoIllustration} 
                alt="AI-Driven Cargo Shipping" 
                className="w-full h-auto object-cover"
              />
              {/* Overlay styling to make it feel integrated */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </div>
          </div>

        </div>

        {/* Problem & Solution Section */}
        <div id="problem" className="bg-slate-50 py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">What's Broken Today?</h2>
              <p className="text-slate-600 mt-4">Current maritime logistics suffer from massive inefficiencies.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <AlertTriangle size={24} className="text-red-500 mb-4" />
                <h4 className="font-semibold text-lg mb-2">Reactive Decisions</h4>
                <p className="text-slate-600 text-sm">Companies currently rely on outdated or reactive freight decisions instead of proactively anticipating market trends and pricing shifts.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <AlertTriangle size={24} className="text-red-500 mb-4" />
                <h4 className="font-semibold text-lg mb-2">Fragmented Selection</h4>
                <p className="text-slate-600 text-sm">Vessel selection is heavily fragmented across multiple siloed systems, causing massive delays in procurement and planning.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <AlertTriangle size={24} className="text-red-500 mb-4" />
                <h4 className="font-semibold text-lg mb-2">Isolated Voyages</h4>
                <p className="text-slate-600 text-sm">Voyages are optimized in isolation rather than continuously, resulting in significant time being spent idle.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <AlertTriangle size={24} className="text-red-500 mb-4" />
                <h4 className="font-semibold text-lg mb-2">Unquantified Risks</h4>
                <p className="text-slate-600 text-sm">"What-if" risks such as sudden fuel price changes, severe weather conditions, and port delays are extremely hard to accurately quantify.</p>
              </div>
            </div>

            <div id="solution" className="text-center mb-16 pt-10">
              <h2 className="text-3xl font-bold text-slate-900">Our Solution</h2>
              <p className="text-slate-600 mt-4">
                The core intelligence layer backed by machine learning algorithms like{' '}
                <a href="https://facebook.github.io/prophet/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Prophet</a>
                {' '}and{' '}
                <a href="https://xgboost.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">XGBoost</a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <LineChart size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Freight Cost Forecasts</h3>
                <p className="text-slate-600 leading-relaxed">
                  Processes multiple data sources like freight, fuel, commodity, port, weather, and vessels to accurately predict future costs for upcoming days and weeks.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <Ship size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Vessel & Voyage Optimization</h3>
                <p className="text-slate-600 leading-relaxed">
                  Employs constraint filtering based on cargo quantity and port conditions. Uses dynamic multi-leg cost calculations to reduce vessel turnaround time.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <Globe size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Compare & Mitigate Risks</h3>
                <p className="text-slate-600 leading-relaxed">
                  Empowers users with scenario analysis tools. Seamlessly evaluate "what-if" situations including fuel shocks, severe weather events, port congestion, and strict delivery deadlines before committing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact & Benefits Section */}
        <div id="impact" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Impact & Benefits</h2>
            <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
              Addressing a massive scale of opportunity in the maritime industry. By targeting idle time and inefficiencies, Navora delivers industry-wide viability.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-4">
                  <TrendingDown size={32} />
                </div>
                <h4 className="font-semibold text-slate-900">Lower Costs</h4>
                <p className="text-sm text-slate-500 mt-2">Better vessel and booking decisions</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-4">
                  <TrendingDown size={32} />
                </div>
                <h4 className="font-semibold text-slate-900">Reduced Risk</h4>
                <p className="text-sm text-slate-500 mt-2">Evaluate congestion & fuel impact</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
                  <Zap size={32} />
                </div>
                <h4 className="font-semibold text-slate-900">Faster Planning</h4>
                <p className="text-sm text-slate-500 mt-2">Reduce manual analysis effort</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
                  <Globe size={32} />
                </div>
                <h4 className="font-semibold text-slate-900">Highly Scalable</h4>
                <p className="text-sm text-slate-500 mt-2">Across ports, routes & commodities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Audience Section */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 py-20 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Who Can Use Navora?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Bulk Cargo Procurers</h4>
                <p className="text-slate-600 leading-relaxed">Ensure optimal freight procurement windows to drastically reduce shipping overheads for large commodity volumes.</p>
              </div>
              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Vessel Charterers</h4>
                <p className="text-slate-600 leading-relaxed">Quickly filter and rank fleets based on physical port constraints and dynamic availability across global routes.</p>
              </div>
              <div className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <h4 className="text-xl font-bold text-blue-900 mb-4">Logistics Operators</h4>
                <p className="text-slate-600 leading-relaxed">Model complex "what-if" scenarios to instantly assess the downstream financial impact of delays and fuel shocks.</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-md space-y-6">
            <div className="flex items-center space-x-2 text-white">
              <img src={heroImg} alt="Navora Logo" className="h-8 w-auto object-contain" />
              <span className="font-extrabold text-2xl tracking-tight">Navora</span>
            </div>
            <p className="text-base leading-relaxed text-slate-400">
              Brought to you by team <strong className="text-white">RouteX</strong>. Building the future of maritime logistics with technology.
            </p>
          </div>
          
          <div className="md:text-right">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-base">Our Team</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-base font-medium text-slate-300 md:text-left">
              <li><a href="https://www.linkedin.com/in/shubham-teredesai/" className="hover:text-white hover:underline transition-all">Shubham Teredesai</a></li>
              <li><a href="https://www.linkedin.com/in/utkarsh-v-1467883a5/" className="hover:text-white hover:underline transition-all">Utkarsh Varangaonkar</a></li>
              <li><a href="https://www.linkedin.com/in/urmil-mahajan-15006739b/" className="hover:text-white hover:underline transition-all">Urmil Mahajan</a></li>
              <li><a href="https://www.linkedin.com/in/sai-ware-5278a1384/" className="hover:text-white hover:underline transition-all">Sai Ware</a></li>
              <li><a href="https://www.linkedin.com/in/himanshu-patil-5b2933373/" className="hover:text-white hover:underline transition-all">Himanshu Patil</a></li>
              <li><a href="https://www.linkedin.com/in/rupesh-sadul-857255381/" className="hover:text-white hover:underline transition-all">Rupesh Sadul</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm text-center flex flex-col space-y-2">
          <span className="text-slate-500">&copy; {new Date().getFullYear()} Navora. All rights reserved. Problem Statement SIH26006.</span>
        </div>
      </footer>

    </div>
  );
}
