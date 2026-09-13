export default function ModelToggle({ activeModel, onSelectModel }) {
  const models = [
    { id: 'ensemble', label: 'Ensemble (Best)' },
    { id: 'xgboost', label: 'XGBoost' },
    { id: 'prophet', label: 'Prophet' }
  ];

  return (
    <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg w-fit mb-4">
      {models.map(model => (
        <button
          key={model.id}
          onClick={() => onSelectModel(model.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            activeModel === model.id
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}
