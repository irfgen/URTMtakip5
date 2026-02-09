const sqlite3 = require('sqlite3').verbose();
const { sequelize } = require('../config/database');
const Tezgah = require('../models/Tezgah');
const Parca = require('../models/Parca');
const IsEmri = require('../models/IsEmri');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
console.log('SQLite DB path:', dbPath);

const oldDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('SQLite bağlantı hatası:', err);
    process.exit(1);
  }
  console.log('SQLite veritabanına bağlantı başarılı');
});

async function transferTable(query, Model, transform = (x) => x) {
  const rows = await new Promise((resolve, reject) => {
    oldDb.all(query, [], (err, rows) => {
      if (err) reject(err);
      console.log(`${query} için okunan kayıt sayısı:`, rows?.length || 0);
      resolve(rows || []);
    });
  });

  let success = 0;
  for (const row of rows) {
    try {
      await Model.create(transform(row));
      success++;
    } catch (err) {
      console.error(`Aktarım hatası (${Model.name}):`, row, err.message);
    }
  }
  console.log(`${Model.name} için ${success}/${rows.length} kayıt aktarıldı`);
}

async function transferData() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL veritabanına bağlantı başarılı');

    // Tabloları temizle
    await Promise.all([
      Tezgah.destroy({ truncate: true, cascade: true }),
      Parca.destroy({ truncate: true, cascade: true }),
      IsEmri.destroy({ truncate: true, cascade: true })
    ]);

    // Tezgah verilerini aktar
    await transferTable('SELECT * FROM tezgahlar', Tezgah, (row) => ({
      tezgah_id: row.tezgah_id,
      tezgah_tanimi: row.tezgah_tanimi,
      tip: row.tip?.toLowerCase(),
      calisma_durumu: row.calisma_durumu?.toLowerCase(),
      pozisyon_x: row.pozisyon_x,
      pozisyon_y: row.pozisyon_y,
      son_bakim_tarihi: row.son_bakim_tarihi,
      sonraki_bakim_tarihi: row.sonraki_bakim_tarihi,
      is_emirleri: row.is_emirleri || [],
      is_emirleri_gecmisi: row.is_emirleri_gecmisi || []
    }));

    // Parça verilerini aktar
    await transferTable('SELECT * FROM parcalar', Parca, (row) => ({
      parca_kodu: row.parca_kodu,
      stok_adeti: row.stok_adeti || 0,
      tedarik_bedeli: row.tedarik_bedeli || 0,
      imal_mi: Boolean(row.imal_mi),
      ham_malzeme_cinsi: row.ham_malzeme_cinsi || '',
      ham_malzeme_olculeri: row.ham_malzeme_olculeri || '',
      fason_maliyeti: row.fason_maliyeti || 0,
      sirket_ici_maliyeti: row.sirket_ici_maliyeti || 0
    }));

    // İş emirlerini aktar
    await transferTable('SELECT * FROM is_emirleri', IsEmri, (row) => ({
      is_emri_no: row.is_emri_no,
      is_adi: row.is_adi,
      plan_liste_no: row.plan_liste_no,
      adet: row.adet,
      malzeme: row.malzeme,
      teslim_tarihi: row.teslim_tarihi,
      oncelik: row.oncelik?.toLowerCase(),
      durum: row.durum,
      aciklama: row.aciklama,
      hareketler: row.hareketler || [],
      tezgah_bilgisi: row.tezgah_bilgisi
    }));

    console.log('Veri transfer işlemi tamamlandı');
  } catch (error) {
    console.error('Veri transfer hatası:', error);
  } finally {
    oldDb.close();
  }
}

transferData().catch(err => {
  console.error('Transfer işlemi başarısız:', err);
  process.exit(1);
});