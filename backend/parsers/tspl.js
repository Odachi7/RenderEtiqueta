/**
 * Parser TSPL (TSC Programming Language)
 * Converte comandos TSPL em objetos gráficos
 */

function parseTSPL(code) {
  const objects = [];
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { objects, errors };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('//');
    });

    let labelWidth = 100; // mm
    let labelHeight = 50; // mm

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // SIZE - Define tamanho da etiqueta (SIZE width mm, height mm)
        const sizeMatch = line.match(/^SIZE\s+([\d.]+)\s*mm\s*,\s*([\d.]+)\s*mm/i);
        if (sizeMatch) {
          labelWidth = parseFloat(sizeMatch[1]);
          labelHeight = parseFloat(sizeMatch[2]);
        }

        // TEXT - Texto (TEXT x,y,"font",rotation,x-multiplication,y-multiplication,"content")
        // Exemplo: TEXT 20,40,"3",0,1,1,"hello"
        const textMatch = line.match(/^TEXT\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(-?\d+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*"(.+?)"/i);
        if (textMatch) {
          const x = parseFloat(textMatch[1]) * 0.1; // dots para mm (203 DPI = 8 dots/mm)
          const y = parseFloat(textMatch[2]) * 0.1;
          const font = textMatch[3];
          const rotation = parseFloat(textMatch[4]);
          const scaleX = parseFloat(textMatch[5]);
          const scaleY = parseFloat(textMatch[6]);
          const content = textMatch[7];

          const fontSizeMap = { '1': 7, '2': 10, '3': 15, '4': 20, '5': 30, '6': 40 };
          const fontSize = (fontSizeMap[font] || 15) * scaleX;

          objects.push({
            type: 'text',
            x: x,
            y: y,
            fontSize: fontSize,
            fontFamily: `TSPL${font}`,
            text: content,
            rotation: rotation
          });
        }

        // BARCODE - Código de barras
        // BARCODE x,y,"type",height,human_readable,rotation,narrow,wide,"content"
        const barcodeMatch = line.match(/^BARCODE\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"(.+?)"/i);
        if (barcodeMatch) {
          objects.push({
            type: 'barcode',
            x: parseFloat(barcodeMatch[1]) * 0.1,
            y: parseFloat(barcodeMatch[2]) * 0.1,
            format: barcodeMatch[3].toLowerCase(),
            value: barcodeMatch[9],
            height: parseFloat(barcodeMatch[4]) * 0.1,
            rotation: parseFloat(barcodeMatch[6])
          });
        }

        // QRCODE - QR Code
        // QRCODE x,y,ECC_level,cell_width,mode,rotation,"content"
        const qrcodeMatch = line.match(/^QRCODE\s+(\d+)\s*,\s*(\d+)\s*,\s*([HMQ])\s*,\s*(\d+)\s*,\s*([AM])\s*,\s*(-?\d+)\s*,\s*"(.+?)"/i);
        if (qrcodeMatch) {
          objects.push({
            type: 'qrcode',
            x: parseFloat(qrcodeMatch[1]) * 0.1,
            y: parseFloat(qrcodeMatch[2]) * 0.1,
            value: qrcodeMatch[7],
            size: parseFloat(qrcodeMatch[4]) * 0.1,
            rotation: parseFloat(qrcodeMatch[6])
          });
        }

        // BOX - Caixa (BOX x,y,width,height,thickness)
        const boxMatch = line.match(/^BOX\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (boxMatch) {
          objects.push({
            type: 'box',
            x: parseFloat(boxMatch[1]) * 0.1,
            y: parseFloat(boxMatch[2]) * 0.1,
            width: parseFloat(boxMatch[3]) * 0.1,
            height: parseFloat(boxMatch[4]) * 0.1,
            lineWidth: parseFloat(boxMatch[5]) * 0.1,
            filled: false
          });
        }

        // LINE - Linha (LINE x1,y1,x2,y2,thickness)
        const lineMatch = line.match(/^LINE\s+(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (lineMatch) {
          objects.push({
            type: 'line',
            x: parseFloat(lineMatch[1]) * 0.1,
            y: parseFloat(lineMatch[2]) * 0.1,
            x2: parseFloat(lineMatch[3]) * 0.1,
            y2: parseFloat(lineMatch[4]) * 0.1,
            lineWidth: parseFloat(lineMatch[5]) * 0.1
          });
        }

      } catch (err) {
        errors.push({
          line: i + 1,
          message: `Erro ao processar linha: ${err.message}`,
          content: line
        });
      }
    }

  } catch (err) {
    errors.push({
      line: 0,
      message: `Erro geral: ${err.message}`,
      content: ''
    });
  }

  return { objects, errors, labelWidth, labelHeight };
}

module.exports = { parseTSPL };

