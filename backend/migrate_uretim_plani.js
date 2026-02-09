const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Veritabanı bağlantısı
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Eski uretim_plani tablosu modeli
const UretimPlani = sequelize.define('uretim_plani', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  makina_id: DataTypes.UUID,
  miktar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  durum: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Planlandı'
  },
  aciklama: DataTypes.TEXT,
  bom_snapshot: DataTypes.JSON,
  kritik_stok_uyarisi: DataTypes.JSON,
  ozel_liste_adi: DataTypes.STRING,
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'uretim_plani',
  timestamps: false
});

// Yeni uretim_planlari tablosu modeli
const UretimPlanlari = sequelize.define('uretim_planlari', {
  uretim_plani_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uretim_plani_adi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_emirleri_listesi: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  teslim_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  durum: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Planlandı'
  },
  aciklama: DataTypes.TEXT,
  olusturma_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  },
  guncelleme_tarihi: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'uretim_planlari',
  timestamps: false
});

async function migrateData() {
  try {
    // Veritabanı bağlantısını test et
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    // Eski tablodaki verileri al
    const eskiPlanlar = await UretimPlani.findAll();
    console.log(`${eskiPlanlar.length} adet üretim planı bulundu.`);

    for (const eskiPlan of eskiPlanlar) {
      try {
        // BOM snapshot'tan iş emirlerini çıkar
        const bomSnapshot = eskiPlan.bom_snapshot || {};
        const isEmirleri = bomSnapshot.is_emirleri || [];

        // Yeni formata dönüştür
        const isEmirleriListesi = isEmirleri.map(ie => ({
          is_emri_id: ie.is_emri_id,
          is_emri_no: ie.is_emri_no,
          is_adi: ie.is_adi,
          parca_kodu: ie.parca_kodu,
          adet: ie.adet,
          durum: ie.durum
        }));

        // Yeni tabloya ekle
        await UretimPlanlari.create({
          uretim_plani_adi: eskiPlan.ozel_liste_adi || eskiPlan.aciklama || `Plan ${eskiPlan.id}`,
          is_emirleri_listesi: JSON.stringify(isEmirleriListesi),
          teslim_tarihi: eskiPlan.teslim_tarihi,
          durum: eskiPlan.durum === 'aktif' ? 'Üretimde' : 'Planlandı',
          aciklama: eskiPlan.aciklama,
          olusturma_tarihi: eskiPlan.olusturma_tarihi,
          guncelleme_tarihi: eskiPlan.guncelleme_tarihi
        });

        console.log(`Plan "${eskiPlan.ozel_liste_adi || eskiPlan.aciklama}" başarıyla aktarıldı.`);

      } catch (error) {
        console.error(`Plan ${eskiPlan.id} aktarılırken hata:`, error.message);
      }
    }

    console.log('Veri aktarımı tamamlandı.');

    // Sonuçları kontrol et
    const yeniPlanlar = await UretimPlanlari.findAll();
    console.log(`Yeni tabloda ${yeniPlanlar.length} adet plan var.`);

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await sequelize.close();
  }
}

// Scripti çalıştır
migrateData();