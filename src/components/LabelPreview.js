import React, { useEffect, useRef } from 'react';

function LabelPreview({ objects, labelWidth, labelHeight, zoom, showGrid }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Este componente será usado se necessário para renderização separada
    // Por enquanto, a renderização é feita diretamente no App.js
  }, [objects, labelWidth, labelHeight, zoom, showGrid]);

  return (
    <div className="w-full h-full bg-gray-100 p-4 overflow-auto flex items-center justify-center">
      <canvas ref={canvasRef} className="border border-gray-300" />
    </div>
  );
}

export default LabelPreview;

