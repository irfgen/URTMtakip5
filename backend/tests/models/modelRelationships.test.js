const { sequelize } = require('../src/models');
const Makina = require('../src/models/Makina');
const MakinaSinifi = require('../src/models/MakinaSinifi');
const Bom = require('../src/models/Bom');
const Parca = require('../src/models/Parca');
const StokKarti = require('../src/models/StokKarti');
const IsEmri = require('../src/models/IsEmri');
const Tezgah = require('../src/models/Tezgah');

describe('Model Relationships', () => {
  beforeAll(async () => {
    // Force sync to create tables
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Makina and MakinaSinifi Relationship', () => {
    test('should create makina with makina sinifi', async () => {
      // Create makina sinifi
      const makinaSinifi = await MakinaSinifi.create({
        ad: 'Test Sınıfı',
        aciklama: 'Test açıklama',
        aktif: true
      });

      // Create makina associated with sinif
      const makina = await Makina.create({
        makina_adi: 'Test Makina',
        makina_sinifi_id: makinaSinifi.id,
        aktif: true
      });

      // Test association
      const makinaWithSinif = await Makina.findOne({
        where: { id: makina.id },
        include: [{ model: MakinaSinifi, as: 'makinaSinifi' }]
      });

      expect(makinaWithSinif.makinaSinifi).toBeDefined();
      expect(makinaWithSinif.makinaSinifi.ad).toBe('Test Sınıfı');
    });

    test('should get all makinalar for a makina sinifi', async () => {
      const makinaSinifi = await MakinaSinifi.findOne({
        where: { ad: 'Test Sınıfı' }
      });

      const makinalar = await MakinaSinifi.findOne({
        where: { id: makinaSinifi.id },
        include: [{ model: Makina, as: 'makinalar' }]
      });

      expect(makinalar.makinalar).toBeDefined();
      expect(makinalar.makinalar.length).toBeGreaterThan(0);
    });
  });

  describe('Makina and Bom Many-to-Many Relationship', () => {
    test('should associate multiple boms with a makina', async () => {
      // Create test bom
      const bom = await Bom.create({
        bom_adi: 'Test BOM',
        aciklama: 'Test BOM açıklama',
        aktif: true
      });

      // Get existing makina
      const makina = await Makina.findOne();

      // Associate bom with makina
      await makina.addBom(bom);

      // Test association
      const makinaWithBoms = await Makina.findOne({
        where: { id: makina.id },
        include: [{ model: Bom, as: 'boms' }]
      });

      expect(makinaWithBoms.boms).toBeDefined();
      expect(makinaWithBoms.boms.length).toBeGreaterThan(0);
      expect(makinaWithBoms.boms[0].bom_adi).toBe('Test BOM');
    });

    test('should associate multiple makinalar with a bom', async () => {
      // Create another makina
      const makinaSinifi = await MakinaSinifi.findOne();
      const yeniMakina = await Makina.create({
        makina_adi: 'Yeni Test Makina',
        makina_sinifi_id: makinaSinifi.id,
        aktif: true
      });

      // Get existing bom
      const bom = await Bom.findOne({ where: { bom_adi: 'Test BOM' } });

      // Associate makina with bom
      await bom.addMakina(yeniMakina);

      // Test association
      const bomWithMakinalar = await Bom.findOne({
        where: { id: bom.id },
        include: [{ model: Makina, as: 'makinalar' }]
      });

      expect(bomWithMakinalar.makinalar).toBeDefined();
      expect(bomWithMakinalar.makinalar.length).toBeGreaterThan(1);
    });
  });

  describe('Bom and Parca Relationship', () => {
    test('should create bom with associated parcalar', async () => {
      // Create test parca
      const parca = await Parca.create({
        parca_adi: 'Test Parça',
        parca_kodu: 'TP001',
        birim: 'ADET',
        stok_adeti: 100,
        kritik_stok: 10,
        imalMi: true
      });

      // Get existing bom
      const bom = await Bom.findOne();

      // Associate parca with bom
      await bom.addParca(parca, {
        through: { miktar: 5 }
      });

      // Test association
      const bomWithParcalar = await Bom.findOne({
        where: { id: bom.id },
        include: [{ model: Parca, as: 'parcalar' }]
      });

      expect(bomWithParcalar.parcalar).toBeDefined();
      expect(bomWithParcalar.parcalar.length).toBeGreaterThan(0);
      expect(bomWithParcalar.parcalar[0].parca_adi).toBe('Test Parça');
    });
  });

  describe('Parca and StokKarti Relationship', () => {
    test('should associate stok karti with parca', async () => {
      // Get existing parca
      const parca = await Parca.findOne({ where: { parca_kodu: 'TP001' } });

      // Create stok karti
      const stokKarti = await StokKarti.create({
        stok_kodu: 'SK001',
        parca_id: parca.id,
        giren: 50,
        cikan: 10,
        mevcut: 40,
        tarih: new Date(),
        aciklama: 'Test stok hareketi'
      });

      // Test association
      const parcaWithStok = await Parca.findOne({
        where: { id: parca.id },
        include: [{ model: StokKarti, as: 'stokKartlari' }]
      });

      expect(parcaWithStok.stokKartlari).toBeDefined();
      expect(parcaWithStok.stokKartlari.length).toBeGreaterThan(0);
      expect(parcaWithStok.stokKartlari[0].stok_kodu).toBe('SK001');
    });
  });

  describe('IsEmri and Tezgah Relationship', () => {
    test('should create is emri associated with tezgah', async () => {
      // Create test tezgah
      const tezgah = await Tezgah.create({
        tezgah_adi: 'Test Tezgah',
        tezgah_kodu: 'TT001',
        aktif: true
      });

      // Create is emri
      const isEmri = await IsEmri.create({
        is_emri_no: 'IE001',
        tezgah_id: tezgah.id,
        parca_id: 1,
        miktar: 10,
        durum: 'beklemede',
        baslangic_tarihi: new Date(),
        bitis_tarihi: new Date()
      });

      // Test association
      const isEmriWithTezgah = await IsEmri.findOne({
        where: { id: isEmri.id },
        include: [{ model: Tezgah, as: 'tezgah' }]
      });

      expect(isEmriWithTezgah.tezgah).toBeDefined();
      expect(isEmriWithTezgah.tezgah.tezgah_adi).toBe('Test Tezgah');
    });

    test('should get all is emirleri for a tezgah', async () => {
      const tezgah = await Tezgah.findOne({ where: { tezgah_kodu: 'TT001' } });

      const tezgahWithIsEmirleri = await Tezgah.findOne({
        where: { id: tezgah.id },
        include: [{ model: IsEmri, as: 'isEmirleri' }]
      });

      expect(tezgahWithIsEmirleri.isEmirleri).toBeDefined();
      expect(tezgahWithIsEmirleri.isEmirleri.length).toBeGreaterThan(0);
    });
  });

  describe('Cascade Delete Tests', () => {
    test('should not delete associated makinalar when makina sinifi is deleted', async () => {
      // Create new makina sinifi
      const makinaSinifi = await MakinaSinifi.create({
        ad: 'Silinecek Sınıf',
        aktif: true
      });

      // Create associated makina
      const makina = await Makina.create({
        makina_adi: 'Silinecek Makina',
        makina_sinifi_id: makinaSinifi.id,
        aktif: true
      });

      // Delete makina sinifi
      await makinaSinifi.destroy();

      // Check if makina still exists but with null sinifi_id
      const deletedMakina = await Makina.findOne({ where: { id: makina.id } });
      expect(deletedMakina).toBeTruthy();
      expect(deletedMakina.makina_sinifi_id).toBeNull();
    });
  });
});