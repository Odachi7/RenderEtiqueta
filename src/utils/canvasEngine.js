/**
 * Engine de renderização para Canvas (versão navegador)
 * Converte objetos gráficos em desenho no canvas
 */

class CanvasEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = options.scale || 1;
    this.dpi = options.dpi || 203;
    this.zoom = options.zoom || 1;
    this.showGrid = options.showGrid !== false;
    this.gridSize = options.gridSize || 5;
    this.language = options.language || 'zpl';
    
    // ✅ Conversão simples e direta
    this.mmToPx = this.dpi / 25.4;
  }

  setZoom(zoom) {
    this.zoom = zoom;
  }

  setScale(scale) {
    this.scale = scale;
  }

  setShowGrid(show) {
    this.showGrid = show;
  }

  async render(objects, labelWidth, labelHeight) {
    // ✅ EPL vs ZPL: diferentes sistemas de unidades
    let widthPx, heightPx;
    
    if (this.language === 'epl') {
      // EPL trabalha em DOTS - usar 1:1 (dots = pixels)
      widthPx = labelWidth || 609;   // Dots direto
      heightPx = labelHeight || 300; // Dots direto
    } else {
      // ZPL trabalha em MM - converter para pixels
      const widthMM = labelWidth || 100;
      const heightMM = labelHeight || 50;
      widthPx = widthMM * this.mmToPx;
      heightPx = heightMM * this.mmToPx;
    }

    this.canvas.width = widthPx;
    this.canvas.height = heightPx;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fundo branco da etiqueta
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, widthPx, heightPx);
    

    if (this.showGrid) {
      this.drawGrid(widthPx, heightPx);
    }

    this.drawLabelBorder(widthPx, heightPx);

    for (const obj of objects) {
      await this.renderObject(obj);
    }
  }

  drawGrid(width, height) {
    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 0.5;

    const gridPx = this.gridSize * this.mmToPx;

    for (let x = 0; x <= width; x += gridPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  drawLabelBorder(width, height) {
    this.ctx.strokeStyle = '#9E9E9E';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(0, 0, width, height);

    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = '#CCCCCC';
    const margin = 2 * this.mmToPx;
    this.ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    this.ctx.setLineDash([]);
  }

  async renderObject(obj) {
    this.ctx.save();

    // ✅ EPL vs ZPL: diferentes escalas
    let scale;
    if (this.language === 'epl') {
      // EPL: dots = pixels (1:1)
      scale = 1;
    } else {
      // ZPL: mm para pixels
      scale = this.mmToPx;
    }
    
    if (obj.rotation) {
      const centerX = obj.x * scale;
      const centerY = obj.y * scale;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((obj.rotation * Math.PI) / 180);
      this.ctx.translate(-centerX, -centerY);
    }

    switch (obj.type) {
      case 'text':
        this.renderText(obj, scale);
        break;
      case 'barcode':
        await this.renderBarcode(obj, scale);
        break;
      case 'qrcode':
        await this.renderQRCode(obj, scale);
        break;
      case 'box':
        this.renderBox(obj, scale);
        break;
      case 'line':
        this.renderLine(obj, scale);
        break;
      case 'image':
        this.renderImage(obj, scale);
        break;
    }

    this.ctx.restore();
  }

  renderText(obj, scale) {
    const x = obj.x * scale;
    const y = obj.y * scale;
    
    let fontSize, fontFamily;
    if (this.language === 'epl') {
      // ✅ EPL: usar tamanho exato em dots/pixels
      fontSize = obj.fontSize; // Já está em dots
      fontFamily = obj.fontFamily || 'monospace'; // EPL usa monospace
    } else {
      // ZPL: escalar baseado no DPI
      fontSize = Math.max(8, obj.fontSize * scale);
      fontFamily = 'Arial, sans-serif';
    }

    this.ctx.fillStyle = obj.reverse ? '#FFFFFF' : '#000000';
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(obj.text, x, y);
  }

  async renderBarcode(obj, scale) {
    try {
      const bwipjs = await import('bwip-js');
      const x = obj.x * scale;
      const y = obj.y * scale;
      
      let height, moduleWidth, bwipScale;
      
      if (this.language === 'epl') {
        // ✅ EPL: usar valores exatos em dots
        height = obj.height; // Já está em dots
        moduleWidth = obj.moduleWidth || 2; // Dots
        bwipScale = Math.max(1, moduleWidth); // Scale direto
      } else {
        // ZPL: converter mm para pixels
        height = Math.max(20, obj.height * scale);
        const moduleWidthDots = obj.moduleWidth || 2;
        const moduleWidthMM = (moduleWidthDots * 25.4) / this.dpi;
        moduleWidth = Math.max(1, Math.round(moduleWidthMM * this.mmToPx));
        bwipScale = Math.max(1, moduleWidth);
      }

      const tempCanvas = document.createElement('canvas');
      
      await bwipjs.default.toCanvas(tempCanvas, {
        bcid: obj.format || 'code128',
        text: String(obj.value),
        scale: bwipScale,
        height: Math.floor(height / bwipScale),
        includetext: obj.includeText !== false,
        textxalign: 'center',
        textyalign: 'below'
      });

      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(tempCanvas, x, y);
      this.ctx.imageSmoothingEnabled = true;
      
    } catch (err) {
      console.error('Erro ao renderizar código de barras:', err);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, 100, Math.max(20, obj.height || 50));
    }
  }

  async renderQRCode(obj, scale) {
    try {
      // ✅ Usar biblioteca qrcode para gerar matriz de módulos
      const QRCode = await import('qrcode');
      
      const x = obj.x * scale;
      const y = obj.y * scale;
      
      // Parâmetros do QR Code
      const magnification = obj.magnification || 3;
      const moduleSize = Math.max(1, magnification);
      
      // Gerar QR Code como matriz
      const qrCode = QRCode.create(String(obj.value), {
        errorCorrectionLevel: 'M',
        margin: 4
      });
      
      const modules = qrCode.modules;
      const size = modules.size;
      const totalSize = size + 8; // 4 módulos de margem de cada lado
      
      // Desenhar fundo branco (quiet zone)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(x, y, totalSize * moduleSize, totalSize * moduleSize);
      
      // Desenhar módulos pretos
      this.ctx.fillStyle = '#000000';
      this.ctx.imageSmoothingEnabled = false;
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const moduleIndex = row * size + col;
          if (modules.data[moduleIndex]) {
            const moduleX = x + (col + 4) * moduleSize; // +4 para quiet zone
            const moduleY = y + (row + 4) * moduleSize;
            this.ctx.fillRect(moduleX, moduleY, moduleSize, moduleSize);
          }
        }
      }
      
      this.ctx.imageSmoothingEnabled = true;
      
    } catch (err) {
      console.error('Erro ao renderizar QR Code:', err);
      // Fallback: desenhar retângulo vermelho
      const fallbackSize = Math.max(20, (obj.magnification || 3) * 8);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, fallbackSize, fallbackSize);
    }
  }


  renderBox(obj, scale) {
    const x = obj.x * scale;
    const y = obj.y * scale;
    const width = obj.width * scale;
    const height = obj.height * scale;
    const lineWidth = Math.max(1, obj.lineWidth * scale);

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = lineWidth;

    if (obj.filled) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  renderLine(obj, scale) {
    const x1 = obj.x * scale;
    const y1 = obj.y * scale;
    const x2 = (obj.x2 !== undefined ? obj.x2 : (obj.x + (obj.width || 0))) * scale;
    const y2 = (obj.y2 !== undefined ? obj.y2 : (obj.y + (obj.height || 0))) * scale;
    const lineWidth = Math.max(1, (obj.lineWidth || 1) * scale);

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  renderImage(obj, scale) {
    // ✅ EPL: Renderizar imagem bitmap do comando GW
    try {
      const x = obj.x * scale;
      const y = obj.y * scale;
      const widthPx = obj.width; // Já está em dots/pixels
      const heightPx = obj.height; // Já está em dots/pixels
      
      // Criar ImageData para o bitmap
      const imageData = this.ctx.createImageData(widthPx, heightPx);
      const data = imageData.data;
      
      let pixelIndex = 0;
      
      // Processar dados hex
      for (let row = 0; row < heightPx; row++) {
        for (let byteCol = 0; byteCol < obj.bytesPerRow; byteCol++) {
          const hexIndex = (row * obj.bytesPerRow + byteCol) * 2;
          const hexByte = obj.hexData.substr(hexIndex, 2);
          
          if (hexByte.length === 2) {
            const byte = parseInt(hexByte, 16);
            
            // Processar cada bit do byte (MSB primeiro)
            for (let bit = 7; bit >= 0; bit--) {
              const isBlack = (byte >> bit) & 1;
              const dataIndex = pixelIndex * 4;
              
              // Definir cor do pixel (1=preto, 0=branco)
              const color = isBlack ? 0 : 255;
              data[dataIndex] = color;     // R
              data[dataIndex + 1] = color; // G
              data[dataIndex + 2] = color; // B
              data[dataIndex + 3] = 255;   // A
              
              pixelIndex++;
            }
          }
        }
      }
      
      // Criar canvas temporário para a imagem
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = widthPx;
      tempCanvas.height = heightPx;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);
      
      // ✅ EPL: renderizar 1:1 (dots = pixels)
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(tempCanvas, x, y);
      this.ctx.imageSmoothingEnabled = true;
      
    } catch (err) {
      console.error('Erro ao renderizar imagem EPL:', err);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, 50, 20);
    }
  }

  exportPNG() {
    return this.canvas.toDataURL('image/png');
  }

  exportBlob() {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }
}

export default CanvasEngine;

