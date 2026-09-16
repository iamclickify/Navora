import { useDashboardContext } from './DashboardLayout';
import PortOptimizationPanel from '../components/PortOptimizationPanel';
import VesselTable from '../components/VesselTable';

export default function PortOptimizationPage() {
  const { destPort, cargoVolume, currentRate } = useDashboardContext();

  return (
    <div className="space-y-8">
      {/* Port Optimization Panel */}
      <div className="w-full">
        <PortOptimizationPanel portName={destPort} cargoVolume={cargoVolume} />
      </div>

      {/* Optimization Row */}
      <div className="grid grid-cols-1 gap-8">
        <VesselTable portName={destPort} cargoVolume={cargoVolume} predictedRate={currentRate} />
      </div>
    </div>
  );
}
