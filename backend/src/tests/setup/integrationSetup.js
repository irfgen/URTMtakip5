/**
 * Integration Test Setup Utilities
 *
 * Provides helper functions for:
 * - In-memory SQLite database initialization
 * - Test data generation
 * - Authentication helpers
 * - Database cleanup
 *
 * @module integrationSetup
 */

const { sequelize } = require('../../config/database');
const db = require('../../models');
const { Personel, Firma } = db;

/**
 * Setup in-memory test database
 * Creates all tables and runs migrations
 */
async function setupTestDatabase() {
  // Sync all models to create tables
  await sequelize.sync({ force: true });

  // Run any specific migrations if needed
  // Note: For SQLite in-memory, tables are created fresh each time
  console.log('Test database setup complete');
}

/**
 * Teardown test database
 * Close connection and cleanup
 */
async function teardownTestDatabase() {
  await sequelize.close();
  console.log('Test database teardown complete');
}

/**
 * Create a test user/personel
 * @param {Object} data - User data
 * @returns {Promise<Personel>} Created personel
 */
async function createTestUser(data = {}) {
  const defaultData = {
    personel_adi: data.ad_soyad || data.personel_adi || 'Test User',
    email: data.email || 'test@example.com',
    username: data.username || 'testuser',
    sifre: data.sifre || '$2a$10$dummyHashedPassword', // Dummy hash for testing
    role: data.role || 'user',
    aktif: true
  };

  return await Personel.create(defaultData);
}

/**
 * Create a test firma (supplier)
 * @param {Object} data - Firma data
 * @returns {Promise<Firma>} Created firma
 */
async function createTestFirma(data = {}) {
  const defaultData = {
    firma_kodu: data.firma_kodu || 'TESTFIRMA',
    firma_adi: data.firma_adi || 'Test Firma A.Ş.',
    yetkili_kisi: data.yetkili_kisi || 'Test Yetkili',
    telefon: data.telefon || '05551234567',
    email: data.email || 'test@firma.com',
    adres: data.adres || 'Test Adres',
    vergi_no: data.vergi_no || '1234567890',
    vergi_dairesi: data.vergi_dairesi || 'Test Vergi Dairesi'
  };

  return await Firma.create(defaultData);
}

/**
 * Generate JWT token for authentication
 * In development mode, returns a simple mock token
 * In production with real JWT, would use jwt.sign()
 *
 * @param {Object} user - User object
 * @returns {String} Auth token
 */
function authenticateRequest(user) {
  // For development testing, auth middleware accepts dummy tokens
  // and creates req.user from non-production environment
  return 'dev-test-token-' + user.id;
}

/**
 * Generate test fatura data
 * @param {Object} overrides - Override default values
 * @returns {Object} Fatura data object
 */
function generateFaturaData(overrides = {}) {
  const defaults = {
    fatura_no: 'FAT-' + Date.now(),
    tedarikci_id: 1,
    belge_tarih: new Date().toISOString().split('T')[0],
    vade_tarih: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    belge_tipi: 'gelis',
    aciklama: 'Test faturası',
    kalemler: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate test irsaliye data
 * @param {Object} overrides - Override default values
 * @returns {Object} İrsaliye data object
 */
function generateIrsaliyeData(overrides = {}) {
  const defaults = {
    irsaliye_no: 'IRS-' + Date.now(),
    tedarikci_id: 1,
    belge_tarih: new Date().toISOString().split('T')[0],
    belge_tipi: 'gelis',
    aciklama: 'Test irsaliyesi',
    kalemler: []
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate test kalem data
 * @param {Object} overrides - Override default values
 * @returns {Object} Kalem data object
 */
function generateKalemData(overrides = {}) {
  const defaults = {
    stok_kodu: 'STK-' + Math.floor(Math.random() * 10000),
    parca_adi: 'Test Parça',
    miktar: 100,
    birim: 'Adet',
    birim_fiyat: 50,
    aciklama: 'Test kalem'
  };

  return { ...defaults, ...overrides };
}

/**
 * Create multiple test kalemler
 * @param {Number} count - Number of kalemler to create
 * @param {Object} baseData - Base data for all kalemler
 * @returns {Array} Array of kalem data
 */
function generateMultipleKalemler(count, baseData = {}) {
  const kalemler = [];
  for (let i = 0; i < count; i++) {
    kalemler.push({
      ...generateKalemData(baseData),
      stok_kodu: `STK-${String(i + 1).padStart(3, '0')}`,
      parca_adi: `Test Parça ${i + 1}`
    });
  }
  return kalemler;
}

/**
 * Wait for a specified time (ms)
 * Useful for testing lock timeout behavior
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clear all test data from database
 * Useful for cleanup between test suites
 */
async function clearAllTestData() {
  const models = Object.keys(db);

  for (const modelName of models) {
    try {
      await db[modelName].destroy({ where: {}, force: true });
    } catch (error) {
      // Skip models that don't support destroy or don't exist
      continue;
    }
  }
}

/**
 * Get database statistics
 * Useful for debugging test state
 * @returns {Promise<Object>} Record counts by model
 */
async function getDatabaseStats() {
  const stats = {};

  const modelsToCheck = [
    'Fatura', 'FaturaKalem', 'Irsaliye', 'IrsaliyeKalem',
    'Firma', 'Personel'
  ];

  for (const modelName of modelsToCheck) {
    try {
      stats[modelName] = await db[modelName].count();
    } catch (error) {
      stats[modelName] = 0;
    }
  }

  return stats;
}

/**
 * Create matching test data setup
 * Creates fatura, irsaliye, and kalemler ready for matching tests
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Created test data
 */
async function createMatchingTestData(options = {}) {
  const {
    tedarikci_id = 1,
    kalemlerCount = 3,
    withMatchingKalemler = true
  } = options;

  // Create fatura
  const faturaData = {
    ...generateFaturaData({ tedarikci_id }),
    kalemler: generateMultipleKalemler(kalemlerCount, {
      tedarikci_id,
      birim_fiyat: 50
    })
  };

  // Create irsaliye
  const irsaliyeData = {
    ...generateIrsaliyeData({ tedarikci_id }),
    kalemler: withMatchingKalemler
      ? faturaData.kalemler.map(k => ({
          stok_kodu: k.stok_kodu,
          parca_adi: k.parca_adi,
          miktar: k.miktar,
          birim: k.birim,
          tedarikci_id
        }))
      : generateMultipleKalemler(kalemlerCount, { tedarikci_id })
  };

  return {
    faturaData,
    irsaliyeData,
    tedarikci_id
  };
}

module.exports = {
  // Database setup/teardown
  setupTestDatabase,
  teardownTestDatabase,
  clearAllTestData,

  // Test data creation
  createTestUser,
  createTestFirma,
  createMatchingTestData,

  // Authentication
  authenticateRequest,

  // Data generators
  generateFaturaData,
  generateIrsaliyeData,
  generateKalemData,
  generateMultipleKalemler,

  // Utilities
  wait,
  getDatabaseStats
};
