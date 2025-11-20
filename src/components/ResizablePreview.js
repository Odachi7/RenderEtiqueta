import React, { useRef, useEffect, useState } from 'react';

/**
 * Componente de Preview Redimensionável
 * Permite redimensionar a área de preview manualmente
 * Por padrão, usa o tamanho exato da etiqueta
 */
function ResizablePreview({ 
  children, 
  defaultWidth, 
  defaultHeight, 
  minWidth = 200, 
  minHeight = 200,
  className = ''
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(null); // null = usar tamanho da etiqueta
  const [height, setHeight] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

  // Inicializar com tamanho da etiqueta se disponível
  useEffect(() => {
    if (defaultWidth && defaultHeight && width === null && height === null) {
      // Converter de mm para px (assumindo 96 DPI para o container)
      const mmToPx = 96 / 25.4;
      const w = defaultWidth * mmToPx;
      const h = defaultHeight * mmToPx;
      setWidth(w);
      setHeight(h);
    }
  }, [defaultWidth, defaultHeight, width, height]);

  // Atualizar tamanho quando defaultWidth/defaultHeight mudarem (apenas se nunca foi redimensionado)
  // Se o usuário já redimensionou manualmente, manter o tamanho escolhido
  useEffect(() => {
    if (defaultWidth && defaultHeight && width === null && height === null) {
      const mmToPx = 96 / 25.4;
      const newWidth = defaultWidth * mmToPx;
      const newHeight = defaultHeight * mmToPx;
      setWidth(newWidth);
      setHeight(newHeight);
    }
  }, [defaultWidth, defaultHeight, width, height]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    const rect = containerRef.current.getBoundingClientRect();
    setStartWidth(rect.width);
    setStartHeight(rect.height);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = Math.max(minWidth, startWidth + deltaX);
      const newHeight = Math.max(minHeight, startHeight + deltaY);

      setWidth(newWidth);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, startX, startY, startWidth, startHeight, minWidth, minHeight]);

  // Calcular tamanho final
  const finalWidth = width || (defaultWidth ? defaultWidth * (96 / 25.4) : '100%');
  const finalHeight = height || (defaultHeight ? defaultHeight * (96 / 25.4) : '100%');

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        transition: isResizing ? 'none' : 'width 0.2s, height 0.2s'
      }}
    >
      {children}
      
      {/* Handle de redimensionamento */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(-45deg, transparent 30%, #3b82f6 30%, #3b82f6 35%, transparent 35%, transparent 65%, #3b82f6 65%, #3b82f6 70%, transparent 70%)',
          cursor: isResizing ? 'se-resize' : 'se-resize'
        }}
        title="Arraste para redimensionar"
      />
    </div>
  );
}

export default ResizablePreview;

