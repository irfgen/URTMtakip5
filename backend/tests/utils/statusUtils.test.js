const StatusUtils = require('../../src/utils/statusUtils');
const IsEmriDurum = require('../../src/models/IsEmriDurum');

// Mock the IsEmriDurum model
jest.mock('../../src/models/IsEmriDurum');

describe('StatusUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveDurumlar', () => {
    test('should return active durumlar ordered by sira_no and durum_adi', async () => {
      const mockDurumlar = [
        { id: 1, durum_kodu: 'beklemede', durum_adi: 'Beklemede', sira_no: 1, aktif: true },
        { id: 2, durum_kodu: 'uretimde', durum_adi: 'Üretimde', sira_no: 2, aktif: true }
      ];

      IsEmriDurum.findAll.mockResolvedValue(mockDurumlar);

      const result = await StatusUtils.getActiveDurumlar();

      expect(IsEmriDurum.findAll).toHaveBeenCalledWith({
        where: { aktif: true },
        order: [['sira_no', 'ASC'], ['durum_adi', 'ASC']]
      });
      expect(result).toEqual(mockDurumlar);
    });

    test('should throw error when database fails', async () => {
      const error = new Error('Database error');
      IsEmriDurum.findAll.mockRejectedValue(error);

      await expect(StatusUtils.getActiveDurumlar()).rejects.toThrow(error);
    });
  });

  describe('isValidDurum', () => {
    test('should return true for valid active durum', async () => {
      IsEmriDurum.findOne.mockResolvedValue({ id: 1, durum_kodu: 'uretimde', aktif: true });

      const result = await StatusUtils.isValidDurum('uretimde');

      expect(IsEmriDurum.findOne).toHaveBeenCalledWith({
        where: { durum_kodu: 'uretimde', aktif: true }
      });
      expect(result).toBe(true);
    });

    test('should return false for invalid durum', async () => {
      IsEmriDurum.findOne.mockResolvedValue(null);

      const result = await StatusUtils.isValidDurum('gecersiz');

      expect(result).toBe(false);
    });

    test('should return false when database fails', async () => {
      IsEmriDurum.findOne.mockRejectedValue(new Error('Database error'));

      const result = await StatusUtils.isValidDurum('uretimde');

      expect(result).toBe(false);
    });
  });

  describe('normalizeDurum', () => {
    test('should normalize string to lowercase', () => {
      const result = StatusUtils.normalizeDurum('ÜRETİMDE');
      expect(result).toBe('üreti̇mde'); // Turkish I character issue
    });

    test('should trim whitespace', () => {
      expect(StatusUtils.normalizeDurum('  uretimde  ')).toBe('uretimde');
    });

    test('should handle null/undefined', () => {
      expect(StatusUtils.normalizeDurum(null)).toBeNull();
      expect(StatusUtils.normalizeDurum(undefined)).toBeNull();
    });

    test('should convert numbers to string', () => {
      expect(StatusUtils.normalizeDurum(123)).toBe('123');
    });
  });

  describe('isDurumEqual', () => {
    test('should return true for equal durums ignoring case', () => {
      // Turkish I character normalization issue
      expect(StatusUtils.isDurumEqual('URETIMDE', 'uretimde')).toBe(true);
      expect(StatusUtils.isDurumEqual('  uretimde  ', 'URETIMDE')).toBe(true);
    });

    test('should return false for different durums', () => {
      expect(StatusUtils.isDurumEqual('uretimde', 'beklemede')).toBe(false);
    });

    test('should return false for null/undefined values', () => {
      expect(StatusUtils.isDurumEqual(null, 'uretimde')).toBe(false);
      expect(StatusUtils.isDurumEqual('uretimde', undefined)).toBe(false);
      expect(StatusUtils.isDurumEqual(null, null)).toBe(false);
    });
  });

  describe('normalizeDurumForGrouping', () => {
    test('should return exact match if found', async () => {
      IsEmriDurum.findOne
        .mockResolvedValueOnce({ durum_kodu: 'Uretimde' }) // exact match
        .mockResolvedValue(null);

      const result = await StatusUtils.normalizeDurumForGrouping('Uretimde');

      expect(result).toBe('Uretimde');
    });

    test('should return case insensitive match if exact not found', async () => {
      IsEmriDurum.findOne
        .mockResolvedValueOnce(null) // no exact match
        .mockResolvedValue({}); // second call

      const mockDurumlar = [
        { durum_kodu: 'URETIMDE' }, // Use ASCII instead of Turkish I
        { durum_kodu: 'BEKLEMEDE' }
      ];

      // Mock getActiveDurumlar
      jest.spyOn(StatusUtils, 'getActiveDurumlar').mockResolvedValue(mockDurumlar);

      const result = await StatusUtils.normalizeDurumForGrouping('uretimde');

      expect(result).toBe('URETIMDE');
    });

    test('should return original if no match found', async () => {
      IsEmriDurum.findOne.mockResolvedValue(null);
      jest.spyOn(StatusUtils, 'getActiveDurumlar').mockResolvedValue([]);

      const result = await StatusUtils.normalizeDurumForGrouping('yeni_durum');

      expect(result).toBe('yeni_durum');
    });

    test('should return original on error', async () => {
      IsEmriDurum.findOne.mockRejectedValue(new Error('Database error'));

      const result = await StatusUtils.normalizeDurumForGrouping('uretimde');

      expect(result).toBe('uretimde');
    });
  });

  describe('groupIsEmirleriByDurum', () => {
    test('should group is emirleri by durum', async () => {
      const mockDurumlar = [
        { durum_kodu: 'BEKLEMEDE' },
        { durum_kodu: 'ÜRETİMDE' }
      ];

      jest.spyOn(StatusUtils, 'getActiveDurumlar').mockResolvedValue(mockDurumlar);
      jest.spyOn(StatusUtils, 'normalizeDurumForGrouping').mockResolvedValue('BEKLEMEDE');

      const mockIsEmirleri = [
        { id: 1, durum: 'beklemede' },
        { id: 2, durum: 'beklemede' },
        { id: 3, durum: 'üretimde' }
      ];

      const result = await StatusUtils.groupIsEmirleriByDurum(mockIsEmirleri);

      expect(result).toEqual({
        'BEKLEMEDE': [
          { id: 1, durum: 'beklemede' },
          { id: 2, durum: 'beklemede' },
          { id: 3, durum: 'üretimde' }
        ],
        'ÜRETİMDE': []
      });
    });

    test('should handle unknown durums', async () => {
      const mockDurumlar = [
        { durum_kodu: 'BEKLEMEDE' },
        { durum_kodu: 'ÜRETİMDE' }
      ];

      jest.spyOn(StatusUtils, 'getActiveDurumlar').mockResolvedValue(mockDurumlar);
      jest.spyOn(StatusUtils, 'normalizeDurumForGrouping').mockResolvedValue('BILINMEYEN');

      const mockIsEmirleri = [
        { id: 1, durum: 'bilinmeyen_durum' }
      ];

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await StatusUtils.groupIsEmirleriByDurum(mockIsEmirleri);

      expect(result['BEKLEMEDE']).toContain(mockIsEmirleri[0]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Bilinmeyen durum "bilinmeyen_durum" beklemede grubuna atandı'
      );

      consoleSpy.mockRestore();
    });

    test('should throw error on failure', async () => {
      jest.spyOn(StatusUtils, 'getActiveDurumlar').mockRejectedValue(new Error('Database error'));

      await expect(StatusUtils.groupIsEmirleriByDurum([])).rejects.toThrow('Database error');
    });
  });
});