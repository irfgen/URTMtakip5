const {
  PART_NAME_PATTERNS,
  MATERIAL_PATTERNS,
  PROJECT_NAME_PATTERNS,
  DRAWING_NUMBER_PATTERNS,
  REVISION_PATTERNS,
  SCALE_PATTERNS,
  DATE_PATTERNS,
  DIMENSION_PATTERNS,
  TOLERANCE_PATTERNS,
  STANDARD_PATTERNS,
  SURFACE_PATTERNS,
  HEAT_TREATMENT_PATTERNS
} = require('../../src/utils/textPatterns');

describe('Text Pattern Constants', () => {
  describe('PART_NAME_PATTERNS', () => {
    test('should match Turkish part name patterns', () => {
      const text = 'PARÇA ADI: ANA KAPAK';
      const matches = text.match(PART_NAME_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('ANA KAPAK');
    });

    test('should match English part name patterns', () => {
      const text = 'PART NAME: MAIN COVER';
      const matches = text.match(PART_NAME_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('MAIN COVER');
    });

    test('should match assembly patterns', () => {
      const text = 'MONTAJ: GRUP PLAKASI';
      const matches = text.match(PART_NAME_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });

    test('should match common Turkish part names', () => {
      const text = 'ÇELİK PLAKA';
      const matches = text.match(PART_NAME_PATTERNS[4]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('ÇELİK PLAKA');
    });
  });

  describe('MATERIAL_PATTERNS', () => {
    test('should match Turkish material labels', () => {
      const text = 'MALZEME: St 37.2';
      const matches = text.match(MATERIAL_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('St 37.2');
    });

    test('should match steel grades', () => {
      const text = 'Material: St 37-2';
      const matches = text.match(MATERIAL_PATTERNS[2]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('St 37-2');
    });

    test('should match DIN standards', () => {
      const text = 'DIN 17100';
      const matches = text.match(MATERIAL_PATTERNS[4]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('DIN 17100');
    });

    test('should match common Turkish materials', () => {
      const text = 'PASLANMAZ ÇELİK';
      const matches = text.match(MATERIAL_PATTERNS[8]);
      expect(matches).toBeTruthy();
    });
  });

  describe('PROJECT_NAME_PATTERNS', () => {
    test('should match project name patterns', () => {
      const text = 'PROJE ADI: TEST PROJESİ';
      const matches = text.match(PROJECT_NAME_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('TEST PROJESİ');
    });

    test('should match drawing name patterns', () => {
      const text = 'ÇİZİM ADI: DETAY ÇİZİMİ';
      const matches = text.match(PROJECT_NAME_PATTERNS[2]);
      expect(matches).toBeTruthy();
    });
  });

  describe('DRAWING_NUMBER_PATTERNS', () => {
    test('should match drawing number patterns', () => {
      const text = 'ÇİZİM NO: DRW-001-A';
      const matches = text.match(DRAWING_NUMBER_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('DRW-001-A');
    });

    test('should match DWG NO patterns', () => {
      const text = 'DWG NO: 12345';
      const matches = text.match(DRAWING_NUMBER_PATTERNS[0]);
      expect(matches).toBeTruthy();
    });
  });

  describe('REVISION_PATTERNS', () => {
    test('should match revision patterns', () => {
      const text = 'REVİZYON: A';
      const matches = text.match(REVISION_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('A');
    });

    test('should match version patterns', () => {
      const text = 'VERSION: 1.0';
      const matches = text.match(REVISION_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });
  });

  describe('SCALE_PATTERNS', () => {
    test('should match scale patterns', () => {
      const text = 'ÖLÇEK: 1:10';
      const matches = text.match(SCALE_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('1:10');
    });

    test('should match scale with abbreviation', () => {
      const text = 'SC.: 1:5';
      const matches = text.match(SCALE_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });
  });

  describe('DATE_PATTERNS', () => {
    test('should match date patterns with label', () => {
      const text = 'TARİH: 19.10.2025';
      const matches = text.match(DATE_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('19.10.2025');
    });

    test('should match date patterns without label', () => {
      const text = 'Sadece bir tarih: 19/10/2025';
      const matches = text.match(DATE_PATTERNS[1]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('19/10/2025');
    });
  });

  describe('DIMENSION_PATTERNS', () => {
    test('should match dimension with unit', () => {
      const text = 'Uzunluk: 150mm';
      const matches = text.match(DIMENSION_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('150mm');
    });

    test('should match diameter symbol', () => {
      const text = 'Ø 50mm';
      const matches = text.match(DIMENSION_PATTERNS[1]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('Ø 50');
    });

    test('should match radius symbol', () => {
      const text = 'R 25mm';
      const matches = text.match(DIMENSION_PATTERNS[2]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('R 25');
    });
  });

  describe('TOLERANCE_PATTERNS', () => {
    test('should match plus-minus tolerance', () => {
      const text = '± 0.1mm';
      const matches = text.match(TOLERANCE_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toContain('± 0.1');
    });

    test('should match plus-minus range', () => {
      const text = '+0.05 -0.02';
      const matches = text.match(TOLERANCE_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });
  });

  describe('STANDARD_PATTERNS', () => {
    test('should match ISO standards', () => {
      const text = 'ISO 9001';
      const matches = text.match(STANDARD_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('ISO 9001');
    });

    test('should match ASTM standards', () => {
      const text = 'ASTM A36';
      const matches = text.match(STANDARD_PATTERNS[3]);
      expect(matches).toBeTruthy();
    });
  });

  describe('SURFACE_PATTERNS', () => {
    test('should match Ra surface finish', () => {
      const text = 'Ra 1.6';
      const matches = text.match(SURFACE_PATTERNS[0]);
      expect(matches).toBeTruthy();
      expect(matches[0]).toBe('Ra 1.6');
    });

    test('should match Rz surface finish', () => {
      const text = 'Rz 6.3';
      const matches = text.match(SURFACE_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });

    test('should match micron values', () => {
      const text = '3.2 μm';
      const matches = text.match(SURFACE_PATTERNS[2]);
      expect(matches).toBeTruthy();
    });
  });

  describe('HEAT_TREATMENT_PATTERNS', () => {
    test('should match normalization', () => {
      const text = 'NORMALLEŞTİRİLMİŞ';
      const matches = text.match(HEAT_TREATMENT_PATTERNS[0]);
      expect(matches).toBeTruthy();
    });

    test('should match annealing', () => {
      const text = 'TAVLANMIŞ';
      const matches = text.match(HEAT_TREATMENT_PATTERNS[1]);
      expect(matches).toBeTruthy();
    });

    test('should match hardening', () => {
      const text = 'SERTLEŞTİRİLMİŞ';
      const matches = text.match(HEAT_TREATMENT_PATTERNS[2]);
      expect(matches).toBeTruthy();
    });
  });
});