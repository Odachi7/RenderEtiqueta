import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Componente de Preview com Zoom
 * - Renderiza etiqueta em tamanho real (1:1 com impressão)
 * - Zoom com Ctrl+scroll
 * - Pan com arrastar
 * - Controles de zoom
 */
function ZoomablePreview({ 
  children, 
  labelWidth, 
  labelHeight, 
  className = '',
  language = 'zpl' // Adicionar prop language
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // ✅ Calcular tamanho baseado na linguagem
  const realSizePx = {
    width: language === 'epl' 
      ? labelWidth || 609    // EPL: dots direto
      : labelWidth ? (labelWidth * 203) / 25.4 : 400, // ZPL: mm para px
    height: language === 'epl'
      ? labelHeight || 300   // EPL: dots direto  
      : labelHeight ? (labelHeight * 203) / 25.4 : 200 // ZPL: mm para px
  };


  // Zoom mínimo para caber na tela
  const [minZoom, setMinZoom] = useState(0.1);

  // Calcular zoom mínimo baseado no container
  useEffect(() => {
    if (containerRef.current && labelWidth && labelHeight) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Deixar margem de 40px
      const availableWidth = containerRect.width - 80;
      const availableHeight = containerRect.height - 80;
      
      const zoomX = availableWidth / realSizePx.width;
      const zoomY = availableHeight / realSizePx.height;
      const calculatedMinZoom = Math.min(zoomX, zoomY, 1); // Máximo 1 (tamanho real)
      
      setMinZoom(Math.max(0.1, calculatedMinZoom));
      
      // Se zoom atual é menor que o mínimo, ajustar
      if (zoom < calculatedMinZoom) {
        setZoom(calculatedMinZoom);
      }
    }
  }, [labelWidth, labelHeight, realSizePx.width, realSizePx.height, zoom]);

  // Centralizar conteúdo quando zoom ou tamanho mudar
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      const scaledWidth = realSizePx.width * zoom;
      const scaledHeight = realSizePx.height * zoom;
      
      const centerX = (containerRect.width - scaledWidth) / 2;
      const centerY = (containerRect.height - scaledHeight) / 2;
      
      setPan({ x: centerX, y: centerY });
    }
  }, [zoom, realSizePx.width, realSizePx.height]);

  // Controle de zoom com Ctrl+scroll
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(minZoom, Math.min(5, zoom * delta));
      
      if (newZoom !== zoom) {
        // Zoom centrado no cursor
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calcular nova posição do pan para manter o ponto sob o cursor
        const scaleFactor = newZoom / zoom;
        const newPanX = mouseX - (mouseX - pan.x) * scaleFactor;
        const newPanY = mouseY - (mouseY - pan.y) * scaleFactor;
        
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    }
  }, [zoom, minZoom, pan]);

  // Pan com arrastar
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Botão esquerdo
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // Funções de controle de zoom
  const zoomIn = () => setZoom(prev => Math.min(5, prev * 1.2));
  const zoomOut = () => setZoom(prev => Math.max(minZoom, prev / 1.2));
  const zoomToFit = () => setZoom(minZoom);
  const zoomToReal = () => setZoom(1);

  return (
    <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg p-2 shadow-lg">
        <div className="flex flex-col gap-2">
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            title="Zoom In (+)"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            title="Zoom Out (-)"
          >
            -
          </button>
          <button
            onClick={zoomToFit}
            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
            title="Ajustar à tela"
          >
            Fit
          </button>
          <button
            onClick={zoomToReal}
            className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
            title="Tamanho real (1:1)"
          >
            1:1
          </button>
        </div>
        <div className="text-white text-xs mt-2 text-center">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Informações da etiqueta */}
      <div className="absolute top-4 left-4 z-10 bg-gray-800 text-white rounded-lg p-2 shadow-lg text-sm">
        {language === 'epl' ? (
          <div>Tamanho: {labelWidth || 609}×{labelHeight || 300} dots</div>
        ) : (
          <div>Tamanho: {labelWidth?.toFixed(2) || '0.00'}×{labelHeight?.toFixed(2) || '0.00'}mm</div>
        )}
        <div>Real: {Math.round(realSizePx.width)}×{Math.round(realSizePx.height)}px</div>
        <div className="text-xs text-gray-300 mt-1">Ctrl+scroll para zoom</div>
        <div className="text-xs text-red-300 mt-1">Borda vermelha = limite exato</div>
      </div>

      {/* Área de conteúdo - exatamente o tamanho da etiqueta */}
      <div
        ref={contentRef}
        className="absolute border-2 border-red-500 border-dashed"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: `${realSizePx.width}px`,
          height: `${realSizePx.height}px`,
          cursor: isPanning ? 'grabbing' : 'grab',
          backgroundColor: 'rgba(255, 255, 255, 0.1)' // Fundo sutil para visualizar limites
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Indicadores de canto para mostrar limites exatos */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>
        
        {/* Grid de referência em mm */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,0,0,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,0,0,0.2) 1px, transparent 1px)
            `,
            backgroundSize: `${(203/25.4)*5}px ${(203/25.4)*5}px`, // Grid de 5mm
            opacity: zoom > 0.5 ? 0.3 : 0 // Só mostrar quando zoom > 50%
          }}
        />
        
        {/* Conteúdo da etiqueta */}
        <div className="w-full h-full relative" style={{ position: 'relative' }}>
          {children}
        </div>
      </div>

      {/* Grid de fundo */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #666 1px, transparent 1px),
            linear-gradient(to bottom, #666 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
}

export default ZoomablePreview;
