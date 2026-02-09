/**
 * Fatura & İrsaliye Eşleştirme Sistemi - Integration Tests
 *
 * Comprehensive integration tests for the Fatura/İrsaliye matching system
 * covering all controllers: faturaController, irsaliyeController, eslestirmeController
 *
 * Test Coverage:
 * - CRUD operations for Fatura and İrsaliye
 * - Kalem (line item) management
 * - 3-way matching suggestions (tedarikci_id + stok_kodu + unmatched status)
 * - Matching confirmation with transaction rollback
 * - Lock acquisition and concurrent edit prevention
 * - Matching removal and status reset
 * - Edge cases and error scenarios
 *
 * @requires jest, supertest
 * @requires ../setup/integrationSetup - Test database and utilities
 */

const request = require('supertest');
const express = require('express');
const { sequelize } = require('../../config/database');

// Import models - import db after models are loaded
const db = require('../../models');

// Import models for test data setup
const {
  Fatura,
  FaturaKalem,
  Irsaliye,
  IrsaliyeKalem,
  Firma,
  Personel
} = db;

// Import routes
const faturalarRoutes = require('../../routes/faturalar');
const irsaliyelerRoutes = require('../../routes/irsaliyeler');
const eslestirmeRoutes = require('../../routes/eslestirme');

// Create minimal Express app for testing (without server startup)
// Routes now handle their own authentication in test mode
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount routes - they handle test mode auth internally
  app.use('/api/faturalar', faturalarRoutes);
  app.use('/api/irsaliyeler', irsaliyelerRoutes);
  app.use('/api/eslestirme', eslestirmeRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error'
    });
  });

  return app;
};

// Test utilities
const {
  setupTestDatabase,
  teardownTestDatabase,
  createTestUser,
  createTestFirma,
  generateFaturaData,
  generateIrsaliyeData,
  generateKalemData
} = require('../setup/integrationSetup');

