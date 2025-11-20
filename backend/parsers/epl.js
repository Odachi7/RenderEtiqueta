/**
 * Parser EPL (Eltron Programming Language)
 * Converte comandos EPL em objetos gráficos
 */

function parseEPL(code) {
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
      const line = lines[i].trim().toUpperCase();
      if (!line) continue;

      try {
        // Q - Label Width and Height
        const qMatch = line.match(/^Q(\d+),(\d+)/);
        if (qMatch) {
          labelWidth = parseFloat(qMatch[1]) * 0.125; // pontos para mm
          labelHeight = parseFloat(qMatch[2]) * 0.125;
        }

        // A - Text (A x,y,rotation,font,hor_mult,ver_mult,reverse,"text")
        // Exemplo: A50,40,0,3,1,1,N,"Hello"
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

        // B - Barcode (B x,y,rotation,type,height,human_readable,top_bottom,"data")
        // Exemplo: B10,10,0,3,100,1,1,"1234567890"
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

        // LO - Line (LO x,y,width,height)
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

        // BO - Box (BO x,y,width,height,thickness)
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

module.exports = { parseEPL };

