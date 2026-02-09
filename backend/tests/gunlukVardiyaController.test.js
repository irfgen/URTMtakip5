/**
 * Günlük Vardiya Raporu Unit Tests
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

const request = require('supertest');
const express = require('express');
const { sequelize } = require('../src/config/database');
const {
  getGunlukVardiyaRaporu,
  getGunlukVardiyaOzet
} = require('../src/controllers/gunlukVardiyaController');

// Test app setup
const app = express();
app.use(express.json());
app.get('/api/raporlar/gunluk-vardiya', getGunlukVardiyaRaporu);
app.get('/api/raporlar/gunluk-vardiya/ozet', getGunlukVardiyaOzet);

describe('Günlük Vardiya Raporu API', () => {
  beforeAll(async () => {
    // Test veritabanı bağlantısı
    await sequelize.authenticate();
    console.log('Test veritabanı bağlantısı başarılı');
  });

  afterAll(async () => {
    // Bağlantıyı kapat
    await sequelize.close();
  });

  describe('GET /api/raporlar/gunluk-vardiya', () => {
    test('Tarih parameteri eksizse 400 hatası döndürmeli', async () => {
      const response = await request(app)
        .get('/api/raporlar/gunluk-vardiya')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Tarih parameteri gerekli');
    });

    test('Geçersiz tarih formatında 400 hatası döndürmeli', async () => {
      const response = await request(app)
        .get('/api/raporlar/gunluk-vardiya?tarih=gecersiz')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Tarih formatı geçersiz');
    });

    test('Geçerli tarih ile 200 ve data döndürmeli', async () => {
      // Geçerli bir tarih kullan (dün)
      const dün = new Date();
      dün.setDate(dün.getDate() - 1);
      const tarih = dün.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/raporlar/gunluk-vardiya?tarih=${tarih}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tarih');
      expect(response.body.data).toHaveProperty('tezgahlar');
      expect(Array.isArray(response.body.data.tezgahlar)).toBe(true);
    });

    test('Response format doğru olmalı', async () => {
      const dün = new Date();
      dün.setDate(dün.getDate() - 1);
      const tarih = dün.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/raporlar/gunluk-vardiya?tarih=${tarih}`)
        .expect(200);

      // Tezgah yapısı kontrolü
      if (response.body.data.tezgahlar.length > 0) {
        const tezgah = response.body.data.tezgahlar[0];
        expect(tezgah).toHaveProperty('tezgah_id');
        expect(tezgah).toHaveProperty('tezgah_adi');
        expect(tezgah).toHaveProperty('gunduz_vardiya');
        expect(tezgah).toHaveProperty('gece_vardiya');
      }
    });
  });

  describe('GET /api/raporlar/gunluk-vardiya/ozet', () => {
    test('Tarih parameteri eksizse 400 hatası döndürmeli', async () => {
      const response = await request(app)
        .get('/api/raporlar/gunluk-vardiya/ozet')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Tarih parameteri gerekli');
    });

    test('Geçerli tarih ile özet rapor döndürmeli', async () => {
      const dün = new Date();
      dün.setDate(dün.getDate() - 1);
      const tarih = dün.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/raporlar/gunluk-vardiya/ozet?tarih=${tarih}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('toplam_tezgah');
      expect(response.body.data).toHaveProperty('toplam_is_emri');
      expect(response.body.data).toHaveProperty('tamamlanan_is_emri');
      expect(response.body.data).toHaveProperty('aktif_is_emri');
    });
  });
});
