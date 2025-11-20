/**
 * Parser ZPL (Zebra Programming Language)
 * Converte comandos ZPL em objetos gráficos
 */

function parseZPL(code) {
  const objects = [];
  const errors = [];

  if (!code || typeof code !== 'string') {
    return { objects, errors };
  }

  try {
    // Remove comentários e linhas vazias
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//');
    });

    let currentX = 0;
    let currentY = 0;
    let currentFont = '0';
    let currentFontSize = 30;
    let labelWidth = 100; // mm
    let labelHeight = 50; // mm

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // ^XA - Início de etiqueta
        if (line.startsWith('^XA')) {
          labelWidth = 100;
          labelHeight = 50;
        }

        // ^LL - Label Length (altura da etiqueta em pontos)
        const llMatch = line.match(/\^LL(\d+)/);
        if (llMatch) {
          labelHeight = parseFloat(llMatch[1]) * 0.125; // pontos para mm (8 pontos = 1mm)
        }

        // ^PW - Print Width (largura da etiqueta em pontos)
        const pwMatch = line.match(/\^PW(\d+)/);
        if (pwMatch) {
          labelWidth = parseFloat(pwMatch[1]) * 0.125;
        }

        // ^FO - Field Origin (x, y em pontos)
        const foMatch = line.match(/\^FO(\d+),(\d+)/);
        if (foMatch) {
          currentX = parseFloat(foMatch[1]) * 0.125; // pontos para mm
          currentY = parseFloat(foMatch[2]) * 0.125;
        }

        // ^A - Font Selection (^AN,height,width ou ^A0N,30,30)
        const aMatch = line.match(/\^A([A-Z0-9]+),?(\d+)?,?(\d+)?/);
        if (aMatch) {
          currentFont = aMatch[1];
          if (aMatch[2]) {
            currentFontSize = parseFloat(aMatch[2]) * 0.125;
          }
        }

        // ^FD - Field Data (texto)
        const fdMatch = line.match(/\^FD(.+?)(\^FS|$)/);
        if (fdMatch) {
          const text = fdMatch[1].trim();
          if (text) {
            objects.push({
              type: 'text',
              x: currentX,
              y: currentY,
              fontSize: currentFontSize || 4,
              fontFamily: `Zebra${currentFont}`,
              text: text,
              rotation: 0
            });
          }
        }

        // ^BC - Barcode Code 128
        const bcMatch = line.match(/\^BC([A-Z]),?(\d+)?,?([YN])?/);
        if (bcMatch && i + 1 < lines.length) {
          const fdMatchNext = lines[i + 1].match(/\^FD(.+?)(\^FS|$)/);
          if (fdMatchNext) {
            objects.push({
              type: 'barcode',
              x: currentX,
              y: currentY,
              format: 'code128',
              value: fdMatchNext[1].trim(),
              height: parseFloat(bcMatch[2] || 50) * 0.125,
              rotation: bcMatch[1] === 'R' ? 90 : 0
            });
            i++; // Pula próxima linha (FD)
          }
        }

        // ^BQ - QR Code
        const bqMatch = line.match(/\^BQ([A-Z]),(\d+)/);
        if (bqMatch && i + 1 < lines.length) {
          const fdMatchNext = lines[i + 1].match(/\^FD(.+?)(\^FS|$)/);
          if (fdMatchNext) {
            objects.push({
              type: 'qrcode',
              x: currentX,
              y: currentY,
              value: fdMatchNext[1].trim(),
              size: parseFloat(bqMatch[2]) * 0.125,
              rotation: bqMatch[1] === 'R' ? 90 : 0
            });
            i++;
          }
        }

        // ^GB - Graphic Box
        const gbMatch = line.match(/\^GB(\d+),(\d+),(\d+),?([BW])?/);
        if (gbMatch) {
          objects.push({
            type: 'box',
            x: currentX,
            y: currentY,
            width: parseFloat(gbMatch[1]) * 0.125,
            height: parseFloat(gbMatch[2]) * 0.125,
            lineWidth: parseFloat(gbMatch[3] || 1) * 0.125,
            filled: gbMatch[4] === 'B'
          });
        }

        // ^LH - Label Home
        const lhMatch = line.match(/\^LH(\d+),(\d+)/);
        if (lhMatch) {
          currentX = parseFloat(lhMatch[1]) * 0.125;
          currentY = parseFloat(lhMatch[2]) * 0.125;
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

module.exports = { parseZPL };

