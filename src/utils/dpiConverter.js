/**
 * Utilitário para conversão de unidades baseado em DPI
 * Suporta diferentes DPIs de impressoras térmicas
 */

export class DPIConverter {
  constructor(dpi = 203) {
    this.dpi = dpi;
    this.mmToPx = dpi / 25.4;
    this.pxToMm = 25.4 / dpi;
  }

  /**
   * Converte dots (unidade impressora) para mm
   * @param {number} dots - Valor em dots
   * @returns {number} Valor em mm
   */
  dotsToMM(dots) {
    return dots * this.pxToMm;
  }

  /**
   * Converte mm para dots (unidade impressora)
   * @param {number} mm - Valor em mm
   * @returns {number} Valor em dots
   */
  mmToDots(mm) {
    return Math.round(mm * this.mmToPx);
  }

  /**
   * Converte dots para pixels de tela (96 DPI padrão)
   * @param {number} dots - Valor em dots
   * @returns {number} Valor em pixels de tela
   */
  dotsToScreenPx(dots) {
    const mm = this.dotsToMM(dots);
    return Math.round(mm * (96 / 25.4)); // 96 DPI = tela padrão
  }

  /**
   * Converte mm para pixels de renderização baseado no DPI
   * @param {number} mm - Valor em mm
   * @returns {number} Valor em pixels
   */
  mmToPx(mm) {
    return Math.round(mm * this.mmToPx);
  }

  /**
   * Converte pixels para mm baseado no DPI
   * @param {number} px - Valor em pixels
   * @returns {number} Valor em mm
   */
  pxToMM(px) {
    return px * this.pxToMm;
  }

  /**
   * Perfis de DPI para diferentes impressoras
   */
  static PROFILES = {
    ZEBRA_203: { dpi: 203, name: 'Zebra 203 DPI (Padrão)' },
    ZEBRA_300: { dpi: 300, name: 'Zebra 300 DPI (Alta Resolução)' },
    ZEBRA_600: { dpi: 600, name: 'Zebra 600 DPI (Muito Alta)' },
    TSC_203: { dpi: 203, name: 'TSC 203 DPI' },
    TSC_300: { dpi: 300, name: 'TSC 300 DPI' },
    ELTRON_203: { dpi: 203, name: 'Eltron/EPL 203 DPI' },
    DATAMAX_203: { dpi: 203, name: 'Datamax/CPCL 203 DPI' },
    DATAMAX_300: { dpi: 300, name: 'Datamax/CPCL 300 DPI' }
  };

  /**
   * Cria conversor baseado no perfil
   * @param {string} profileName - Nome do perfil
   * @returns {DPIConverter} Instância do conversor
   */
  static fromProfile(profileName) {
    const profile = DPIConverter.PROFILES[profileName];
    if (!profile) {
      console.warn(`Perfil DPI '${profileName}' não encontrado. Usando padrão 203 DPI.`);
      return new DPIConverter(203);
    }
    return new DPIConverter(profile.dpi);
  }

  /**
   * Detecta DPI baseado na linguagem e comandos
   * @param {string} language - Linguagem (zpl, epl, tspl, cpcl)
   * @param {string} code - Código da etiqueta
   * @returns {number} DPI detectado
   */
  static detectDPI(language, code) {
    // Padrões por linguagem
    const defaults = {
      zpl: 203,
      epl: 203,
      tspl: 203,
      cpcl: 203
    };

    // Tentar detectar DPI específico no código
    if (language === 'zpl') {
      // ZPL pode ter ^MD comando para definir DPI
      const mdMatch = code.match(/\^MD(\d+)/);
      if (mdMatch) {
        return parseInt(mdMatch[1]);
      }
    }

    if (language === 'tspl') {
      // TSPL pode ter DENSITY comando
      const densityMatch = code.match(/DENSITY\s+(\d+)/i);
      if (densityMatch) {
        const density = parseInt(densityMatch[1]);
        // TSPL density: 0-15, onde cada nível representa diferentes DPIs
        return density <= 8 ? 203 : 300;
      }
    }

    return defaults[language] || 203;
  }

  /**
   * Calcula fator de escala para diferentes DPIs
   * @param {number} sourceDPI - DPI origem
   * @param {number} targetDPI - DPI destino
   * @returns {number} Fator de escala
   */
  static getScaleFactor(sourceDPI, targetDPI) {
    return targetDPI / sourceDPI;
  }
}

export default DPIConverter;
