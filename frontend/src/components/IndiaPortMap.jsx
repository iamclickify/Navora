import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import WeatherRiskBadge from './WeatherRiskBadge';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function IndiaPortMap({ selectedPort }) {
  const [portsData, setPortsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAllPorts() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/weather-forecast/all`);
        if (res.ok) {
          const data = await res.json();
          setPortsData(data.ports || []);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllPorts();
  }, []);

  const centerPosition = [19.0, 85.0]; // General East India Bay of Bengal focus

  const getRiskColor = (risk) => {
    if (risk === "High") return "#ef4444"; // red-500
    if (risk === "Medium") return "#eab308"; // yellow-500
    return "#22c55e"; // green-500
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col relative z-0">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-slate-800">India Port Map</h3>
        <p className="text-sm text-slate-500">Live weather risk & forecasting</p>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-slate-200 min-h-[300px]">
        {isLoading ? (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center animate-pulse">
            <span className="text-slate-400">Loading map data...</span>
          </div>
        ) : (
          <MapContainer center={centerPosition} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {portsData.map((portData) => {
              const today = portData.forecast?.[0];
              const risk = today?.risk || "Low";
              const isSelected = portData.port === selectedPort;
              
              return (
                <CircleMarker
                  key={portData.port}
                  center={[portData.lat, portData.lon]}
                  radius={isSelected ? 10 : 7}
                  pathOptions={{
                    fillColor: getRiskColor(risk),
                    fillOpacity: 0.8,
                    color: isSelected ? "#000" : "#fff",
                    weight: isSelected ? 2 : 1,
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[150px]">
                      <h4 className="font-bold text-sm mb-1">{portData.port}</h4>
                      {today ? (
                        <>
                           <div className="mb-2"><WeatherRiskBadge riskLevel={risk} /></div>
                           <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                             <div>🌡 {today.temp_max}°</div>
                             <div>💨 {today.wind} km/h</div>
                             <div>🌧 {today.rain} mm</div>
                             {today.wave !== null && <div>🌊 {today.wave}m</div>}
                           </div>
                           <p className="text-xs text-slate-500 italic mt-1 border-t pt-1 text-center">
                             {today.weather_label} {today.weather_icon}
                           </p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">No forecast data</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
