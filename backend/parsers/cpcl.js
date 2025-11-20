/**
 * Parser CPCL (Citizen Programming Command Language)
 * Converte comandos CPCL em objetos gráficos
 */

function parseCPCL(code) {
  const objects = [];
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { objects, errors };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('!');
    });

    let labelWidth = 100; // mm
    let labelHeight = 50; // mm

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();
      if (!line) continue;

      try {
        // ! 0 - Define tamanho (LENGTH m, WIDTH w)
        const sizeMatch = line.match(/! 0 (\d+) (\d+) (\d+) (\d+)/);
        if (sizeMatch) {
          labelWidth = parseFloat(sizeMatch[3]) * 0.1; // dots para mm
          labelHeight = parseFloat(sizeMatch[4]) * 0.1;
        }

        // TEXT - Texto (TEXT x y "font" size rotation "text")
        const textMatch = line.match(/TEXT\s+(\d+)\s+(\d+)\s+"([^"]+)"\s+(\d+)\s+(-?\d+)\s+"(.+?)"/);
        if (textMatch) {
          objects.push({
            type: 'text',
            x: parseFloat(textMatch[1]) * 0.1,
            y: parseFloat(textMatch[2]) * 0.1,
            fontSize: parseFloat(textMatch[4]) * 0.1,
            fontFamily: textMatch[3],
            text: textMatch[6],
            rotation: parseFloat(textMatch[5])
          });
        }

        // BARCODE - Código de barras (BARCODE x y type height rotation "data")
        const barcodeMatch = line.match(/BARCODE\s+(\d+)\s+(\d+)\s+(\w+)\s+(\d+)\s+(-?\d+)\s+"(.+?)"/);
        if (barcodeMatch) {
          objects.push({
            type: 'barcode',
            x: parseFloat(barcodeMatch[1]) * 0.1,
            y: parseFloat(barcodeMatch[2]) * 0.1,
            format: barcodeMatch[3].toLowerCase(),
            value: barcodeMatch[6],
            height: parseFloat(barcodeMatch[4]) * 0.1,
            rotation: parseFloat(barcodeMatch[5])
          });
        }

        // BOX - Caixa (BOX x y width height thickness)
        const boxMatch = line.match(/BOX\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
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

        // LINE - Linha (LINE x1 y1 x2 y2 thickness)
        const lineMatch = line.match(/LINE\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
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

module.exports = { parseCPCL };

