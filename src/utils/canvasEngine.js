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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const widthMM = labelWidth || 100;
    const heightMM = labelHeight || 50;
    
    const widthPx = widthMM * this.mmToPx * this.zoom;
    const heightPx = heightMM * this.mmToPx * this.zoom;

    this.canvas.width = widthPx;
    this.canvas.height = heightPx;

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

    const gridPx = this.gridSize * this.mmToPx * this.zoom;

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
    const margin = 2 * this.mmToPx * this.zoom;
    this.ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    this.ctx.setLineDash([]);
  }

  async renderObject(obj) {
    this.ctx.save();

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
    }

    this.ctx.restore();
  }

  renderText(obj, scale) {
    const x = obj.x * scale;
    const y = obj.y * scale;
    const fontSize = Math.max(8, obj.fontSize * scale);

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `${fontSize}px Arial, sans-serif`;
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(obj.text, x, y);
  }

  async renderBarcode(obj, scale) {
    try {
      const bwipjs = await import('bwip-js');
      const x = obj.x * scale;
      const y = obj.y * scale;
      const height = Math.max(20, obj.height * scale);

      const tempCanvas = document.createElement('canvas');
      await bwipjs.default.toCanvas(tempCanvas, {
        bcid: obj.format || 'code128',
        text: String(obj.value),
        scale: Math.max(1, Math.floor(scale / 2)),
        height: Math.floor(height),
        includetext: true
      });

      this.ctx.drawImage(tempCanvas, x, y);
    } catch (err) {
      console.error('Erro ao renderizar código de barras:', err);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, 50, Math.max(20, obj.height * scale));
    }
  }

  async renderQRCode(obj, scale) {
    try {
      const bwipjs = await import('bwip-js');
      const x = obj.x * scale;
      const y = obj.y * scale;
      const size = Math.max(20, obj.size * scale);

      const tempCanvas = document.createElement('canvas');
      await bwipjs.default.toCanvas(tempCanvas, {
        bcid: 'qrcode',
        text: String(obj.value),
        scale: Math.max(1, Math.floor(scale / 2)),
        width: Math.floor(size),
        height: Math.floor(size)
      });

      this.ctx.drawImage(tempCanvas, x, y);
    } catch (err) {
      console.error('Erro ao renderizar QR Code:', err);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(obj.x * scale, obj.y * scale, Math.max(20, obj.size * scale), Math.max(20, obj.size * scale));
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

