# Render Etiquetas

Aplicativo desktop para renderização visual de etiquetas de impressoras térmicas (ZPL, EPL, TSPL, CPCL).

## 🚀 Funcionalidades

- **Editor de código** com Monaco Editor (mesmo editor do VS Code)
- **Preview em tempo real** da etiqueta renderizada
- **Suporte múltiplas linguagens**: ZPL, EPL, TSPL, CPCL e modo custom
- **Zoom** com múltiplos níveis (25% a 400%)
- **Grid** opcional para referência
- **Exportação** para PNG, PDF e código fonte
- **Console de erros** para debugar problemas

## 📦 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute em modo desenvolvimento:
```bash
npm run dev
```

3. Para build de produção:
```bash
npm run build
npm start
```

## 🛠️ Tecnologias

- **Electron.js** - Framework desktop
- **React** - Interface do usuário
- **TailwindCSS** - Estilização
- **Monaco Editor** - Editor de código
- **bwip-js** - Renderização de códigos de barras e QR codes
- **jsPDF** - Geração de PDFs

## 📁 Estrutura do Projeto

```
/app
  /frontend (React + Tailwind + Editor)
    /src
      /components
      /utils
  /backend
    /parsers
      - zpl.js
      - epl.js
      - tspl.js
      - cpcl.js
    /renderer
      - canvasEngine.js
```

## 🎯 Como Usar

1. Selecione a linguagem da impressora no dropdown
2. Escreva ou cole o código da etiqueta no editor
3. Veja o preview atualizar em tempo real
4. Ajuste o zoom e grid conforme necessário
5. Exporte para PNG, PDF ou salve o código

## 📝 Exemplos de Código

### ZPL
```
^XA
^FO50,50^A0N,30,30^FDHello World^FS
^FO50,100^BCN,50,Y,N,N^FD1234567890^FS
^XZ
```

### EPL
```
N
A50,40,0,3,1,1,N,"Hello World"
B10,10,0,3,100,1,1,"1234567890"
P1
```

## 🔧 Desenvolvimento

O aplicativo funciona totalmente offline e é construído para rodar nativamente no Electron.

## 📄 Licença

MIT

