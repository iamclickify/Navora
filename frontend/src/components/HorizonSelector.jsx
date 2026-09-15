export default function HorizonSelector({ activeHorizon, onSelectHorizon }) {
  const horizons = [
    { id: '7', label: '7 Days' },
    { id: '15', label: '15 Days' },
    { id: '30', label: '30 Days' },
    { id: '60', label: '60 Days' },
    { id: '90', label: '90 Days' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg w-fit mb-4">
      {horizons.map(h => (
        <button
          key={h.id}
          onClick={() => onSelectHorizon(h.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            activeHorizon === h.id
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}
