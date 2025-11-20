/**
 * Gerenciador de parsers
 * Roteia o código para o parser correto baseado na linguagem
 */

const { parseZPL } = require('./parsers/zpl');
const { parseEPL } = require('./parsers/epl');
const { parseTSPL } = require('./parsers/tspl');
const { parseCPCL } = require('./parsers/cpcl');

class ParserManager {
  constructor() {
    this.parsers = {
      zpl: parseZPL,
      epl: parseEPL,
      tspl: parseTSPL,
      cpcl: parseCPCL,
      custom: (code) => {
        // Modo custom: apenas texto simples
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
    };
  }

  /**
   * Parse código baseado na linguagem
   */
  parse(language, code) {
    const parser = this.parsers[language.toLowerCase()];
    
    if (!parser) {
      return {
        objects: [],
        errors: [{
          line: 0,
          message: `Linguagem "${language}" não suportada`,
          content: ''
        }],
        labelWidth: 100,
        labelHeight: 50
      };
    }

    try {
      return parser(code);
    } catch (err) {
      return {
        objects: [],
        errors: [{
          line: 0,
          message: `Erro no parser: ${err.message}`,
          content: ''
        }],
        labelWidth: 100,
        labelHeight: 50
      };
    }
  }

  /**
   * Lista linguagens disponíveis
   */
  getAvailableLanguages() {
    return Object.keys(this.parsers);
  }
}

module.exports = ParserManager;

