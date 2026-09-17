import React, { useState } from 'react';
import { Share2, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ShareAnalysisButton({ 
  forecastData, 
  selectedRoute, 
  cargoVolume, 
  activeHorizon,
  fuelShock,
  congestionShock
}) {
  const [isOpen, setIsOpen] = useState(false);

  const exportCSV = () => {
    if (!forecastData || !forecastData.historical || !forecastData.model_predictions) return;

    // Create CSV content
    const headers = ['Date', 'Historical Rate (USD/ton)', 'Predicted Rate (USD/ton)'];
    const rows = [];

    // Historical data
    forecastData.historical.forEach(row => {
      rows.push([row.date, row.freight_rate, '']);
    });

    // Predictions
    const predictions = forecastData.model_predictions.ensemble || [];
    predictions.forEach(row => {
      rows.push([row.date, '', row.predicted_rate]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Navora_Analysis_${selectedRoute.replace(/[^a-zA-Z0-9]/g, '_')}_H${activeHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const exportPDF = () => {
    if (!forecastData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Navora Market Analysis Report", 14, 22);
    
    // Config details
    doc.setFontSize(12);
    doc.text(`Port Route: ${selectedRoute}`, 14, 32);
    doc.text(`Cargo Volume: ${cargoVolume.toLocaleString()} tons`, 14, 38);
    doc.text(`Forecast Horizon: ${activeHorizon} Days`, 14, 44);
    doc.text(`Fuel Price Shock: ${fuelShock}%`, 14, 50);
    doc.text(`Congestion Shock: ${congestionShock}%`, 14, 56);

    // AI Recommendation
    doc.setFontSize(14);
    doc.text("AI Recommendation", 14, 70);
    doc.setFontSize(10);
    
    const splitRationale = doc.splitTextToSize(forecastData.rationale || '', 180);
    let actionText = forecastData.recommendation || '';
    if (actionText.toLowerCase() === 'hold') {
        actionText = 'Hold / Monitor';
    }
    doc.text(`Action: ${actionText}`, 14, 76);
    doc.text(splitRationale, 14, 82);
    
    let yPos = 82 + (splitRationale.length * 5) + 5;
    if (forecastData.expected_savings) {
       doc.text(`Expected Savings: $${forecastData.expected_savings.toLocaleString()}`, 14, yPos);
       yPos += 10;
    }

    // Table of predictions
    if (forecastData.model_predictions && forecastData.model_predictions.ensemble) {
        const tableData = forecastData.model_predictions.ensemble.map(p => [
            p.date,
            `$${p.predicted_rate.toLocaleString()}`
        ]);
        
        doc.autoTable({
            startY: yPos + 5,
            head: [['Date', 'Predicted Rate (USD/ton)']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138] } // Tailwind blue-900
        });
    }

    doc.save(`Navora_Analysis_${selectedRoute.replace(/[^a-zA-Z0-9]/g, '_')}_H${activeHorizon}.pdf`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-colors"
      >
        <Share2 className="w-5 h-5" />
        Share Analysis
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
          <button 
            onClick={exportPDF}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors border-b border-slate-100"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            Export as PDF
          </button>
          <button 
            onClick={exportCSV}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}