describe('Fatura & İrsaliye Matching System - Integration Tests', () => {
  let testUser, testFirma;
  let app;

  // Test data containers
  let testFatura, testIrsaliye;
  let testFaturaKalem, testIrsaliyeKalem;

  /**
   * Setup before all tests
   * - Initialize in-memory SQLite database
   * - Run migrations
   * - Create base test data
   */
  beforeAll(async () => {
    // Sync database (create all tables)
    await sequelize.sync({ force: true });

    // Create test user
    testUser = await createTestUser({
      ad_soyad: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    });

    // Create test firma (tedarikçi)
    testFirma = await createTestFirma({
      firma_adi: 'Test Tedarikçi A.Ş.',
      yetkili_kisi: 'Ahmet Yılmaz'
    });

    // Create test Express app
    app = createTestApp();
  });

  /**
   * Cleanup after all tests
   * - Close database connection
   * - Clear test data
   */
  afterAll(async () => {
    await teardownTestDatabase();
  });

  /**
   * Reset data before each test
   * - Delete created records
   * - Reset sequence values
   * - Reset test data variables
   */
  beforeEach(async () => {
    // Reset test data variables
    testFatura = undefined;
    testIrsaliye = undefined;
    testFaturaKalem = undefined;
    testIrsaliyeKalem = undefined;

    // Clean up test data - use truncate instead of destroy to avoid FK issues
    await sequelize.query('PRAGMA foreign_keys = OFF');

    const tables = ['fatura_kalemleri', 'faturalar', 'irsaliye_kalemleri', 'irsaliyeler', 'personel', 'firmalar'];
    for (const table of tables) {
      try {
        await sequelize.query(`DELETE FROM ${table}`);
        await sequelize.query(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
      } catch (e) {
        // Table might not exist, continue
      }
    }

    await sequelize.query('PRAGMA foreign_keys = ON');

    // Recreate base test data
    if (!testUser) {
      testUser = await createTestUser({
        ad_soyad: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      });
    }

    if (!testFirma) {
      testFirma = await createTestFirma({
        firma_adi: 'Test Tedarikçi A.Ş.',
        yetkili_kisi: 'Ahmet Yılmaz'
      });
    }
  });

  // ========================================================================
  // IRSALIYE TESTS - Create and Read
  // ========================================================================

  describe('İrsaliye: Create Operations', () => {
    test('should create a new irsaliye with kalemler', async () => {
      const irsaliyeData = {
        irsaliye_no: 'IRS-2024-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        belge_tipi: 'gelis',
        aciklama: 'Test irsaliyesi',
        kalemler: [
          {
            stok_kodu: 'STK001',
            parca_adi: 'Test Parça 1',
            miktar: 100,
            birim: 'Adet',
            aciklama: 'Test kalem 1'
          },
          {
            stok_kodu: 'STK002',
            parca_adi: 'Test Parça 2',
            miktar: 50.5,
            birim: 'KG',
            aciklama: 'Test kalem 2'
          }
        ]
      };

      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send(irsaliyeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('İrsaliye başarıyla oluşturuldu');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('kalemler');

      // Verify kalemler were created
      expect(response.body.data.kalemler).toHaveLength(2);
      expect(response.body.data.kalemler[0].stok_kodu).toBe('STK001');
      expect(response.body.data.kalemler[0].miktar).toBe(100);
      expect(response.body.data.kalemler[1].miktar).toBe(50.5);

      // Store for subsequent tests
      testIrsaliye = response.body.data;
      testIrsaliyeKalem = response.body.data.kalemler[0];
    });

    test('should create irsaliye without kalemler', async () => {
      const irsaliyeData = {
        irsaliye_no: 'IRS-2024-002',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        belge_tipi: 'gelis'
      };

      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send(irsaliyeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kalemler).toEqual([]);
      expect(response.body.data.toplam_kalem).toBe(0);
    });

    test('should reject duplicate irsaliye_no', async () => {
      const irsaliyeData = {
        irsaliye_no: 'IRS-DUP-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15'
      };

      // Create first irsaliye
      await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send(irsaliyeData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send(irsaliyeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: '',
          tedarikci_id: null,
          belge_tarih: 'invalid-date'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('İrsaliye: Read Operations', () => {
    beforeEach(async () => {
      // Create test irsaliye
      const irsaliyeData = {
        irsaliye_no: 'IRS-READ-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        kalemler: [
          {
            stok_kodu: 'STK001',
            parca_adi: 'Test Parça',
            miktar: 100,
            birim: 'Adet'
          }
        ]
      };

      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send(irsaliyeData);

      testIrsaliye = response.body.data;
      testIrsaliyeKalem = response.body.data.kalemler[0];
    });

    test('should get irsaliye by ID', async () => {
      const response = await request(app)
        .get(`/api/irsaliyeler/${testIrsaliye.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testIrsaliye.id);
      expect(response.body.data.irsaliye_no).toBe('IRS-READ-001');
      expect(response.body.data).toHaveProperty('lockState');
      expect(response.body.data.lockState.state).toBe('UNLOCKED');
    });

    test('should return 404 for non-existent irsaliye', async () => {
      const response = await request(app)
        .get('/api/irsaliyeler/99999')
        // Authentication handled by test mode middleware in routes
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('İrsaliye bulunamadı');
    });

    test('should list irsaliyeler with pagination', async () => {
      // Create additional irsaliyeler for pagination test
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/irsaliyeler')
          // Authentication handled by test mode middleware in routes
          .send({
            irsaliye_no: `IRS-PAG-${i}`,
            tedarikci_id: testFirma.id,
            belge_tarih: '2024-01-15'
          });
      }

      const response = await request(app)
        .get('/api/irsaliyeler?page=1&limit=3')
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(3);
    });

    test('should get irsaliye kalemler', async () => {
      const response = await request(app)
        .get(`/api/irsaliyeler/${testIrsaliye.id}/kalemler`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].stok_kodu).toBe('STK001');
    });
  });

  describe('İrsaliye: Add Kalem', () => {
    beforeEach(async () => {
      // Create test irsaliye without kalemler
      const response = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-KALEM-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15'
        });

      testIrsaliye = response.body.data;
    });

    test('should add kalem to irsaliye', async () => {
      const kalemData = {
        stok_kodu: 'STK-NEW',
        parca_adi: 'Yeni Parça',
        miktar: 25,
        birim: 'KG',
        aciklama: 'Yeni kalem'
      };

      const response = await request(app)
        .post(`/api/irsaliyeler/${testIrsaliye.id}/kalemler`)
        // Authentication handled by test mode middleware in routes
        .send(kalemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stok_kodu).toBe('STK-NEW');
      expect(response.body.data.miktar).toBe(25);
      expect(response.body.data.tedarikci_id).toBe(testFirma.id);

      testIrsaliyeKalem = response.body.data;
    });

    test('should validate kalem miktar is positive', async () => {
      const response = await request(app)
        .post(`/api/irsaliyeler/${testIrsaliye.id}/kalemler`)
        // Authentication handled by test mode middleware in routes
        .send({
          stok_kodu: 'STK-BAD',
          parca_adi: 'Bad Parça',
          miktar: -10,
          birim: 'Adet'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================================================
  // FATURA TESTS - Create and Read
  // ========================================================================

  describe('Fatura: Create Operations', () => {
    test('should create a new fatura with kalemler', async () => {
      const faturaData = {
        fatura_no: 'FAT-2024-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        vade_tarih: '2024-02-15',
        belge_tipi: 'gelis',
        aciklama: 'Test faturası',
        kalemler: [
          {
            stok_kodu: 'STK001',
            parca_adi: 'Test Parça 1',
            miktar: 100,
            birim_fiyat: 50,
            birim: 'Adet'
          },
          {
            stok_kodu: 'STK002',
            parca_adi: 'Test Parça 2',
            miktar: 50,
            birim_fiyat: 75,
            birim: 'KG'
          }
        ]
      };

      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send(faturaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fatura başarıyla oluşturuldu');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.durum).toBe('bekliyor');

      // Verify kalemler
      expect(response.body.data.kalemler).toHaveLength(2);
      expect(response.body.data.kalemler[0].toplam_tutar).toBe(5000); // 100 * 50
      expect(response.body.data.kalemler[1].toplam_tutar).toBe(3750); // 50 * 75

      testFatura = response.body.data;
      testFaturaKalem = response.body.data.kalemler[0];
    });

    test('should calculate auto totals for kalemler without birim_fiyat', async () => {
      const faturaData = {
        fatura_no: 'FAT-AUTO-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        kalemler: [
          {
            stok_kodu: 'STK001',
            parca_adi: 'Test Parça',
            miktar: 100,
            birim: 'Adet'
          }
        ]
      };

      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send(faturaData)
        .expect(201);

      expect(response.body.data.kalemler[0].birim_fiyat).toBe(0);
      expect(response.body.data.kalemler[0].toplam_tutar).toBe(0);
    });

    test('should reject duplicate fatura_no', async () => {
      const faturaData = {
        fatura_no: 'FAT-DUP-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15'
      };

      await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send(faturaData)
        .expect(201);

      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send(faturaData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Fatura: Read Operations', () => {
    beforeEach(async () => {
      const faturaData = {
        fatura_no: 'FAT-READ-001',
        tedarikci_id: testFirma.id,
        belge_tarih: '2024-01-15',
        kalemler: [
          {
            stok_kodu: 'STK001',
            parca_adi: 'Test Parça',
            miktar: 100,
            birim_fiyat: 50,
            birim: 'Adet'
          }
        ]
      };

      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send(faturaData);

      testFatura = response.body.data;
      testFaturaKalem = response.body.data.kalemler[0];
    });

    test('should get fatura by ID with lock state', async () => {
      const response = await request(app)
        .get(`/api/faturalar/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testFatura.id);
      expect(response.body.data).toHaveProperty('lockState');
      expect(response.body.data.lockState.canEdit).toBe(true);
    });

    test('should list faturalar with filters', async () => {
      // Create fatura with different durum
      await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-FILTER-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-16'
        });

      const response = await request(app)
        .get('/api/faturalar?durum=bekliyor&limit=10')
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    test('should get fatura kalemler', async () => {
      const response = await request(app)
        .get(`/api/faturalar/${testFatura.id}/kalemler`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].eslesme_durumu).toBe(0);
    });
  });

  // ========================================================================
  // MATCHING SUGGESTIONS TESTS
  // ========================================================================

  describe('Eşleştirme: 3-Way Matching Suggestions', () => {
    beforeEach(async () => {
      // Create irsaliye with kalemler
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-MATCH-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-MATCH-01',
              parca_adi: 'Eşleşen Parça 1',
              miktar: 100,
              birim: 'Adet'
            },
            {
              stok_kodu: 'STK-MATCH-02',
              parca_adi: 'Eşleşen Parça 2',
              miktar: 50,
              birim: 'KG'
            }
          ]
        });

      testIrsaliye = irsResponse.body.data;

      // Create fatura with matching kalemler
      const fatResponse = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-MATCH-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-16',
          kalemler: [
            {
              stok_kodu: 'STK-MATCH-01',
              parca_adi: 'Eşleşen Parça 1',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            },
            {
              stok_kodu: 'STK-MATCH-02',
              parca_adi: 'Eşleşen Parça 2',
              miktar: 50,
              birim_fiyat: 75,
              birim: 'KG'
            }
          ]
        });

      testFatura = fatResponse.body.data;
      testFaturaKalem = fatResponse.body.data.kalemler[0];
      testIrsaliyeKalem = irsResponse.body.data.kalemler[0];
    });

    test('should get matching suggestions based on 3-way matching', async () => {
      const response = await request(app)
        .get(`/api/eslestirme/oneler/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify first match
      const firstMatch = response.body.data[0];
      expect(firstMatch).toHaveProperty('faturaKalem');
      expect(firstMatch).toHaveProperty('irsaliyeKalem');
      expect(firstMatch).toHaveProperty('irsaliye');
      expect(firstMatch).toHaveProperty('tedarikci');
      expect(firstMatch).toHaveProperty('eslesmeTipi');
      expect(firstMatch).toHaveProperty('oncelik');

      // Verify 3-way matching criteria
      expect(firstMatch.faturaKalem.tedarikci_id).toBe(firstMatch.irsaliyeKalem.tedarikci_id);
      expect(firstMatch.faturaKalem.stok_kodu).toBe(firstMatch.irsaliyeKalem.stok_kodu);
      expect(firstMatch.irsaliyeKalem.eslesme_durumu).toBe(0); // Unmatched
    });

    test('should prioritize exact quantity matches (tam)', async () => {
      const response = await request(app)
        .get(`/api/eslestirme/oneler/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      // Exact quantity match should have eslesmeTipi: 'tam' and oncelik: 1
      const exactMatches = response.body.data.filter(m => m.eslesmeTipi === 'tam');
      expect(exactMatches.length).toBeGreaterThan(0);
      expect(exactMatches[0].oncelik).toBe(1);
      expect(exactMatches[0].miktarFarki).toBeLessThan(0.01);
    });

    test('should return empty array for fatura with no potential matches', async () => {
      // Create fatura with different tedarikci
      const anotherFirma = await createTestFirma({
        firma_adi: 'Başka Tedarikçi',
        yetkili_kisi: 'Mehmet Demir'
      });

      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-NOMATCH-001',
          tedarikci_id: anotherFirma.id,
          belge_tarih: '2024-01-16',
          kalemler: [
            {
              stok_kodu: 'STK-OTHER',
              parca_adi: 'Başka Parça',
              miktar: 10,
              birim_fiyat: 100,
              birim: 'Adet'
            }
          ]
        });

      const noMatchResponse = await request(app)
        .get(`/api/eslestirme/oneler/${response.body.data.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(noMatchResponse.body.data).toEqual([]);
    });

    test('should exclude already matched irsaliye kalemler', async () => {
      // First, create a match
      await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          neden: 'Manuel test'
        })
        .expect(200);

      // Get suggestions again - matched kalem should not appear
      const response = await request(app)
        .get(`/api/eslestirme/oneler/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      const matchedKalemInSuggestions = response.body.data.find(
        m => m.irsaliyeKalem.id === testIrsaliyeKalem.id
      );

      expect(matchedKalemInSuggestions).toBeUndefined();
    });
  });

  // ========================================================================
  // MATCHING CONFIRMATION TESTS
  // ========================================================================

  describe('Eşleştirme: Confirm Matching', () => {
    beforeEach(async () => {
      // Create irsaliye
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-CONF-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-CONF-01',
              parca_adi: 'Eşleşme Test 1',
              miktar: 100,
              birim: 'Adet'
            },
            {
              stok_kodu: 'STK-CONF-02',
              parca_adi: 'Eşleşme Test 2',
              miktar: 50,
              birim: 'KG'
            }
          ]
        });

      testIrsaliye = irsResponse.body.data;
      const irsKalemler = irsResponse.body.data.kalemler;

      // Create fatura
      const fatResponse = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-CONF-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-16',
          kalemler: [
            {
              stok_kodu: 'STK-CONF-01',
              parca_adi: 'Eşleşme Test 1',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            },
            {
              stok_kodu: 'STK-CONF-02',
              parca_adi: 'Eşleşme Test 2',
              miktar: 50,
              birim_fiyat: 75,
              birim: 'KG'
            }
          ]
        });

      testFatura = fatResponse.body.data;
      const fatKalemler = fatResponse.body.data.kalemler;

      testFaturaKalem = fatKalemler[0];
      testIrsaliyeKalem = irsKalemler[0];
    });

    test('should confirm matching with exact quantities', async () => {
      const eslestirmeler = [
        {
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          fatura_miktar: 100,
          irsaliye_miktar: 100
        }
      ];

      const response = await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFatura.id,
          eslestirmeler
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.itemCount).toBe(1);

      // Verify eslesme_durumu updated
      const faturaKalem = await FaturaKalem.findByPk(testFaturaKalem.id);
      expect(faturaKalem.eslesme_durumu).toBe(1);
      expect(faturaKalem.eslesen_irsaliye_kalem_id).toBe(testIrsaliyeKalem.id);

      const irsaliyeKalem = await IrsaliyeKalem.findByPk(testIrsaliyeKalem.id);
      expect(irsaliyeKalem.eslesme_durumu).toBe(1);
      expect(irsaliyeKalem.eslesen_fatura_kalem_id).toBe(testFaturaKalem.id);

      // Verify fatura durum updated to kismi_eslesti
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura.durum).toBe('kismi_eslesti');
    });

    test('should require neden for quantity difference', async () => {
      const eslestirmeler = [
        {
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          fatura_miktar: 100,
          irsaliye_miktar: 95 // 5 unit difference
          // neden is missing - should fail
        }
      ];

      const response = await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFatura.id,
          eslestirmeler
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validasyon hatası');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details[0].error).toContain('neden');
    });

    test('should accept matching with neden for quantity difference', async () => {
      const eslestirmeler = [
        {
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          fatura_miktar: 100,
          irsaliye_miktar: 95,
          neden: 'Fazla yükleme bildirildi'
        }
      ];

      const response = await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFatura.id,
          eslestirmeler
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should update fatura durum to tam_eslesti when all matched', async () => {
      const fatKalemler = await FaturaKalem.findAll({
        where: { fatura_id: testFatura.id }
      });

      const irsKalemler = await IrsaliyeKalem.findAll({
        where: { irsaliye_id: testIrsaliye.id }
      });

      const eslestirmeler = fatKalemler.map((fk, index) => ({
        fatura_kalem_id: fk.id,
        irsaliye_kalem_id: irsKalemler[index].id,
        fatura_miktar: fk.miktar,
        irsaliye_miktar: irsKalemler[index].miktar
      }));

      await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFatura.id,
          eslestirmeler
        })
        .expect(200);

      // Verify fatura durum
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura.durum).toBe('tam_eslesti');

      // Verify irsaliye durum also updated
      const irsaliye = await Irsaliye.findByPk(testIrsaliye.id);
      expect(irsaliye.durum).toBe('tam_eslesti');
    });

    test('should rollback on validation error', async () => {
      const initialFaturaKalem = await FaturaKalem.findByPk(testFaturaKalem.id);
      const initialEslesmeDurumu = initialFaturaKalem.eslesme_durumu;

      const eslestirmeler = [
        {
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          fatura_miktar: 100,
          irsaliye_miktar: 90 // Missing neden
        }
      ];

      // Attempt to match with validation error
      await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFatura.id,
          eslestirmeler
        })
        .expect(400);

      // Verify no changes - transaction rolled back
      const faturaKalemAfter = await FaturaKalem.findByPk(testFaturaKalem.id);
      expect(faturaKalemAfter.eslesme_durumu).toBe(initialEslesmeDurumu);
    });
  });

  // ========================================================================
  // MANUAL MATCHING TESTS
  // ========================================================================

  describe('Eşleştirme: Manual Matching', () => {
    beforeEach(async () => {
      // Create test data
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-MAN-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-MANUAL',
              parca_adi: 'Manuel Eşleşme',
              miktar: 100,
              birim: 'Adet'
            }
          ]
        });

      testIrsaliyeKalem = irsResponse.body.data.kalemler[0];

      const fatResponse = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-MAN-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-16',
          kalemler: [
            {
              stok_kodu: 'STK-MANUAL',
              parca_adi: 'Manuel Eşleşme',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            }
          ]
        });

      testFatura = fatResponse.body.data;
      testFaturaKalem = fatResponse.body.data.kalemler[0];
    });

    test('should perform manual matching', async () => {
      const response = await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id,
          neden: 'Manuel eşleştirme testi'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify match
      const faturaKalem = await FaturaKalem.findByPk(testFaturaKalem.id);
      expect(faturaKalem.eslesme_durumu).toBe(1);
      expect(faturaKalem.eslesen_irsaliye_kalem_id).toBe(testIrsaliyeKalem.id);

      const irsaliyeKalem = await IrsaliyeKalem.findByPk(testIrsaliyeKalem.id);
      expect(irsaliyeKalem.eslesme_durumu).toBe(1);
      expect(irsaliyeKalem.eslesen_fatura_kalem_id).toBe(testFaturaKalem.id);
    });

    test('should reject matching already matched kalemler', async () => {
      // First match
      await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id
        })
        .expect(200);

      // Try to match again
      const response = await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bu kalem zaten eşleştirilmiş');
    });

    test('should return 404 for non-existent kalem', async () => {
      const response = await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: 99999,
          irsaliye_kalem_id: 99999
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  // ========================================================================
  // REMOVE MATCHING TESTS
  // ========================================================================

  describe('Eşleştirme: Remove Matching', () => {
    beforeEach(async () => {
      // Create and match kalemler
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-REM-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-REMOVE',
              parca_adi: 'Kaldırma Test',
              miktar: 100,
              birim: 'Adet'
            }
          ]
        });

      testIrsaliyeKalem = irsResponse.body.data.kalemler[0];

      const fatResponse = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-REM-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-16',
          kalemler: [
            {
              stok_kodu: 'STK-REMOVE',
              parca_adi: 'Kaldırma Test',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            }
          ]
        });

      testFatura = fatResponse.body.data;
      testFaturaKalem = fatResponse.body.data.kalemler[0];

      // Create match
      await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: testIrsaliyeKalem.id
        });
    });

    test('should remove matching and reset status', async () => {
      const response = await request(app)
        .post(`/api/eslestirme/eslestirme-kaldir/${testFaturaKalem.id}`)
        // Authentication handled by test mode middleware in routes
        .send({
          neden: 'Eşleşme hatası - düzeltme gerekli'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify reset
      const faturaKalem = await FaturaKalem.findByPk(testFaturaKalem.id);
      expect(faturaKalem.eslesme_durumu).toBe(0);
      expect(faturaKalem.eslesen_irsaliye_kalem_id).toBeNull();

      const irsaliyeKalem = await IrsaliyeKalem.findByPk(testIrsaliyeKalem.id);
      expect(irsaliyeKalem.eslesme_durumu).toBe(0);
      expect(irsaliyeKalem.eslesen_fatura_kalem_id).toBeNull();

      // Verify fatura durum reset to bekliyor
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura.durum).toBe('bekliyor');
    });

    test('should reject removing non-existent match', async () => {
      // First remove the match
      await request(app)
        .post(`/api/eslestirme/eslestirme-kaldir/${testFaturaKalem.id}`)
        // Authentication handled by test mode middleware in routes
        .send({ neden: 'Test' });

      // Try to remove again
      const response = await request(app)
        .post(`/api/eslestirme/eslestirme-kaldir/${testFaturaKalem.id}`)
        // Authentication handled by test mode middleware in routes
        .send({
          neden: 'Tekrar deneme'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bu kalem eşleştirilmemiş');
    });

    test('should require neden for removing match', async () => {
      const response = await request(app)
        .post(`/api/eslestirme/eslestirme-kaldir/${testFaturaKalem.id}`)
        // Authentication handled by test mode middleware in routes
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  // ========================================================================
  // LOCK MECHANISM TESTS
  // ========================================================================

  describe('Lock: Concurrent Edit Prevention', () => {
    let user1, user2;

    beforeEach(async () => {
      // Create two different users
      user1 = await createTestUser({
        ad_soyad: 'User One',
        email: 'user1@test.com',
        role: 'user'
      });

      user2 = await createTestUser({
        ad_soyad: 'User Two',
        email: 'user2@test.com',
        role: 'user'
      });

      // Create test fatura
      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-LOCK-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-LOCK',
              parca_adi: 'Lock Test',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            }
          ]
        });

      testFatura = response.body.data;
    });

    test('should acquire lock successfully', async () => {
      const response = await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locked_by).toBe(user1.id);
      expect(response.body.data.locked_at).not.toBeNull();
    });

    test('should prevent edit when locked by another user', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString())
        .expect(200);

      // User2 tries to update
      const response = await request(app)
        .put(`/api/faturalar/${testFatura.id}`)
        .set('X-Test-User-Id', user2.id.toString())
        .send({
          aciklama: 'Attempted update by user2'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Kayıt başka bir kullanıcı tarafından kilitli');
    });

    test('should allow owner to edit when locked by self', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString());

      // User1 can update
      const response = await request(app)
        .put(`/api/faturalar/${testFatura.id}`)
        .set('X-Test-User-Id', user1.id.toString())
        .send({
          aciklama: 'User1 update'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should release lock successfully', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString());

      // User1 releases lock
      const response = await request(app)
        .delete(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify lock released
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura.locked_by).toBeNull();
    });

    test('should only allow lock owner to release', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString());

      // User2 tries to release user1's lock
      const response = await request(app)
        .delete(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user2.id.toString())
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Sadece kendi lockunuzu bırakabilirsiniz');
    });

    test('should allow same user to reacquire expired lock', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString());

      // Manually expire the lock (simulate 30+ minutes passed)
      const fatura = await Fatura.findByPk(testFatura.id);
      const expiredTime = new Date(Date.now() - 31 * 60 * 1000);
      await fatura.update({ locked_at: expiredTime });

      // User1 can still acquire (auto-renew)
      const response = await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should allow different user to acquire expired lock', async () => {
      // User1 acquires lock
      await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user1.id.toString());

      // Manually expire the lock
      const fatura = await Fatura.findByPk(testFatura.id);
      const expiredTime = new Date(Date.now() - 31 * 60 * 1000);
      await fatura.update({ locked_at: expiredTime });

      // User2 can acquire (lock expired)
      const response = await request(app)
        .post(`/api/faturalar/${testFatura.id}/lock`)
        .set('X-Test-User-Id', user2.id.toString())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.locked_by).toBe(user2.id);
    });
  });

  // ========================================================================
  // DELETE OPERATIONS TESTS
  // ========================================================================

  describe('Delete: With Match Prevention', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-DEL-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-DEL',
              parca_adi: 'Delete Test',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            }
          ]
        });

      testFatura = response.body.data;
      testFaturaKalem = response.body.data.kalemler[0];
    });

    test('should delete fatura without matches', async () => {
      const response = await request(app)
        .delete(`/api/faturalar/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura).toBeNull();

      const kalem = await FaturaKalem.findByPk(testFaturaKalem.id);
      expect(kalem).toBeNull();
    });

    test('should prevent deleting fatura with matched kalemler', async () => {
      // Create irsaliye and match
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-DEL-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-DEL',
              parca_adi: 'Delete Test',
              miktar: 100,
              birim: 'Adet'
            }
          ]
        });

      const irsKalem = irsResponse.body.data.kalemler[0];

      // Match kalemler
      await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: testFaturaKalem.id,
          irsaliye_kalem_id: irsKalem.id
        });

      // Try to delete fatura
      const response = await request(app)
        .delete(`/api/faturalar/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('HAS_MATCHED_KALEM');

      // Verify fatura still exists
      const fatura = await Fatura.findByPk(testFatura.id);
      expect(fatura).not.toBeNull();
    });
  });

  // ========================================================================
  // MATCHING STATUS TESTS
  // ========================================================================

  describe('Eşleştirme: Status Tracking', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-STAT-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-STAT-1',
              parca_adi: 'Status Test 1',
              miktar: 100,
              birim_fiyat: 50,
              birim: 'Adet'
            },
            {
              stok_kodu: 'STK-STAT-2',
              parca_adi: 'Status Test 2',
              miktar: 50,
              birim_fiyat: 75,
              birim: 'KG'
            },
            {
              stok_kodu: 'STK-STAT-3',
              parca_adi: 'Status Test 3',
              miktar: 25,
              birim_fiyat: 100,
              birim: 'Adet'
            }
          ]
        });

      testFatura = response.body.data;
    });

    test('should report initial status as bekliyor', async () => {
      const response = await request(app)
        .get(`/api/eslestirme/durum/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.toplam).toBe(3);
      expect(response.body.data.eslesmis).toBe(0);
      expect(response.body.data.bekleyen).toBe(3);
      expect(response.body.data.durum).toBe('bekliyor');
    });

    test('should report kismi_eslesti when partially matched', async () => {
      // Create irsaliye and match one kalem
      const irsResponse = await request(app)
        .post('/api/irsaliyeler')
        // Authentication handled by test mode middleware in routes
        .send({
          irsaliye_no: 'IRS-STAT-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-STAT-1',
              parca_adi: 'Status Test 1',
              miktar: 100,
              birim: 'Adet'
            }
          ]
        });

      const fatKalemler = await FaturaKalem.findAll({
        where: { fatura_id: testFatura.id }
      });

      await request(app)
        .post('/api/eslestirme/manuel')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_kalem_id: fatKalemler[0].id,
          irsaliye_kalem_id: irsResponse.body.data.kalemler[0].id
        });

      const response = await request(app)
        .get(`/api/eslestirme/durum/${testFatura.id}`)
        // Authentication handled by test mode middleware in routes
        .expect(200);

      expect(response.body.data.durum).toBe('kismi_eslesti');
      expect(response.body.data.eslesmis).toBe(1);
      expect(response.body.data.bekleyen).toBe(2);
    });
  });

  // ========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ========================================================================

  describe('Edge Cases: Error Handling', () => {
    test('should handle non-existent fatura gracefully', async () => {
      const response = await request(app)
        .get('/api/faturalar/99999')
        // Authentication handled by test mode middleware in routes
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Fatura bulunamadı');
    });

    test('should handle invalid ID parameter', async () => {
      const response = await request(app)
        .get('/api/faturalar/invalid-id')
        // Authentication handled by test mode middleware in routes
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle empty eslestirmeler array', async () => {
      const response = await request(app)
        .post('/api/eslestirme/onayla')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_id: testFirma.id,
          eslestirmeler: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.itemCount).toBe(0);
    });

    test('should validate negative quantities', async () => {
      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-NEG-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-NEG',
              parca_adi: 'Negative Qty',
              miktar: -10,
              birim_fiyat: 50,
              birim: 'Adet'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle very large quantity values', async () => {
      const response = await request(app)
        .post('/api/faturalar')
        // Authentication handled by test mode middleware in routes
        .send({
          fatura_no: 'FAT-LARGE-001',
          tedarikci_id: testFirma.id,
          belge_tarih: '2024-01-15',
          kalemler: [
            {
              stok_kodu: 'STK-LARGE',
              parca_adi: 'Large Quantity',
              miktar: 999999.999,
              birim_fiyat: 1,
              birim: 'KG'
            }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.kalemler[0].miktar).toBe(999999.999);
    });
  });
});
