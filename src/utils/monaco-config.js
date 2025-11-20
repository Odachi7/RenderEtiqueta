/**
 * CONFIGURAÇÃO DO MONACO EDITOR - DEVE SER EXECUTADO ANTES DE QUALQUER IMPORTAÇÃO DO EDITOR
 * 
 * Este arquivo configura o loader do Monaco ANTES do componente Editor ser importado.
 * Isso resolve o problema de carregamento infinito causado por importar o Editor
 * antes de configurar o loader.
 */

import loader from '@monaco-editor/loader';

// Configurar o loader ANTES de qualquer componente usar o Editor
if (typeof window !== 'undefined') {
  try {
    var vsPath = '/monaco/vs';
    
    // Em desenvolvimento, usar URL HTTP completa
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      vsPath = window.location.origin + '/monaco/vs';
    }
    
    console.log('[Monaco] [monaco-config.js] Configurando loader com vs:', vsPath);
    console.log('[Monaco] [monaco-config.js] MonacoEnvironment configurado?', !!window.MonacoEnvironment);
    console.log('[Monaco] [monaco-config.js] window.location:', window.location.href);
    
    // CRÍTICO: Configurar preferScriptTags para forçar loader web
    // IMPORTANTE: Desabilitar NLS completamente para evitar erros 404 com arquivos de localização
    // Os arquivos NLS podem não existir ou não terem sido copiados corretamente
    loader.config({
      paths: {
        vs: vsPath
      },
      // FORÇAR uso de script tags em vez de require() do Node.js
      preferScriptTags: true
    });
    
    // Configurar NLS para desabilitar localização e usar apenas inglês embutido
    // Isso evita tentar carregar arquivos NLS que podem não existir
    if (typeof window !== 'undefined' && window.MonacoEnvironment) {
      // Configurar para usar inglês embutido (sem arquivos NLS externos)
      if (!window.MonacoEnvironment.config) {
        window.MonacoEnvironment.config = {};
      }
      window.MonacoEnvironment.config.locale = 'en';
      console.log('[Monaco] [monaco-config.js] ✅ Locale definido para en (sem arquivos NLS externos)');
    }
    
    console.log('[Monaco] [monaco-config.js] ✅ loader.config() configurado com preferScriptTags: true, vs:', vsPath);
    
    // Verificar se o loader está pronto
    console.log('[Monaco] [monaco-config.js] Loader configurado, aguardando componente Editor...');
    
  } catch (error) {
    console.error('[Monaco] [monaco-config.js] ❌ ERRO ao configurar loader:', error);
    console.error('[Monaco] [monaco-config.js] Stack trace:', error.stack);
  }
}

// Exportar o loader configurado
export default loader;

