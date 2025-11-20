// ============================================================================
// CONFIGURAÇÃO CRÍTICA: Importar configuração do Monaco ANTES de tudo
// ============================================================================
// IMPORTANTE: A ordem de importação é CRÍTICA para evitar carregamento infinito!
// 1. Primeiro: Configurar MonacoEnvironment (index.html já fez isso)
// 2. Segundo: Configurar o loader ANTES de importar o Editor
// 3. Terceiro: Importar o Editor DEPOIS da configuração
// ============================================================================

// 1. Configurar MonacoEnvironment (se ainda não configurado)
import './config/monaco';

// 2. Configurar o loader ANTES de importar o Editor
// CRÍTICO: Isso DEVE ser executado ANTES do Editor ser importado
import './utils/monaco-config';

// 3. AGORA podemos importar o Editor com segurança
import React, { useState, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import ConsolePanel from './components/ConsolePanel';
import CanvasEngine from './utils/canvasEngine';
import { parseZPL, parseEPL, parseTSPL, parseCPCL, parseCustom } from './utils/parsers';
import MonacoEditor from './components/MonacoEditor';
import ResizablePreview from './components/ResizablePreview';

// Verificar se o loader.js está acessível ANTES de usar o Editor
if (typeof window !== 'undefined') {
  fetch(window.location.origin + '/monaco/vs/loader.js')
    .then(response => {
      if (response.ok) {
        console.log('[Monaco] ✅ loader.js acessível via HTTP');
        
        // Tentar verificar se o loader está realmente sendo carregado
        response.text().then(text => {
          if (text.includes('AMDLoader') || text.includes('define')) {
            console.log('[Monaco] ✅ loader.js contém código do Monaco (AMD loader)');
          } else {
            console.warn('[Monaco] ⚠️ loader.js não parece conter código do Monaco');
          }
        });
      } else {
        console.error('[Monaco] ❌ loader.js NÃO acessível - Status:', response.status);
      }
    })
    .catch(error => {
      console.error('[Monaco] ❌ ERRO ao verificar loader.js:', error);
    });
  
  // NÃO inicializar Monaco manualmente - o loader do Monaco já cuida disso
  // Inicializar manualmente pode causar conflitos e impedir o componente de funcionar
  console.log('[Monaco] ✅ Configuração completa - aguardando componente Editor inicializar...');
  console.log('[Monaco] MonacoEnvironment verificado:', {
    getUrl: typeof window.MonacoEnvironment.getUrl,
    getWorkerUrl: typeof window.MonacoEnvironment.getWorkerUrl,
    createTrustedTypesPolicy: typeof window.MonacoEnvironment.createTrustedTypesPolicy
  });
}

function getDefaultCode(lang) {
    const defaults = {
      zpl: `^XA
^FO50,50^A0N,30,30^FDHello World^FS
^FO50,100^BCN,50,Y,N,N^FD1234567890^FS
^XZ`,
      epl: `N
A50,40,0,3,1,1,N,"Hello World"
B10,10,0,3,100,1,1,"1234567890"
P1`,
      tspl: `SIZE 100 mm, 50 mm
TEXT 20,40,"3",0,1,1,"Hello World"
BARCODE 20,100,"128",50,1,0,2,2,"1234567890"
PRINT 1`,
      cpcl: `! 0 200 200 500 1
TEXT 4 0 50 50 "Hello World"
BARCODE 128 1 1 50 0 50 "1234567890"
PRINT`,
      custom: `Texto personalizado
Linha 1
Linha 2`
    };
  return defaults[lang] || defaults.zpl;
}

function App() {
  const [code, setCode] = useState(() => getDefaultCode('zpl'));
  const [language, setLanguage] = useState('zpl');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [parsedData, setParsedData] = useState({ objects: [], errors: [], labelWidth: 100, labelHeight: 50 });
  const canvasRef = useRef(null);

  async function renderCanvas(data) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // O CanvasEngine renderiza o canvas com dimensões precisas baseadas no tamanho da etiqueta
    // O ResizablePreview controla o tamanho visual do container
    const engine = new CanvasEngine(canvas, {
      zoom: zoom,
      showGrid: showGrid,
      dpi: 203 // DPI da impressora térmica típica
    });

    await engine.render(data.objects, data.labelWidth, data.labelHeight);
  }

  // Parse automático quando código ou linguagem muda
  useEffect(() => {
    function parseCode() {
      let result;
      switch (language.toLowerCase()) {
        case 'zpl':
          result = parseZPL(code);
          break;
        case 'epl':
          result = parseEPL(code);
          break;
        case 'tspl':
          result = parseTSPL(code);
          break;
        case 'cpcl':
          result = parseCPCL(code);
          break;
        case 'custom':
          result = parseCustom(code);
          break;
        default:
          result = { objects: [], errors: [], labelWidth: 100, labelHeight: 50 };
      }
      
      setParsedData(result);
    }

    parseCode();
  }, [code, language]);

  // Re-renderizar quando dados parseados mudarem ou zoom/grid mudar
  useEffect(() => {
    if (canvasRef.current && parsedData.objects) {
      renderCanvas(parsedData);
    }
  }, [parsedData, zoom, showGrid]);


  function handleLanguageChange(newLanguage) {
    setLanguage(newLanguage);
    setCode(getDefaultCode(newLanguage));
  }

  function handleCodeChange(value) {
    setCode(value || '');
  }

  function handleZoomChange(newZoom) {
    setZoom(newZoom);
  }

  function handleGridToggle() {
    setShowGrid(!showGrid);
  }

  async function handleExportPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `etiqueta_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function handleExportPDF() {
    const { jsPDF } = await import('jspdf');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm'
    });

    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`etiqueta_${Date.now()}.pdf`);
  }

  function handleExportCode() {
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `etiqueta_${language}_${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  }


  return (
    <div className="flex flex-col h-screen bg-editor-bg text-editor-text">
      {/* Toolbar */}
      <Toolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        showGrid={showGrid}
        onGridToggle={handleGridToggle}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportCode={handleExportCode}
      />

      {/* Área principal: Editor e Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor (esquerda) */}
        <div className="w-1/2 border-r border-gray-700">
          <MonacoEditor
            value={code}
            language={language}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              fontFamily: 'Consolas, "Courier New", monospace'
            }}
          />
        </div>

        {/* Preview (direita) */}
        <div className="w-1/2 bg-gray-800 p-4 overflow-auto flex items-center justify-center">
          <ResizablePreview
            defaultWidth={parsedData.labelWidth}
            defaultHeight={parsedData.labelHeight}
            minWidth={100}
            minHeight={50}
            className="bg-gray-100 p-4 rounded shadow-lg"
          >
            <canvas
              ref={canvasRef}
              className="border border-gray-300"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </ResizablePreview>
        </div>
      </div>

      {/* Console de erros (inferior) */}
      <ConsolePanel errors={parsedData.errors} />
    </div>
  );
}

export default App;

