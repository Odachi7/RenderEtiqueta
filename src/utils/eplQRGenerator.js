/**
 * Gerador de QR Code para EPL
 * Converte QR code para formato hex do comando GW
 */

import QRCode from 'qrcode';

export class EPLQRGenerator {
  /**
   * Gera QR code e converte para formato EPL GW
   * @param {string} text - Texto para o QR code
   * @param {number} size - Tamanho do módulo (padrão: 3)
   * @returns {Promise<{hexData: string, width: number, height: number, bytesPerRow: number}>}
   */
  static async generateQRForEPL(text, size = 3) {
    try {
      // Gerar matriz do QR code
      const qrMatrix = await QRCode.create(text, {
        errorCorrectionLevel: 'M',
        type: 'terminal',
        margin: 1,
        width: size
      });

      const modules = qrMatrix.modules;
      const moduleCount = modules.size;
      
      // Calcular dimensões em dots
      const qrSizeDots = moduleCount * size;
      const bytesPerRow = Math.ceil(qrSizeDots / 8);
      
      // Converter matriz para hex
      const hexLines = [];
      
      for (let row = 0; row < moduleCount; row++) {
        // Repetir cada linha 'size' vezes para magnificação
        for (let sizeY = 0; sizeY < size; sizeY++) {
          let hexRow = '';
          
          for (let byteCol = 0; byteCol < bytesPerRow; byteCol++) {
            let byte = 0;
            
            for (let bit = 0; bit < 8; bit++) {
              const moduleCol = Math.floor((byteCol * 8 + bit) / size);
              
              if (moduleCol < moduleCount) {
                const isDark = modules.get(moduleCol, row);
                if (isDark) {
                  byte |= (1 << (7 - bit));
                }
              }
            }
            
            hexRow += byte.toString(16).toUpperCase().padStart(2, '0');
          }
          
          hexLines.push(hexRow);
        }
      }
      
      return {
        hexData: hexLines.join(''),
        width: qrSizeDots,
        height: qrSizeDots,
        bytesPerRow: bytesPerRow
      };
      
    } catch (error) {
      console.error('Erro ao gerar QR code para EPL:', error);
      
      // Fallback: QR code simples 21x21
      const fallbackSize = 21;
      const fallbackBytesPerRow = 3;
      const fallbackHex = 'FFFFFFFFFF' + 'F80001F800'.repeat(19) + 'FFFFFFFFFF';
      
      return {
        hexData: fallbackHex,
        width: fallbackSize,
        height: fallbackSize,
        bytesPerRow: fallbackBytesPerRow
      };
    }
  }

  /**
   * Gera comando EPL GW completo para QR code
   * @param {number} x - Posição X em dots
   * @param {number} y - Posição Y em dots  
   * @param {string} text - Texto para o QR code
   * @param {number} size - Tamanho do módulo
   * @returns {Promise<string>} - Comando GW completo
   */
  static async generateEPLCommand(x, y, text, size = 3) {
    const qrData = await this.generateQRForEPL(text, size);
    
    let command = `GW${x},${y},${qrData.bytesPerRow},${qrData.height},\n`;
    
    // Adicionar dados hex linha por linha
    const hexLines = [];
    for (let i = 0; i < qrData.hexData.length; i += qrData.bytesPerRow * 2) {
      const line = qrData.hexData.substr(i, qrData.bytesPerRow * 2);
      hexLines.push(line);
    }
    
    command += hexLines.join('\n');
    
    return command;
  }
}
