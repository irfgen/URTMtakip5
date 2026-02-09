/**
 * Helper functions for parsing data from backend
 */

/**
 * Safely parse cozum_adimlari from string to array
 * SQLite returns JSON fields as strings, so we need to parse them
 */
export const parseCozumAdimlari = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing cozum_adimlari:', e);
      return [];
    }
  }
  return [];
};

/**
 * Get cozum_adimlari as array safely
 */
export const getCozumAdimlari = (rapor) => {
  if (!rapor) return [];
  return parseCozumAdimlari(rapor.cozum_adimlari);
};
