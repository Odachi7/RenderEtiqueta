/**
 * Engine de renderização para Canvas
 * Converte objetos gráficos em desenho no canvas
 */

const bwipjs = require('bwip-js');

class CanvasEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = options.scale || 1; // Escala de milímetros para pixels
    this.dpi = options.dpi || 203; // DPI padrão (203 DPI = 8 pixels/mm)
    this.zoom = options.zoom || 1;
    this.showGrid = options.showGrid !== false;
    this.gridSize = options.gridSize || 5; // mm
    
    // Converter mm para pixels (203 DPI = 8 px/mm)
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

  /**
   * Renderiza todos os objetos na canvas
   */
  async render(objects, labelWidth, labelHeight) {
    // Limpar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Configurar dimensões do canvas
    const widthMM = labelWidth || 100;
    const heightMM = labelHeight || 50;
    
    const widthPx = widthMM * this.mmToPx * this.zoom;
    const heightPx = heightMM * this.mmToPx * this.zoom;

    this.canvas.width = widthPx;
    this.canvas.height = heightPx;

    // Fundo branco
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, widthPx, heightPx);

    // Desenhar grid
    if (this.showGrid) {
      this.drawGrid(widthPx, heightPx);
    }

    // Desenhar bordas da etiqueta
    this.drawLabelBorder(widthPx, heightPx);

    // Renderizar objetos
    for (const obj of objects) {
      await this.renderObject(obj);
    }
  }

  /**
   * Desenha grid de referência
   */
  drawGrid(width, height) {
    this.ctx.strokeStyle = '#E0E0E0';
    this.ctx.lineWidth = 0.5;

    const gridPx = this.gridSize * this.mmToPx * this.zoom;

    // Linhas verticais
    for (let x = 0; x <= width; x += gridPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Linhas horizontais
    for (let y = 0; y <= height; y += gridPx) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  /**
   * Desenha bordas da etiqueta (simulação de bobina)
   */
  drawLabelBorder(width, height) {
    this.ctx.strokeStyle = '#9E9E9E';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(0, 0, width, height);

    // Linhas pontilhadas para indicar corte (margens)
    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = '#CCCCCC';
    const margin = 2 * this.mmToPx * this.zoom;
    this.ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    this.ctx.setLineDash([]);
  }

  /**
   * Renderiza um objeto individual
   */
  async renderObject(obj) {
    this.ctx.save();

    // Aplicar transformações (zoom e conversão mm->px)
    const scale = this.mmToPx * this.zoom;
    
    if (obj.rotation) {
      const centerX = obj.x * scale;
      const centerY = obj.y * scale;
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((obj.rotation * Math.PI) / 180);
      this.ctx.translate(-centerX, -centerY);
    }

    switch (obj.type) {
      case 'text':
        await this.renderText(obj, scale);
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
    }

    this.ctx.restore();
  }

  /**
   * Renderiza texto
   */
  async renderText(obj, scale) {
    const x = obj.x * scale;
    const y = obj.y * scale;
    const fontSize = obj.fontSize * scale;

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${fontSize}px Arial, sans-serif`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(obj.text, x, y);
  }

  /**
   * Renderiza código de barras usando bwip-js
   */
  async renderBarcode(obj, scale) {
    try {
      const x = obj.x * scale;
      const y = obj.y * scale;
      const height = obj.height * scale;

      // Criar canvas temporário para o código de barras
      const tempCanvas = document.createElement('canvas');
      await bwipjs.toCanvas(tempCanvas, {
        bcid: obj.format || 'code128',
        text: obj.value,
        scale: 1,
        height: height,
        includetext: true
      });

      this.ctx.drawImage(tempCanvas, x, y);
    } catch (err) {
      console.error('Erro ao renderizar código de barras:', err);
      // Desenhar placeholder
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, 50, obj.height * scale);
    }
  }

  /**
   * Renderiza QR Code usando bwip-js
   */
  async renderQRCode(obj, scale) {
    try {
      const x = obj.x * scale;
      const y = obj.y * scale;
      const size = obj.size * scale;

      const tempCanvas = document.createElement('canvas');
      await bwipjs.toCanvas(tempCanvas, {
        bcid: 'qrcode',
        text: obj.value,
        scale: 1,
        width: size,
        height: size
      });

      this.ctx.drawImage(tempCanvas, x, y);
    } catch (err) {
      console.error('Erro ao renderizar QR Code:', err);
      // Desenhar placeholder
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, obj.size * scale, obj.size * scale);
    }
  }

  /**
   * Renderiza caixa/retângulo
   */
  renderBox(obj, scale) {
    const x = obj.x * scale;
    const y = obj.y * scale;
    const width = obj.width * scale;
    const height = obj.height * scale;
    const lineWidth = obj.lineWidth * scale;

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = lineWidth;

    if (obj.filled) {
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * Renderiza linha
   */
  renderLine(obj, scale) {
    const x1 = obj.x * scale;
    const y1 = obj.y * scale;
    const x2 = (obj.x2 || obj.width) * scale;
    const y2 = (obj.y2 || obj.height) * scale;
    const lineWidth = (obj.lineWidth || 1) * scale;

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Exporta canvas como PNG
   */
  exportPNG() {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Exporta canvas como blob
   */
  exportBlob() {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }
}

module.exports = CanvasEngine;

