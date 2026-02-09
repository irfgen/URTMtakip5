/**
 * API Service Tests
 * Tests for Fatura & İrsaliye API endpoints
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { faturaAPI, irsaliyeAPI, eslestirmeAPI } from '../../src/services/api';

// Mock axios with interceptors
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  create: vi.fn(() => mockAxios),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  }
};
vi.mock('axios', () => mockAxios);

describe('API Service - Fatura', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('faturaAPI.getAll', () => {
    it('should call GET /api/faturalar with params', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 1, fatura_no: 'FTR2024001', durum: 'bekliyor' },
            { id: 2, fatura_no: 'FTR2024002', durum: 'tam_eslesti' }
          ],
          pagination: { total: 2, page: 1, limit: 20 }
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 20, durum: 'bekliyor' };
      const result = await faturaAPI.getAll(params);

      expect(axios.get).toHaveBeenCalledWith('/faturalar', { params });
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should handle empty results', async () => {
      const mockResponse = { data: { data: [], pagination: { total: 0, page: 1, limit: 20 } } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await faturaAPI.getAll();

      expect(result.data.data).toEqual([]);
      expect(result.data.pagination.total).toBe(0);
    });
  });

  describe('faturaAPI.getById', () => {
    it('should call GET /api/faturalar/:id', async () => {
      const mockFatura = {
        id: 1,
        fatura_no: 'FTR2024001',
        durum: 'bekliyor',
        tedarikci: { adi: 'Test Tedarikçi' },
        kalemler: []
      };

      axios.get.mockResolvedValue({ data: mockFatura });

      const result = await faturaAPI.getById(1);

      expect(axios.get).toHaveBeenCalledWith('/faturalar/1');
      expect(result.data).toEqual(mockFatura);
    });
  });

  describe('faturaAPI.create', () => {
    it('should call POST /api/faturalar with data', async () => {
      const newFatura = {
        fatura_no: 'FTR2024003',
        belge_tarih: '2024-01-15',
        tedarikci_id: 1,
        kalemler: [
          { stok_kodu: 'STK001', parca_adi: 'Test Parça', miktar: 100, birim: 'Adet', birim_fiyat: 50 }
        ]
      };

      const mockResponse = { data: { id: 3, ...newFatura } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await faturaAPI.create(newFatura);

      expect(axios.post).toHaveBeenCalledWith('/faturalar', newFatura);
      expect(result.data.id).toBe(3);
    });
  });

  describe('faturaAPI.update', () => {
    it('should call PUT /api/faturalar/:id with data', async () => {
      const updateData = {
        aciklama: 'Güncellenmiş açıklama',
        vade_tarihi: '2024-02-15'
      };

      const mockResponse = { data: { id: 1, ...updateData } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await faturaAPI.update(1, updateData);

      expect(axios.put).toHaveBeenCalledWith('/faturalar/1', updateData);
      expect(result.data.aciklama).toBe('Güncellenmiş açıklama');
    });
  });

  describe('faturaAPI.delete', () => {
    it('should call DELETE /api/faturalar/:id', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      const result = await faturaAPI.delete(1);

      expect(axios.delete).toHaveBeenCalledWith('/faturalar/1');
      expect(result.data.success).toBe(true);
    });
  });

  describe('faturaAPI.acquireLock', () => {
    it('should call POST /api/faturalar/:id/lock', async () => {
      const mockLockResponse = {
        data: {
          state: 'LOCKED_BY_ME',
          lockedBy: { id: 'user1', personel_adi: 'Test User' },
          lockedAt: new Date().toISOString()
        }
      };

      axios.post.mockResolvedValue(mockLockResponse);

      const result = await faturaAPI.acquireLock(1);

      expect(axios.post).toHaveBeenCalledWith('/faturalar/1/lock');
      expect(result.data.state).toBe('LOCKED_BY_ME');
    });
  });

  describe('faturaAPI.releaseLock', () => {
    it('should call DELETE /api/faturalar/:id/lock', async () => {
      const mockResponse = { data: { state: 'UNLOCKED' } };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await faturaAPI.releaseLock(1);

      expect(axios.delete).toHaveBeenCalledWith('/faturalar/1/lock');
      expect(result.data.state).toBe('UNLOCKED');
    });
  });
});

describe('API Service - İrsaliye', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('irsaliyeAPI.getAll', () => {
    it('should call GET /api/irsaliyeler with params', async () => {
      const mockResponse = {
        data: [
          { id: 1, irsaliye_no: 'IRS2024001', belge_tarih: '2024-01-10' },
          { id: 2, irsaliye_no: 'IRS2024002', belge_tarih: '2024-01-12' }
        ]
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const params = { baslangic_tarih: '2024-01-01', bitis_tarih: '2024-01-31' };
      const result = await irsaliyeAPI.getAll(params);

      expect(axios.get).toHaveBeenCalledWith('/irsaliyeler', { params });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('irsaliyeAPI.create', () => {
    it('should call POST /api/irsaliyeler with data', async () => {
      const newIrsaliye = {
        irsaliye_no: 'IRS2024003',
        belge_tarih: '2024-01-15',
        tedarikci_id: 1,
        kalemler: [
          { stok_kodu: 'STK001', parca_adi: 'Test Parça', miktar: 50, birim: 'Adet' }
        ]
      };

      const mockResponse = { data: { id: 3, ...newIrsaliye } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await irsaliyeAPI.create(newIrsaliye);

      expect(axios.post).toHaveBeenCalledWith('/irsaliyeler', newIrsaliye);
      expect(result.data.irsaliye_no).toBe('IRS2024003');
    });
  });

  describe('irsaliyeAPI.forceUnlock', () => {
    it('should call POST /api/irsaliyeler/:id/force-unlock with reason', async () => {
      const mockResponse = { data: { state: 'UNLOCKED' } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const reason = 'Kullanıcı sistemi terk etti';
      const result = await irsaliyeAPI.forceUnlock(1, reason);

      expect(axios.post).toHaveBeenCalledWith('/irsaliyeler/1/force-unlock', { reason });
      expect(result.data.state).toBe('UNLOCKED');
    });
  });
});

describe('API Service - Eşleştirme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('eslestirmeAPI.getOneriler', () => {
    it('should call GET /api/eslestirme/:faturaId/oneriler', async () => {
      const mockOneriler = {
        data: [
          {
            faturaKalem: { id: 1, stok_kodu: 'STK001', miktar: 100 },
            irsaliyeKalem: { id: 1, stok_kodu: 'STK001', miktar: 100 },
            irsaliye: { id: 1, irsaliye_no: 'IRS2024001', belge_tarih: '2024-01-10' },
            tedarikci: { id: 1, adi: 'Test Tedarikçi' },
            miktarFarki: 0,
            eslesmeTipi: 'tam'
          }
        ]
      };

      axios.get.mockResolvedValue(mockOneriler);

      const result = await eslestirmeAPI.getOneriler(1);

      expect(axios.get).toHaveBeenCalledWith('/eslestirme/1/oneriler');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].eslesmeTipi).toBe('tam');
    });
  });

  describe('eslestirmeAPI.onayla', () => {
    it('should call POST /api/eslestirme/:faturaId/onayla with eslestirmeler', async () => {
      const eslestirmeler = [
        {
          fatura_kalem_id: 1,
          irsaliye_kalem_id: 1,
          fatura_miktar: 100,
          irsaliye_miktar: 100,
          miktar_farki: 0,
          eslesme_tipi: 'tam'
        }
      ];

      const mockResponse = {
        data: {
          success: true,
          message: 'Eşleşme başarıyla tamamlandı',
          eslesen_kalem_sayisi: 1
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await eslestirmeAPI.onayla(1, eslestirmeler);

      expect(axios.post).toHaveBeenCalledWith('/eslestirme/1/onayla', { eslestirmeler });
      expect(result.data.success).toBe(true);
    });

    it('should handle miktar_farki with neden', async () => {
      const eslestirmeler = [
        {
          fatura_kalem_id: 1,
          irsaliye_kalem_id: 1,
          fatura_miktar: 100,
          irsaliye_miktar: 95,
          miktar_farki: 5,
          eslesme_tipi: 'kismi',
          neden: 'Fire kabul edildi'
        }
      ];

      const mockResponse = { data: { success: true } };
      mockAxios.post.mockResolvedValue(mockResponse);

      await eslestirmeAPI.onayla(1, eslestirmeler);

      expect(axios.post).toHaveBeenCalledWith('/eslestirme/1/onayla', { eslestirmeler });
    });
  });

  describe('eslestirmeAPI.manuelEslestirme', () => {
    it('should call POST /api/eslestirme/manuel with parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Manuel eşleşme başarıyla oluşturuldu'
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await eslestirmeAPI.manuelEslestirme(1, 2, 'Stok farkı düzeltmesi');

      expect(axios.post).toHaveBeenCalledWith('/eslestirme/manuel', {
        fatura_kalem_id: 1,
        irsaliye_kalem_id: 2,
        neden: 'Stok farkı düzeltmesi'
      });
      expect(result.data.success).toBe(true);
    });
  });

  describe('eslestirmeAPI.eslestirmeKaldir', () => {
    it('should call POST /api/eslestirme/kaldir with fatura_kalem_id', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Eşleşme başarıyla kaldırıldı'
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await eslestirmeAPI.eslestirmeKaldir(1, 'Hatalı eşleşme');

      expect(axios.post).toHaveBeenCalledWith('/eslestirme/kaldir', {
        fatura_kalem_id: 1,
        neden: 'Hatalı eşleşme'
      });
      expect(result.data.success).toBe(true);
    });
  });

  describe('eslestirmeAPI.getDurum', () => {
    it('should call GET /api/eslestirme/:faturaId/durum', async () => {
      const mockDurum = {
        data: {
          toplam_kalem: 10,
          eslesen_kalem: 7,
          bekleyen_kalem: 3,
          durum: 'kismi_eslesti'
        }
      };

      axios.get.mockResolvedValue(mockDurum);

      const result = await eslestirmeAPI.getDurum(1);

      expect(axios.get).toHaveBeenCalledWith('/eslestirme/1/durum');
      expect(result.data.durum).toBe('kismi_eslesti');
      expect(result.data.eslesen_kalem).toBe(7);
    });
  });
});

describe('API Service - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle 404 errors', async () => {
    const errorResponse = {
      response: {
        status: 404,
        data: { error: 'Fatura bulunamadı' }
      }
    };

    mockAxios.get.mockRejectedValue(errorResponse);

    await expect(faturaAPI.getById(999)).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 404,
        data: expect.objectContaining({
          error: 'Fatura bulunamadı'
        })
      })
    });
  });

  it('should handle validation errors', async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          error: 'Validasyon hatası',
          details: [
            { field: 'fatura_no', message: 'Bu alan gereklidir' }
          ]
        }
      }
    };

    mockAxios.post.mockRejectedValue(errorResponse);

    await expect(faturaAPI.create({})).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 400
      })
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error');
    mockAxios.get.mockRejectedValue(networkError);

    await expect(faturaAPI.getById(1)).rejects.toThrow('Network Error');
  });
});
