/**
 * Renderizador QR Code por matriz de módulos
 * Implementa renderização correta sem redimensionamento de bitmap
 */

// Importar biblioteca QR Code que gera matriz
import QRCode from 'qrcode';

export class QRCodeRenderer {
  /**
   * Gera QR Code como matriz de módulos (não bitmap)
   * @param {string} text - Texto para codificar
   * @param {object} options - Opções do QR Code
   * @returns {object} Matriz de módulos e informações
   */
  static async generateMatrix(text, options = {}) {
    try {
      const {
        errorCorrectionLevel = 'M', // Padrão Zebra
        version = undefined, // Auto-detectar
        margin = 4, // Quiet zone padrão
        maskPattern = undefined // Auto-detectar
      } = options;

      // Gerar QR Code como matriz de módulos
      const qrCode = QRCode.create(text, {
        errorCorrectionLevel,
        version,
        maskPattern,
        margin: 0 // Sem margem - vamos adicionar manualmente
      });

      const modules = qrCode.modules;
      const size = modules.size;

      return {
        modules: modules.data,
        size: size,
        quietZone: margin,
        totalSize: size + (margin * 2)
      };
    } catch (error) {
      console.error('Erro ao gerar matriz QR Code:', error);
      throw error;
    }
  }

  /**
   * Renderiza QR Code no canvas usando matriz de módulos
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {object} qrData - Dados da matriz QR
   * @param {number} x - Posição X
   * @param {number} y - Posição Y
   * @param {number} moduleSize - Tamanho de cada módulo em pixels
   */
  static renderToCanvas(ctx, qrData, x, y, moduleSize) {
    const { modules, size, quietZone, totalSize } = qrData;
    
    // Salvar contexto
    ctx.save();
    
    // Desabilitar suavização para pixels nítidos
    ctx.imageSmoothingEnabled = false;
    
    // Desenhar fundo branco (quiet zone + módulos)
    const totalPixelSize = totalSize * moduleSize;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, totalPixelSize, totalPixelSize);
    
    // Desenhar módulos pretos
    ctx.fillStyle = '#000000';
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const moduleIndex = row * size + col;
        
        if (modules[moduleIndex]) { // Módulo preto
          const moduleX = x + (col + quietZone) * moduleSize;
          const moduleY = y + (row + quietZone) * moduleSize;
          
          // Desenhar módulo como retângulo sólido
          ctx.fillRect(moduleX, moduleY, moduleSize, moduleSize);
        }
      }
    }
    
    // Restaurar contexto
    ctx.restore();
  }

  /**
   * Calcula tamanho do QR Code baseado nos parâmetros Zebra
   * @param {number} magnification - Fator de magnificação ZPL
   * @param {number} dpi - DPI da impressora
   * @returns {number} Tamanho do módulo em pixels
   */
  static calculateModuleSize(magnification, dpi = 203) {
    // Zebra: magnification 1-10, onde cada unidade = ~1 dot na impressora
    // Para preview, converter para pixels baseado no DPI
    const dotsPerModule = magnification;
    const mmPerDot = 25.4 / dpi;
    const mmPerModule = dotsPerModule * mmPerDot;
    const pixelsPerModule = Math.max(1, Math.round(mmPerModule * (96 / 25.4))); // 96 DPI para tela
    
    return pixelsPerModule;
  }
}

export default QRCodeRenderer;
