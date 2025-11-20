import React, { useState } from 'react';

function ConsolePanel({ errors }) {
  const [isExpanded, setIsExpanded] = useState(errors.length > 0);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border-t border-gray-700">
      <div 
        className="px-4 py-2 bg-gray-800 cursor-pointer hover:bg-gray-750 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-red-400">⚠</span>
          <span className="text-sm text-gray-300">
            {errors.length} {errors.length === 1 ? 'erro encontrado' : 'erros encontrados'}
          </span>
        </div>
        <span className="text-gray-500 text-sm">
          {isExpanded ? '▼' : '▲'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto p-4">
          {errors.map((error, index) => (
            <div key={index} className="mb-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-400">●</span>
                <div className="flex-1">
                  <span className="text-yellow-400">Linha {error.line}:</span>
                  <span className="text-red-300 ml-2">{error.message}</span>
                  {error.content && (
                    <div className="text-gray-400 mt-1 font-mono text-xs ml-6">
                      {error.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConsolePanel;

