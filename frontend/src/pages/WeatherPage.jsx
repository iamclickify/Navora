import { useDashboardContext } from './DashboardLayout';
import WeatherForecastPanel from '../components/WeatherForecastPanel';
import IndiaPortMap from '../components/IndiaPortMap';

export default function WeatherPage() {
  const { destPort } = useDashboardContext();

  return (
    <div className="space-y-8">
      {/* Weather Trends & Port Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[450px]">
          <WeatherForecastPanel portName={destPort} />
        </div>
        <div className="h-[450px]">
          <IndiaPortMap selectedPort={destPort} />
        </div>
      </div>
    </div>
  );
}
