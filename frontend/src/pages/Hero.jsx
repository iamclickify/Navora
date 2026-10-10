import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Anchor, Ship, ArrowRight, ShieldAlert, CloudLightning, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import heroImg from '../assets/Navora_logo_transparent.png';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Glassmorphism Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={heroImg} alt="Navora Logo" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-2xl tracking-tight text-blue-900">Navora</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Platform</a>
            <a href="#benefits" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Benefits</a>
          </nav>
          <div className="flex items-center">
             <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-500/25 active:scale-95"
              >
                Dashboard
             </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section with Shipping Container Background Image */}
        <section className="relative z-0 w-full min-h-[90vh] flex flex-col items-center justify-center pt-16 pb-24 px-4 overflow-hidden bg-slate-900">
          {/* Background Image & Overlay */}
          <div 
            className="absolute inset-0 w-full h-full object-cover bg-center bg-cover bg-no-repeat -z-20 scale-105 transform"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8ed7c83a56?q=80&w=2070&auto=format&fit=crop")' 
            }}
          />
          <div className="absolute inset-0 bg-slate-900/75 -z-10" />

          {/* Hero Content */}
          <div className="w-full max-w-5xl mx-auto text-center z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-tight mb-6 drop-shadow-lg"
            >
              Predict the <span className="text-blue-400">Market</span>. <br />
              Never Miss a Trend.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium drop-shadow-md"
            >
              Navora analyzes millions of data points to forecast freight rates and optimize routes, so you make proactive decisions before the market shifts.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="flex justify-center mb-8"
            >
               <button
                onClick={() => navigate('/dashboard')}
                className="group px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/40 flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Start Predicting Today</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 md:py-32 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Intelligence at Every Step</h2>
              <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto font-medium">Stop relying on outdated or reactive decisions. Navora transforms fragmented data into precise, actionable strategies.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-14 h-14 shrink-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <LineChart className="text-blue-600" size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Freight Cost Forecasts</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Our ML models process freight, fuel, and commodity data to accurately predict future costs, allowing you to lock in optimal rates.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-14 h-14 shrink-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Ship className="text-blue-600" size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Vessel Optimization</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Dynamic multi-leg cost calculations to drastically reduce vessel turnaround and idle time.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-14 h-14 shrink-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <ShieldAlert className="text-blue-600" size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Mitigate Risks</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Evaluate "what-if" scenarios including fuel shocks and severe weather before committing.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-14 h-14 shrink-0 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Anchor className="text-blue-600" size={28}/>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Port Constraints</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Instantly filter fleets based on physical port constraints and real-time terminal congestion data worldwide.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Measurable Impact</h2>
                <p className="text-lg text-slate-500 font-medium mb-8">
                  By targeting idle time and inefficiencies, Navora delivers industry-wide viability and massive ROI for maritime operations.
                </p>
                
                <div className="space-y-6">
                  {[
                    { title: "Lower Costs", desc: "Better vessel and booking decisions reduce operational overhead." },
                    { title: "Reduced Risk", desc: "Instantly evaluate congestion and fuel impact on profitability." },
                    { title: "Faster Planning", desc: "Reduce manual analysis effort from days to minutes." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <TrendingUp className="text-blue-600" size={18}/>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <p className="text-slate-500 font-medium text-sm mt-1">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative h-96 md:h-[600px] rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-8">
                 {/* Abstract representation of impact */}
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white"></div>
                 <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                    className="w-64 h-64 md:w-96 md:h-96 border-[1px] border-dashed border-blue-200 rounded-full flex items-center justify-center relative z-10"
                 >
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="w-48 h-48 md:w-64 md:h-64 border-[1px] border-dashed border-blue-300 rounded-full flex items-center justify-center"
                    >
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                        <BarChart3 className="text-white" size={48}/>
                      </div>
                    </motion.div>
                 </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-md space-y-6">
            <div className="flex items-center space-x-2 text-white">
              <img src={heroImg} alt="Navora Logo" className="h-8 w-auto object-contain brightness-0 invert" />
              <span className="font-extrabold text-2xl tracking-tight">Navora</span>
            </div>
            <p className="text-base leading-relaxed text-slate-400 font-medium">
              Brought to you by team <strong className="text-white">RouteX</strong>. Building the future of maritime logistics with predictive intelligence.
            </p>
          </div>
          
          <div className="md:text-right">
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Our Team</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-slate-400 md:text-left">
              <li><a href="https://www.linkedin.com/in/shubham-teredesai/" className="hover:text-white hover:underline transition-all">Shubham Teredesai</a></li>
              <li><a href="https://www.linkedin.com/in/utkarsh-v-1467883a5/" className="hover:text-white hover:underline transition-all">Utkarsh Varangaonkar</a></li>
              <li><a href="https://www.linkedin.com/in/urmil-mahajan-15006739b/" className="hover:text-white hover:underline transition-all">Urmil Mahajan</a></li>
              <li><a href="https://www.linkedin.com/in/sai-ware-5278a1384/" className="hover:text-white hover:underline transition-all">Sai Ware</a></li>
              <li><a href="https://www.linkedin.com/in/himanshu-patil-5b2933373/" className="hover:text-white hover:underline transition-all">Himanshu Patil</a></li>
              <li><a href="https://www.linkedin.com/in/siddhi-joshi-3788973a2/" className="hover:text-white hover:underline transition-all">Siddhi Joshi</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm font-medium text-center flex flex-col space-y-2">
          <span className="text-slate-500">&copy; {new Date().getFullYear()} Navora. All rights reserved. Problem Statement SIH26006.</span>
        </div>
      </footer>
    </div>
  );
}
