/**
 * CONFIGURAÇÃO DO MONACO EDITOR
 * 
 * NOTA: O MonacoEnvironment já está configurado no index.html antes de qualquer código carregar
 * Este arquivo é importado para garantir que a configuração esteja presente quando necessário
 * 
 * Com nodeIntegration: false, não precisamos interceptar require() do Node.js
 */

if (typeof window !== 'undefined') {
  // Verificar se MonacoEnvironment já está configurado (deve estar, do index.html)
  if (!window.MonacoEnvironment) {
    console.warn('[Monaco] ⚠️ MonacoEnvironment não encontrado! Deveria estar configurado em index.html');
    
    // Fallback: configurar se não estiver (não deveria acontecer)
    window.MonacoEnvironment = {
      getUrl: function(path) {
        var relativePath = '/monaco/vs' + path;
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
          return window.location.origin + relativePath;
        }
        return relativePath;
      },
      getWorkerUrl: function(moduleId, label) {
        var baseUrl = '/monaco/vs';
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
          baseUrl = window.location.origin + baseUrl;
        }
        var workerScript = `
          self.MonacoEnvironment = { baseUrl: '${baseUrl}' };
          importScripts('${baseUrl}/base/worker/workerMain.js');
        `;
        var blob = new Blob([workerScript], { type: 'text/javascript' });
        return URL.createObjectURL(blob);
      },
      createTrustedTypesPolicy: undefined
    };
  } else {
    console.log('[Monaco] ✅ MonacoEnvironment já configurado (do index.html)');
  }
}

export default {};

