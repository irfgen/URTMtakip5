// Maliyet hesaplama konfigürasyonu
const COST_CONFIG = {
  // CNC dakika ücreti (USD/dakika)
  CNC_MINUTE_RATE: 0.5, // 0.5 USD per minute

  // Döviz kurları (TL'den USD'ye çevrim için)
  EXCHANGE_RATES: {
    USD_TO_TRY: 32.0, // 1 USD = 32 TRY (örnek)
    TRY_TO_USD: 1/32.0 // 1 TRY = 0.03125 USD
  },

  // Maliyet tipleri
  COST_TYPES: {
    MANUFACTURING: 'manufacturing', // İmalat maliyeti
    PROCUREMENT: 'procurement',     // Tedarik maliyeti
    SUBCONTRACT: 'subcontract'      // Fason maliyeti
  },

  // Parça tipleri
  PART_TYPES: {
    MANUFACTURED: true,  // imalMi: true
    PROCURED: false      // imalMi: false
  }
};

/**
 * CNC işleme maliyetini hesaplar
 * @param {number} processingTimeMinutes - CNC işleme süresi (dakika)
 * @param {number} minuteRate - Dakika ücreti (opsiyonel, varsayılan config'den alınır)
 * @returns {number} Maliyet (USD)
 */
function calculateCNCCost(processingTimeMinutes, minuteRate = null) {
  const rate = minuteRate || COST_CONFIG.CNC_MINUTE_RATE;
  return processingTimeMinutes * rate;
}

/**
 * TL'den USD'ye çevir
 * @param {number} tryAmount - TL tutar
 * @returns {number} USD tutar
 */
function convertTRYtoUSD(tryAmount) {
  return tryAmount * COST_CONFIG.EXCHANGE_RATES.TRY_TO_USD;
}

/**
 * USD'den TL'ye çevir
 * @param {number} usdAmount - USD tutar
 * @returns {number} TL tutar
 */
function convertUSDtoTRY(usdAmount) {
  return usdAmount * COST_CONFIG.EXCHANGE_RATES.USD_TO_TRY;
}

/**
 * Parça birim maliyetini hesaplar - YENİ MANTIK
 * @param {Object} parca - Parça objesi
 * @returns {Object} Hesaplanmış maliyet bilgileri
 */
function calculatePartUnitCost(parca) {
  const result = {
    partCode: parca.parcaKodu,
    partName: parca.parcaAdi,
    isManufactured: parca.imalMi,
    unitCostUSD: 0,
    unitCostTRY: 0,
    costType: null,
    costDetails: {}
  };

  if (parca.imalMi) {
    // İmal edilen parça - şirket içi veya fason maliyeti
    result.costType = COST_CONFIG.COST_TYPES.MANUFACTURING;

    // Şirket içi maliyet öncelikli, yoksa fason maliyeti
    if (parca.sirketIciMaliyeti && parca.sirketIciMaliyeti > 0) {
      result.unitCostUSD = parseFloat(parca.sirketIciMaliyeti);
      result.costDetails.source = 'sirket_ici';
      result.costDetails.internalCost = parca.sirketIciMaliyeti;
    } else if (parca.fasonMaliyeti && parca.fasonMaliyeti > 0) {
      result.unitCostUSD = parseFloat(parca.fasonMaliyeti);
      result.costDetails.source = 'fason';
      result.costDetails.subcontractCost = parca.fasonMaliyeti;
    }
  } else {
    // Tedarik edilen parça - tedarik bedeli
    result.costType = COST_CONFIG.COST_TYPES.PROCUREMENT;

    if (parca.tedarikBedeli && parca.tedarikBedeli > 0) {
      result.unitCostUSD = parseFloat(parca.tedarikBedeli);
      result.costDetails.source = 'tedarik';
      result.costDetails.procurementCost = parca.tedarikBedeli;
    }
  }

  // TL karşılığını hesapla
  result.unitCostTRY = convertUSDtoTRY(result.unitCostUSD);

  return result;
}

/**
 * Parça toplam maliyetini hesaplar (BOM için)
 * @param {Object} parca - Parça objesi
 * @param {number} quantity - Miktar
 * @returns {Object} Hesaplanmış toplam maliyet bilgileri
 */
function calculatePartTotalCost(parca, quantity = 1) {
  const unitCost = calculatePartUnitCost(parca);

  return {
    ...unitCost,
    quantity: quantity,
    totalCostUSD: unitCost.unitCostUSD * quantity,
    totalCostTRY: unitCost.unitCostTRY * quantity
  };
}

/**
 * Eski maliyet hesaplama fonksiyonu - geriye uyumluluk için
 * @param {Object} parca - Parça objesi
 * @returns {Object} Hesaplanmış maliyet bilgileri
 */
function calculatePartCost(parca) {
  const result = {
    partCode: parca.parcaKodu,
    partName: parca.parcaAdi,
    isManufactured: parca.imalMi,
    costUSD: 0,
    costTRY: 0,
    costType: null,
    details: {}
  };

  if (parca.imalMi) {
    // İmal edilen parça - CNC süresi ile hesapla
    result.costType = COST_CONFIG.COST_TYPES.MANUFACTURING;

    if (parca.cncIslemeSuresi && parca.cncIslemeSuresi > 0) {
      result.costUSD = calculateCNCCost(parca.cncIslemeSuresi);
      result.details.cncProcessingTime = parca.cncIslemeSuresi;
      result.details.cncMinuteRate = COST_CONFIG.CNC_MINUTE_RATE;
    }

    // Şirket içi maliyet varsa ekle
    if (parca.sirketIciMaliyeti) {
      result.costUSD += parca.sirketIciMaliyeti;
      result.details.internalCost = parca.sirketIciMaliyeti;
    }

    // Fason maliyet varsa ekle
    if (parca.fasonMaliyeti) {
      result.costUSD += parca.fasonMaliyeti;
      result.details.subcontractCost = parca.fasonMaliyeti;
    }
  } else {
    // Tedarik edilen parça - tedarik bedeli kullan
    result.costType = COST_CONFIG.COST_TYPES.PROCUREMENT;

    if (parca.tedarikBedeli) {
      result.costUSD = parca.tedarikBedeli;
      result.details.procurementCost = parca.tedarikBedeli;
    }
  }

  // TL karşılığını hesapla
  result.costTRY = convertUSDtoTRY(result.costUSD);

  return result;
}

module.exports = {
  COST_CONFIG,
  calculateCNCCost,
  convertTRYtoUSD,
  convertUSDtoTRY,
  calculatePartCost,
  calculatePartUnitCost,
  calculatePartTotalCost
};