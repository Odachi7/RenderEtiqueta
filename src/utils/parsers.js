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
    let currentModuleWidth = 2; // Largura padrão do módulo em dots
    let currentWideBarRatio = 3.0; // Proporção barra larga:fina
    let currentFontSize = 30;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        if (line.startsWith('^XA')) {
          labelWidth = 100;
          labelHeight = 50;
        }

        // ✅ ZPL: ^LL e ^PW em dots - converter para mm usando DPI
        const llMatch = line.match(/\^LL(\d+)/);
        if (llMatch) {
          const dots = parseFloat(llMatch[1]);
          labelHeight = (dots * 25.4) / 203; // Assumir 203 DPI padrão
        }

        const pwMatch = line.match(/\^PW(\d+)/);
        if (pwMatch) {
          const dots = parseFloat(pwMatch[1]);
          labelWidth = (dots * 25.4) / 203; // Assumir 203 DPI padrão
        }

        // ✅ ZPL: ^FO em dots - converter para mm
        const foMatch = line.match(/\^FO(\d+),(\d+)/);
        if (foMatch) {
          const dotsX = parseFloat(foMatch[1]);
          const dotsY = parseFloat(foMatch[2]);
          currentX = (dotsX * 25.4) / 203; // Converter dots para mm
          currentY = (dotsY * 25.4) / 203;
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

        // ✅ Parser ZPL melhorado para ^BY (module width) e ^BC (barcode)
        const byMatch = line.match(/\^BY(\d+)?,?(\d+)?,?(\d+)?/);
        if (byMatch) {
          // ^BY define largura do módulo para próximos códigos de barras
          currentModuleWidth = parseInt(byMatch[1]) || 2; // Padrão 2 dots
          currentWideBarRatio = parseFloat(byMatch[2]) || 3.0; // Padrão 3:1
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
              height: ((parseFloat(bcMatch[2] || 50) * 25.4) / 203), // Altura: dots para mm
              moduleWidth: currentModuleWidth || 2, // Largura do módulo em dots
              wideBarRatio: currentWideBarRatio || 3.0,
              includeText: bcMatch[3] !== 'N', // Y=sim, N=não
              rotation: bcMatch[1] === 'R' ? 90 : 0
            });
            i++;
          }
        }

        // ✅ Parser ZPL correto para ^BQN (QR Code Zebra)
        // Formato: ^BQN,2,<tamanho> onde N=normal, 2=modelo, tamanho=módulo
        const bqMatch = line.match(/\^BQ([A-Z]),?(\d+)?,?(\d+)?/);
        if (bqMatch && i + 1 < lines.length) {
          const fdMatchNext = lines[i + 1].match(/\^FD(.+?)(\^FS|$)/);
          if (fdMatchNext) {
            const orientation = bqMatch[1]; // N=normal, R=rotated, etc
            const model = parseInt(bqMatch[2]) || 2; // Modelo QR (1 ou 2)
            const magnification = parseInt(bqMatch[3]) || 3; // Fator de magnificação
            
            objects.push({
              type: 'qrcode',
              x: currentX,
              y: currentY,
              value: fdMatchNext[1].trim(),
              // ✅ Tamanho baseado no padrão Zebra: magnification define o módulo
              size: ((magnification * 25.4) / 203), // Magnification para mm
              model: model,
              magnification: magnification,
              rotation: orientation === 'R' ? 90 : 0
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

        // ✅ ZPL: ^LH (Label Home) em dots - converter para mm
        const lhMatch = line.match(/\^LH(\d+),(\d+)/);
        if (lhMatch) {
          const dotsX = parseFloat(lhMatch[1]);
          const dotsY = parseFloat(lhMatch[2]);
          currentX = (dotsX * 25.4) / 203; // Offset em mm
          currentY = (dotsY * 25.4) / 203;
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
        // ✅ EPL: N comando - Clear buffer
        if (line.match(/^N$/)) {
          // Limpar buffer - resetar objetos se necessário
          continue;
        }

        // ✅ EPL: q comando - Largura da etiqueta em dots (MANTER EM DOTS!)
        const qWidthMatch = line.match(/^q(\d+)$/i);
        if (qWidthMatch) {
          const widthDots = parseFloat(qWidthMatch[1]);
          labelWidth = widthDots; // EPL trabalha em DOTS, não mm!
        }

        // ✅ EPL: Q comando - Altura da etiqueta em dots (Q altura,gap)
        const qHeightMatch = line.match(/^Q(\d+),?(\d+)?$/);
        if (qHeightMatch) {
          const heightDots = parseFloat(qHeightMatch[1]);
          labelHeight = heightDots; // EPL trabalha em DOTS, não mm!
          // gap (segundo parâmetro) ignorado no preview
        }

        // ✅ EPL: A comando - Texto (A x,y,rotation,font,h_mult,v_mult,reverse,"texto")
        const aMatch = line.match(/^A(\d+),(\d+),([0-3]),([1-5]),(\d+),(\d+),([NR]),"(.+?)"/);
        if (aMatch) {
          const x = parseFloat(aMatch[1]); // DOTS - não converter!
          const y = parseFloat(aMatch[2]); // DOTS - não converter!
          const rotation = parseFloat(aMatch[3]); // 0,1,2,3 = 0°,90°,180°,270°
          const font = aMatch[4]; // 1-5
          const hMult = parseFloat(aMatch[5]);
          const vMult = parseFloat(aMatch[6]);
          const reverse = aMatch[7]; // N=normal, R=invertido
          const text = aMatch[8];

          // ✅ Tabela de fontes EPL REAL em dots
          const fontSizeMap = { 
            '1': 20,  // Font 1: 12×20 dots
            '2': 30,  // Font 2: 18×30 dots  
            '3': 40,  // Font 3: 24×40 dots
            '4': 50,  // Font 4: 32×50 dots
            '5': 75   // Font 5: 45×75 dots
          };
          const baseFontSize = fontSizeMap[font] || 20;
          const fontSize = baseFontSize * Math.max(hMult, vMult);

          objects.push({
            type: 'text',
            x: x, // Coordenadas em DOTS
            y: y,
            fontSize: fontSize, // Tamanho em dots/pixels
            fontFamily: 'monospace', // EPL usa fonte monoespaçada
            text: text,
            rotation: rotation * 90, // Converter para graus
            reverse: reverse === 'R'
          });
        }

        // ✅ EPL: B comando - Código de barras (B x,y,rotation,bc_type,narrow,wide,height,human_readable,"value")
        const bMatch = line.match(/^B(\d+),(\d+),([0-3]),([0-9A-Z]),(\d+),(\d+),(\d+),([BN]),"(.+?)"/);
        if (bMatch) {
          const x = parseFloat(bMatch[1]); // DOTS - não converter!
          const y = parseFloat(bMatch[2]); // DOTS - não converter!
          const rotation = parseFloat(bMatch[3]); // 0,1,2,3 = 0°,90°,180°,270°
          const barcodeType = bMatch[4];
          const narrow = parseFloat(bMatch[5]); // Espessura barra fina em dots
          const wide = parseFloat(bMatch[6]);   // Espessura barra grossa em dots
          const height = parseFloat(bMatch[7]); // Altura em dots
          const humanReadable = bMatch[8]; // B=sim, N=não
          const value = bMatch[9];

          objects.push({
            type: 'barcode',
            x: x, // Coordenadas em DOTS
            y: y,
            format: getEPLBarcodeFormat(barcodeType),
            value: value,
            height: height, // Altura em dots
            rotation: rotation * 90,
            moduleWidth: narrow, // Largura em dots
            wideBarRatio: wide / narrow,
            includeText: humanReadable === 'B'
          });
        }

        // ✅ EPL: LO comando - Linha (LO x,y,width,height)
        const loMatch = line.match(/^LO(\d+),(\d+),(\d+),(\d+)/);
        if (loMatch) {
          const x = parseFloat(loMatch[1]); // DOTS
          const y = parseFloat(loMatch[2]); // DOTS
          const width = parseFloat(loMatch[3]); // DOTS
          const height = parseFloat(loMatch[4]); // DOTS

          objects.push({
            type: 'line',
            x: x,
            y: y,
            x2: x + width,
            y2: y + height,
            lineWidth: Math.min(width, height) // Espessura em dots
          });
        }

        // ✅ EPL: X comando - Caixa vazada (X x,y,width,height,line_thickness)
        const xMatch = line.match(/^X(\d+),(\d+),(\d+),(\d+),(\d+)/);
        if (xMatch) {
          const x = parseFloat(xMatch[1]); // DOTS
          const y = parseFloat(xMatch[2]); // DOTS
          const width = parseFloat(xMatch[3]); // DOTS
          const height = parseFloat(xMatch[4]); // DOTS
          const lineWidth = parseFloat(xMatch[5]); // DOTS

          objects.push({
            type: 'box',
            x: x,
            y: y,
            width: width,
            height: height,
            lineWidth: lineWidth,
            filled: false
          });
        }

        // ✅ EPL: R comando - Caixa preenchida (R x,y,width,height)
        const rMatch = line.match(/^R(\d+),(\d+),(\d+),(\d+)/);
        if (rMatch) {
          const x = parseFloat(rMatch[1]); // DOTS
          const y = parseFloat(rMatch[2]); // DOTS
          const width = parseFloat(rMatch[3]); // DOTS
          const height = parseFloat(rMatch[4]); // DOTS

          objects.push({
            type: 'box',
            x: x,
            y: y,
            width: width,
            height: height,
            lineWidth: 0,
            filled: true
          });
        }

        // ✅ EPL: GW comando - Imagem/Bitmap (GW x,y,bytes_per_row,height,<hexdata>)
        const gwMatch = line.match(/^GW(\d+),(\d+),(\d+),(\d+),?(.*)$/);
        if (gwMatch) {
          const x = parseFloat(gwMatch[1]); // DOTS
          const y = parseFloat(gwMatch[2]); // DOTS
          const bytesPerRow = parseFloat(gwMatch[3]);
          const height = parseFloat(gwMatch[4]); // DOTS
          let hexData = gwMatch[5] || ''; // Dados hex podem estar na mesma linha ou nas próximas
          
          // Se não há dados hex na mesma linha, ler as próximas linhas
          if (!hexData || hexData.trim() === '') {
            const hexLines = [];
            let j = i + 1;
            while (j < lines.length && hexLines.length < height) {
              const hexLine = lines[j].trim();
              if (hexLine && /^[0-9A-F]+$/i.test(hexLine)) {
                hexLines.push(hexLine);
                j++;
              } else {
                break;
              }
            }
            hexData = hexLines.join('');
            i = j - 1; // Pular as linhas de dados hex processadas
          }
          
          hexData = hexData.replace(/\s/g, ''); // Remover espaços

          objects.push({
            type: 'image',
            x: x,
            y: y,
            width: bytesPerRow * 8, // 8 pixels por byte = largura em dots
            height: height, // Altura em dots
            bytesPerRow: bytesPerRow,
            hexData: hexData
          });
        }

        // ✅ EPL: P comando - imprimir etiqueta (ignorar no preview)
        const pMatch = line.match(/^P(\d+)?,?(\d+)?/);
        if (pMatch) {
          continue;
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
  // Mapeamento para ZPL (manter compatibilidade)
  const formats = {
    '3': 'code128',
    '4': 'code39',
    '5': 'ean13',
    '8': 'code93'
  };
  return formats[type] || 'code128';
}

function getEPLBarcodeFormat(type) {
  // ✅ Mapeamento correto dos tipos de código de barras EPL
  const formats = {
    '1': 'code128',       // Code 128 (padrão EPL)
    '2': 'upca',          // UPC-A
    '3': 'code39',        // Code 39
    '4': 'upce',          // UPC-E
    '5': 'ean13',         // EAN-13
    '6': 'ean8',          // EAN-8
    '7': 'interleaved2of5', // Interleaved 2 of 5
    '8': 'code93',        // Code 93
    '9': 'codabar',       // Codabar
    'A': 'code128',       // Code 128 subset A
    'B': 'code128',       // Code 128 subset B
    'C': 'code128'        // Code 128 subset C
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

