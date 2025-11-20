/**
 * Preload script para Electron
 * Permite comunicação segura entre o processo renderer e main
 */

const { contextBridge } = require('electron');

// Expor APIs seguras para o processo renderer
contextBridge.exposeInMainWorld('electron', {
  ping: () => {
    console.log('Preload carregado com sucesso');
    return 'pong';
  },
  // Adicione aqui outras APIs que você precisa expor de forma segura
});

