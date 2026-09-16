import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Hero from './pages/Hero'
import DashboardLayout from './pages/DashboardLayout'
import MarketAnalysisPage from './pages/MarketAnalysisPage'
import WeatherPage from './pages/WeatherPage'
import PortOptimizationPage from './pages/PortOptimizationPage'
import HistoricPage from './pages/HistoricPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default dashboard route redirects to market analysis */}
          <Route index element={<Navigate to="market" replace />} />
          <Route path="market" element={<MarketAnalysisPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="ports" element={<PortOptimizationPage />} />
          <Route path="history" element={<HistoricPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
