import { CloudLightning, CloudRain, Sun } from 'lucide-react';

export default function WeatherRiskBadge({ riskLevel }) {
  if (!riskLevel) return null;

  const config = {
    High: {
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <CloudLightning size={14} className="mr-1.5" />,
      text: "High Weather Risk"
    },
    Medium: {
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <CloudRain size={14} className="mr-1.5" />,
      text: "Medium Weather Risk"
    },
    Low: {
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: <Sun size={14} className="mr-1.5" />,
      text: "Low Weather Risk"
    }
  };

  const conf = config[riskLevel] || config.Low;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${conf.color}`}>
      {conf.icon}
      {conf.text}
    </div>
  );
}
