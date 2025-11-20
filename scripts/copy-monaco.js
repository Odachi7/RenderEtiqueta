/**
 * Script para copiar arquivos do Monaco Editor para a pasta public
 * Isso garante que o Monaco esteja disponível no build de produção
 * 
 * IMPORTANTE: Usa a estrutura /monaco/vs (não /monaco-editor/min/vs)
 * Isso evita caminhos absolutos no Electron e garante funcionamento correto
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/monaco-editor/min/vs');
const destDir = path.join(__dirname, '../public/monaco/vs');

// Criar diretório de destino se não existir
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (fs.existsSync(sourceDir)) {
    console.log('Copiando arquivos do Monaco Editor para public...');
    copyRecursiveSync(sourceDir, destDir);
    console.log('✅ Arquivos do Monaco Editor copiados com sucesso!');

    // Alguns builds do Monaco tentam carregar editor.main.nls.en.js, mas o pacote só inclui editor.main.nls.js
    // Para evitar 404 e carregamento infinito, duplicamos o arquivo base para a variante .en.js
    try {
      const nlsBaseFile = path.join(destDir, 'editor', 'editor.main.nls.js');
      const nlsEnFile = path.join(destDir, 'editor', 'editor.main.nls.en.js');
      if (fs.existsSync(nlsBaseFile)) {
        fs.copyFileSync(nlsBaseFile, nlsEnFile);
        console.log('✅ Arquivo editor.main.nls.en.js gerado a partir do bundle padrão');
      } else {
        console.warn('⚠️  editor.main.nls.js não encontrado após a cópia. Verifique seu node_modules.');
      }
    } catch (nlsError) {
      console.warn('⚠️  Não foi possível gerar editor.main.nls.en.js:', nlsError);
    }
  } else {
    console.warn('⚠️  node_modules/monaco-editor/min/vs não encontrado. Execute npm install primeiro.');
  }
} catch (error) {
  console.error('❌ Erro ao copiar arquivos do Monaco Editor:', error);
  process.exit(1);
}

