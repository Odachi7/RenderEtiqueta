/**
 * Parsers para diferentes linguagens de etiqueta
 * Versão navegador/React
 */

export function parseZPL(code) {
  const objects = [];
  const errors = [];
  let labelWidth = 100;
  let labelHeight = 50;

  if (!code || typeof code !== 'string') {
    return { objects, errors, labelWidth, labelHeight };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//');
    });

    let currentX = 0;
    let currentY = 0;
    let currentFont = '0';
    let currentFontSize = 30;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        if (line.startsWith('^XA')) {
          labelWidth = 100;
          labelHeight = 50;
        }

        const llMatch = line.match(/\^LL(\d+)/);
        if (llMatch) {
          labelHeight = parseFloat(llMatch[1]) * 0.125;
        }

        const pwMatch = line.match(/\^PW(\d+)/);
        if (pwMatch) {
          labelWidth = parseFloat(pwMatch[1]) * 0.125;
        }

        const foMatch = line.match(/\^FO(\d+),(\d+)/);
        if (foMatch) {
          currentX = parseFloat(foMatch[1]) * 0.125;
          currentY = parseFloat(foMatch[2]) * 0.125;
        }

        const aMatch = line.match(/\^A([A-Z0-9]+),?(\d+)?,?(\d+)?/);
        if (aMatch) {
          currentFont = aMatch[1];
          if (aMatch[2]) {
            currentFontSize = parseFloat(aMatch[2]) * 0.125;
          }
        }

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
            i++;
          }
        }

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

export function parseEPL(code) {
  const objects = [];
  const errors = [];
  let labelWidth = 100;
  let labelHeight = 50;

  if (!code || typeof code !== 'string') {
    return { objects, errors, labelWidth, labelHeight };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('//');
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();
      if (!line) continue;

      try {
        const qMatch = line.match(/^Q(\d+),(\d+)/);
        if (qMatch) {
          labelWidth = parseFloat(qMatch[1]) * 0.125;
          labelHeight = parseFloat(qMatch[2]) * 0.125;
        }

        const aMatch = line.match(/^A(\d+),(\d+),(-?\d+),(\d+),(\d+),(\d+),([YN]),"(.+?)"/);
        if (aMatch) {
          const x = parseFloat(aMatch[1]) * 0.125;
          const y = parseFloat(aMatch[2]) * 0.125;
          const rotation = parseFloat(aMatch[3]);
          const font = aMatch[4];
          const hMult = parseFloat(aMatch[5]);
          const vMult = parseFloat(aMatch[6]);
          const text = aMatch[8];

          const fontSizeMap = { '1': 7, '2': 10, '3': 15, '4': 20, '5': 30 };
          const fontSize = (fontSizeMap[font] || 15) * hMult;

          objects.push({
            type: 'text',
            x: x,
            y: y,
            fontSize: fontSize,
            fontFamily: `EPL${font}`,
            text: text,
            rotation: rotation
          });
        }

        const bMatch = line.match(/^B(\d+),(\d+),(-?\d+),(\d+),(\d+),(\d+),(\d+),"(.+?)"/);
        if (bMatch) {
          objects.push({
            type: 'barcode',
            x: parseFloat(bMatch[1]) * 0.125,
            y: parseFloat(bMatch[2]) * 0.125,
            format: getBarcodeFormat(bMatch[4]),
            value: bMatch[8],
            height: parseFloat(bMatch[5]) * 0.125,
            rotation: parseFloat(bMatch[3])
          });
        }

        const loMatch = line.match(/^LO(\d+),(\d+),(\d+),(\d+)/);
        if (loMatch) {
          objects.push({
            type: 'line',
            x: parseFloat(loMatch[1]) * 0.125,
            y: parseFloat(loMatch[2]) * 0.125,
            width: parseFloat(loMatch[3]) * 0.125,
            height: parseFloat(loMatch[4]) * 0.125,
            lineWidth: 1
          });
        }

        const boMatch = line.match(/^BO(\d+),(\d+),(\d+),(\d+),(\d+)/);
        if (boMatch) {
          objects.push({
            type: 'box',
            x: parseFloat(boMatch[1]) * 0.125,
            y: parseFloat(boMatch[2]) * 0.125,
            width: parseFloat(boMatch[3]) * 0.125,
            height: parseFloat(boMatch[4]) * 0.125,
            lineWidth: parseFloat(boMatch[5]) * 0.125,
            filled: false
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

function getBarcodeFormat(type) {
  const formats = {
    '3': 'code128',
    '4': 'code39',
    '5': 'ean13',
    '8': 'code93'
  };
  return formats[type] || 'code128';
}

export function parseTSPL(code) {
  const objects = [];
  const errors = [];
  let labelWidth = 100;
  let labelHeight = 50;

  if (!code || typeof code !== 'string') {
    return { objects, errors, labelWidth, labelHeight };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('//');
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const sizeMatch = line.match(/^SIZE\s+([\d.]+)\s*mm\s*,\s*([\d.]+)\s*mm/i);
        if (sizeMatch) {
          labelWidth = parseFloat(sizeMatch[1]);
          labelHeight = parseFloat(sizeMatch[2]);
        }

        const textMatch = line.match(/^TEXT\s+(\d+)\s*,\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(-?\d+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*"(.+?)"/i);
        if (textMatch) {
          const x = parseFloat(textMatch[1]) * 0.1;
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

export function parseCPCL(code) {
  const objects = [];
  const errors = [];
  let labelWidth = 100;
  let labelHeight = 50;

  if (!code || typeof code !== 'string') {
    return { objects, errors, labelWidth, labelHeight };
  }

  try {
    const lines = code.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('!');
    });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();
      if (!line) continue;

      try {
        const sizeMatch = line.match(/! 0 (\d+) (\d+) (\d+) (\d+)/);
        if (sizeMatch) {
          labelWidth = parseFloat(sizeMatch[3]) * 0.1;
          labelHeight = parseFloat(sizeMatch[4]) * 0.1;
        }

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

export function parseCustom(code) {
  const lines = code.split('\n');
  const objects = [];
  lines.forEach((line, i) => {
    if (line.trim()) {
      objects.push({
        type: 'text',
        x: 5,
        y: 5 + i * 5,
        fontSize: 4,
        fontFamily: 'Arial',
        text: line,
        rotation: 0
      });
    }
  });
  return { objects, errors: [], labelWidth: 100, labelHeight: 50 };
}

