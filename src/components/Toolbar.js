import React from 'react';

function Toolbar({ 
  language, 
  onLanguageChange, 
  zoom, 
  onZoomChange, 
  showGrid, 
  onGridToggle,
  onExportPNG,
  onExportPDF,
  onExportCode
}) {
  const languages = [
    { value: 'zpl', label: 'ZPL' },
    { value: 'epl', label: 'EPL' },
    { value: 'tspl', label: 'TSPL' },
    { value: 'cpcl', label: 'CPCL' },
    { value: 'custom', label: 'Custom' }
  ];

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
      {/* Seletor de Linguagem */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Linguagem:</label>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Zoom:</label>
        <select
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          {zoomLevels.map(level => (
            <option key={level} value={level}>{Math.round(level * 100)}%</option>
          ))}
        </select>
      </div>

      {/* Toggle Grid */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Grid:</label>
        <button
          onClick={onGridToggle}
          className={`px-3 py-1 rounded border ${
            showGrid 
              ? 'bg-blue-600 border-blue-500 text-white' 
              : 'bg-gray-700 border-gray-600 text-gray-300'
          } hover:bg-blue-700 focus:outline-none`}
        >
          {showGrid ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex-1" />

      {/* Botões de Exportação */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportPNG}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded border border-green-500 focus:outline-none"
        >
          Exportar PNG
        </button>
        <button
          onClick={onExportPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded border border-red-500 focus:outline-none"
        >
          Exportar PDF
        </button>
        <button
          onClick={onExportCode}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded border border-blue-500 focus:outline-none"
        >
          Salvar Código
        </button>
      </div>
    </div>
  );
}

export default Toolbar;

