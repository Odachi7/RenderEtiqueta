// ============================================================================
// CONFIGURAÇÃO CRÍTICA: Importar configuração do Monaco ANTES de tudo
// ============================================================================
// IMPORTANTE: A ordem de importação é CRÍTICA para evitar carregamento infinito!
// 1. Primeiro: Configurar MonacoEnvironment (index.html já fez isso)
// 2. Segundo: Configurar o loader ANTES de importar qualquer componente
// 3. Terceiro: Importar o App que contém o Editor
// ============================================================================

// 1. Configurar MonacoEnvironment (se ainda não configurado)
import './config/monaco';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { forceMonacoLocal } from './utils/forceMonacoLocal';

// Forçar configuração local (dupla verificação)
if (typeof window !== 'undefined') {
  forceMonacoLocal();
}

// 2. Configurar o loader ANTES de importar o App (que contém o Editor)
import './utils/monaco-config';

// 3. AGORA podemos importar o App com segurança
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

