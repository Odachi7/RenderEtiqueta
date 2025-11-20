/**
 * Força o Monaco Editor a usar APENAS arquivos locais, NUNCA CDN
 * Intercepta qualquer tentativa de carregar do CDN e redireciona para arquivos locais
 */

export function forceMonacoLocal() {
  if (typeof window === 'undefined') {
    return;
  }

  // IMPORTANTE: Em desenvolvimento, retorna URL HTTP completa para evitar require() do Node.js
  // No Electron com nodeIntegration: true, require() interpreta /monaco/vs como C:\monaco\vs
  const localPath = '/monaco/vs';

  // INTERCEPTAR require() se ainda não foi interceptado
  if (window.require && window.process && window.process.type === 'renderer' && !window.__originalNodeRequire) {
    const originalRequire = window.require;
    window.__originalNodeRequire = originalRequire;
    
    window.require = function(...args) {
      const moduleId = args[0];
      
      if (typeof moduleId === 'string') {
        // Bloquear URLs HTTP/HTTPS
        if (moduleId.startsWith('http://') || moduleId.startsWith('https://')) {
          throw new Error(`Cannot load HTTP URL via require(): ${moduleId}`);
        }
        
        // Bloquear caminhos do Monaco
        if (moduleId.startsWith('/monaco/vs') || moduleId.includes('monaco')) {
          throw new Error(`Cannot load Monaco module via require(): ${moduleId}`);
        }
      }
      
      return originalRequire.apply(this, args);
    };
    
    Object.setPrototypeOf(window.require, originalRequire);
    Object.keys(originalRequire).forEach(key => {
      window.require[key] = originalRequire[key];
    });
  }

  // CRÍTICO: NÃO sobrescrever MonacoEnvironment se já estiver configurado (do index.html)
  // Apenas verificar se está configurado corretamente
  if (!window.MonacoEnvironment) {
    console.warn('[Monaco] ⚠️ MonacoEnvironment não encontrado! Configurando fallback...');
    
    // Fallback: configurar se não estiver (não deveria acontecer)
    window.MonacoEnvironment = {
      getUrl: function(path) {
        var relativePath = localPath + path;
        
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
        `.trim();
        var blob = new Blob([workerScript], { type: 'text/javascript' });
        return URL.createObjectURL(blob);
      },
      createTrustedTypesPolicy: undefined
    };
  } else {
    // MonacoEnvironment já configurado - verificar se getWorkerUrl está presente
    if (!window.MonacoEnvironment.getWorkerUrl) {
      console.warn('[Monaco] ⚠️ MonacoEnvironment configurado mas getWorkerUrl não encontrado! Adicionando...');
      
      // Adicionar getWorkerUrl se não estiver presente
      window.MonacoEnvironment.getWorkerUrl = function(moduleId, label) {
        try {
          var baseUrl = '/monaco/vs';
          if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            baseUrl = window.location.origin + baseUrl;
          }
          var workerScript = `
self.MonacoEnvironment = {
  baseUrl: '${baseUrl}'
};
importScripts('${baseUrl}/base/worker/workerMain.js');
          `.trim();
          console.log('[Monaco] 🚀 getWorkerUrl CHAMADO em forceMonacoLocal para:', label, 'com baseUrl:', baseUrl);
          var blob = new Blob([workerScript], { type: 'text/javascript' });
          var blobUrl = URL.createObjectURL(blob);
          console.log('[Monaco] ✅ getWorkerUrl adicionado em forceMonacoLocal para:', label, '-> Blob URL:', blobUrl);
          return blobUrl;
        } catch (error) {
          console.error('[Monaco] ❌ ERRO ao criar worker em forceMonacoLocal para:', label, error);
          throw error;
        }
      };
    } else {
      console.log('[Monaco] ✅ MonacoEnvironment já configurado com getWorkerUrl');
    }
  }

  // Log de confirmação
  if (process.env.NODE_ENV === 'development') {
    console.log('[Monaco] MonacoEnvironment verificado - getWorkerUrl disponível:', !!window.MonacoEnvironment.getWorkerUrl);
  }
}

