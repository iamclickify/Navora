import { NavLink } from 'react-router-dom';
import { LineChart, CloudRain, Anchor, History, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: 'Market Analysis', path: '/dashboard/market', icon: LineChart },
    { name: 'Weather', path: '/dashboard/weather', icon: CloudRain },
    { name: 'Port & Vessels', path: '/dashboard/ports', icon: Anchor },
    { name: 'Historical Data', path: '/dashboard/history', icon: History },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-64 bg-slate-900 border-r border-slate-800 p-0 text-slate-300">
        <SheetHeader className="p-4 border-b border-slate-800 text-left">
          <SheetTitle className="text-white font-bold text-lg tracking-tight ml-2">Navigation</SheetTitle>
        </SheetHeader>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
