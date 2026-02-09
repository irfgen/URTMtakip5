/*
  Toplu Sevkiyat – DB Migration
  - sevkiyatlar.durum CHECK'e 'taslak' değerini ekler (tabloyu yeniden oluşturarak)
  - sevkiyat_resimler tablosuna kalem_id INTEGER sütunu ekler ve indeks oluşturur

  Notlar:
  - SQLite'ta mevcut CHECK constraint'i doğrudan güncelleyemediğimiz için
    geçici tablo (sevkiyatlar_new) üzerinden güvenli yeniden oluşturma yapılır.
  - kalem_id sütunu ADD COLUMN ile eklenir; referential integrity uygulama katmanında doğrulanacaktır.
*/

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

function run() {
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = OFF');
    db.run('BEGIN TRANSACTION');

    // 1) sevkiyatlar tablosunu 'taslak' durumunu destekleyecek şekilde yenile
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sevkiyatlar'", (err, row) => {
      if (err) {
        console.error('sqlite_master sorgu hatası:', err);
        rollback(db);
        return;
      }

      if (row) {
        // Eski şema bilgisini al
        db.all("PRAGMA table_info(sevkiyatlar)", (tiErr, columns) => {
          if (tiErr) {
            console.error('PRAGMA table_info(sevkiyatlar) hatası:', tiErr);
            rollback(db);
            return;
          }

          // Yeni tabloyu oluştur (taslak ekli CHECK)
          const createNew = `
            CREATE TABLE IF NOT EXISTS sevkiyatlar_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sevkiyat_no VARCHAR(50) NOT NULL UNIQUE,
              tip VARCHAR(10) NOT NULL CHECK (tip IN ('gelen', 'giden')),
              firma_id INTEGER NULL,
              lokasyon_id INTEGER NULL,
              nereden_lokasyon_id INTEGER NULL,
              nereye_lokasyon_id INTEGER NULL,
              tarih DATETIME NOT NULL,
              durum VARCHAR(20) NOT NULL DEFAULT 'beklemede' CHECK (durum IN ('taslak','beklemede','tamamlandi','iptal')),
              aciklama TEXT,
              olusturan_kullanici VARCHAR(255) NOT NULL,
              olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
              guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (firma_id) REFERENCES sevkiyat_firmalari(id) ON DELETE RESTRICT,
              FOREIGN KEY (lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT,
              FOREIGN KEY (nereden_lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT,
              FOREIGN KEY (nereye_lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT
            )
          `;

          db.run(createNew, (cErr) => {
            if (cErr) {
              console.error('sevkiyatlar_new oluşturma hatası:', cErr);
              rollback(db);
              return;
            }

            // Kolon adlarını sırayla kopyalamak için belirle
            const existingCols = columns.map(c => c.name);
            const commonCols = existingCols.filter(name => name !== undefined);
            const colList = commonCols.join(', ');

            const copySql = `INSERT INTO sevkiyatlar_new (${colList}) SELECT ${colList} FROM sevkiyatlar`;
            db.run(copySql, (copyErr) => {
              if (copyErr) {
                console.error('sevkiyatlar verilerini kopyalama hatası:', copyErr);
                rollback(db);
                return;
              }

              db.run('DROP TABLE sevkiyatlar', (dropErr) => {
                if (dropErr) {
                  console.error('Eski sevkiyatlar tablosunu düşürme hatası:', dropErr);
                  rollback(db);
                  return;
                }

                db.run('ALTER TABLE sevkiyatlar_new RENAME TO sevkiyatlar', (renameErr) => {
                  if (renameErr) {
                    console.error('Tabloyu yeniden adlandırma hatası:', renameErr);
                    rollback(db);
                    return;
                  }

                  // İndeksleri yeniden oluştur
                  db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_tarih ON sevkiyatlar(tarih)");
                  db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_tip ON sevkiyatlar(tip)");
                  db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_durum ON sevkiyatlar(durum)");
                  db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_firma ON sevkiyatlar(firma_id)");
                  db.run("CREATE INDEX IF NOT EXISTS idx_sevkiyatlar_lokasyon ON sevkiyatlar(lokasyon_id)");

                  console.log('✅ sevkiyatlar tablosu taslak desteği ile güncellendi');
                  continueResimlerMigration(db);
                });
              });
            });
          });
        });
      } else {
        console.log("ℹ️ 'sevkiyatlar' tablosu bulunamadı; atlanıyor.");
        continueResimlerMigration(db);
      }
    });
  });
}

function continueResimlerMigration(db) {
  // 2) sevkiyat_resimler tablosuna kalem_id sütunu ekle (yoksa)
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sevkiyat_resimler'", (err, row) => {
    if (err) {
      console.error('sqlite_master sorgu hatası (sevkiyat_resimler):', err);
      rollback(db);
      return;
    }

    if (!row) {
      console.log("ℹ️ 'sevkiyat_resimler' tablosu bulunamadı; atlanıyor.");
      commit(db);
      return;
    }

    db.all('PRAGMA table_info(sevkiyat_resimler)', (tiErr, columns) => {
      if (tiErr) {
        console.error('PRAGMA table_info(sevkiyat_resimler) hatası:', tiErr);
        rollback(db);
        return;
      }

      const hasKalemId = columns.some(c => c.name === 'kalem_id');
      const hasIsTemsil = columns.some(c => c.name === 'is_temsil');
      const hasTopluKalemId = columns.some(c => c.name === 'toplu_kalem_id');
      const afterKalemId = (next) => {
        const ensureIsTemsil = () => {
          if (!hasIsTemsil) {
            db.run('ALTER TABLE sevkiyat_resimler ADD COLUMN is_temsil INTEGER DEFAULT 0', (alt2Err) => {
              if (alt2Err) { console.error('is_temsil sütunu ekleme hatası:', alt2Err); rollback(db); return; }
              console.log('✅ sevkiyat_resimler.is_temsil sütunu eklendi');
              ensureTopluKalemId();
            });
          } else {
            console.log('ℹ️ sevkiyat_resimler.is_temsil zaten mevcut');
            ensureTopluKalemId();
          }
        };
        const ensureTopluKalemId = () => {
          if (!hasTopluKalemId) {
            db.run('ALTER TABLE sevkiyat_resimler ADD COLUMN toplu_kalem_id INTEGER', (alt3Err) => {
              if (alt3Err) { console.error('toplu_kalem_id sütunu ekleme hatası:', alt3Err); rollback(db); return; }
              console.log('✅ sevkiyat_resimler.toplu_kalem_id sütunu eklendi');
              createResimlerIndexes(db);
            });
          } else {
            console.log('ℹ️ sevkiyat_resimler.toplu_kalem_id zaten mevcut');
            createResimlerIndexes(db);
          }
        };
        ensureIsTemsil();
      };

      if (!hasKalemId) {
        db.run('ALTER TABLE sevkiyat_resimler ADD COLUMN kalem_id INTEGER', (altErr) => {
          if (altErr) {
            console.error('kalem_id sütunu ekleme hatası:', altErr);
            rollback(db);
            return;
          }

          console.log('✅ sevkiyat_resimler.kalem_id sütunu eklendi');
          afterKalemId();
        });
      } else {
        console.log('ℹ️ sevkiyat_resimler.kalem_id zaten mevcut');
        afterKalemId();
      }
    });
  });
}

// 3) Yeni toplu_sevkiyat ve toplu_sevkiyat_kalemleri tablolarını oluştur
function createTopluSevkiyatTables() {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    const createToplu = `
      CREATE TABLE IF NOT EXISTS toplu_sevkiyat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        toplu_no VARCHAR(50) NOT NULL UNIQUE,
        nereden_lokasyon_id INTEGER NULL,
        nereye_lokasyon_id INTEGER NULL,
        tarih DATETIME NOT NULL,
        durum VARCHAR(20) NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak','beklemede','tamamlandi','iptal')),
        aciklama TEXT,
        olusturan_kullanici VARCHAR(255) NOT NULL,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nereden_lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT,
        FOREIGN KEY (nereye_lokasyon_id) REFERENCES sevkiyat_lokasyonlari(id) ON DELETE RESTRICT
      )
    `;
    db.run(createToplu);

    const createTopluKalem = `
      CREATE TABLE IF NOT EXISTS toplu_sevkiyat_kalemleri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        toplu_id INTEGER NOT NULL,
        kalem_tipi VARCHAR(20) NULL,
        stok_karti_id INTEGER NULL,
        parca_kodu VARCHAR(255) NULL,
        adet INTEGER NOT NULL DEFAULT 1,
        birim_fiyati DECIMAL(10,2) NULL,
        toplam_fiyat DECIMAL(10,2) NULL,
        aciklama TEXT,
        olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (toplu_id) REFERENCES toplu_sevkiyat(id) ON DELETE CASCADE
      )
    `;
    db.run(createTopluKalem);

    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_tarih ON toplu_sevkiyat(tarih)");
    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_durum ON toplu_sevkiyat(durum)");
    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_nereden ON toplu_sevkiyat(nereden_lokasyon_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_nereye ON toplu_sevkiyat(nereye_lokasyon_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_kalem_toplu ON toplu_sevkiyat_kalemleri(toplu_id)");
    db.run("CREATE INDEX IF NOT EXISTS idx_toplu_kalem_tip ON toplu_sevkiyat_kalemleri(kalem_tipi)");

    db.close();
    console.log('✅ toplu_sevkiyat ve toplu_sevkiyat_kalemleri tabloları hazır');
  });
}

// 3.b) toplu_sevkiyat_kalemleri şemasını gevşet: kalem_tipi NULL olabilir (mevcut tabloda NOT NULL ise yeniden oluştur)
function relaxTopluKalemSchemaIfNeeded() {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.all("PRAGMA table_info(toplu_sevkiyat_kalemleri)", (err, cols) => {
      if (err) { db.close(); return; }
      const kalemTipiCol = (cols || []).find(c => c.name === 'kalem_tipi');
      if (kalemTipiCol && kalemTipiCol.notnull === 1) {
        // Recreate table with kalem_tipi NULL
        db.run('BEGIN TRANSACTION');
        const createNew = `
          CREATE TABLE IF NOT EXISTS toplu_sevkiyat_kalemleri_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            toplu_id INTEGER NOT NULL,
            kalem_tipi VARCHAR(20) NULL,
            stok_karti_id INTEGER NULL,
            parca_kodu VARCHAR(255) NULL,
            adet INTEGER NOT NULL DEFAULT 1,
            birim_fiyati DECIMAL(10,2) NULL,
            toplam_fiyat DECIMAL(10,2) NULL,
            aciklama TEXT,
            olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (toplu_id) REFERENCES toplu_sevkiyat(id) ON DELETE CASCADE
          )`;
        db.run(createNew, (cErr) => {
          if (cErr) { db.run('ROLLBACK'); db.close(); return; }
          const copySql = `INSERT INTO toplu_sevkiyat_kalemleri_new (id, toplu_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama, olusturma_tarihi, guncelleme_tarihi)
                           SELECT id, toplu_id, kalem_tipi, stok_karti_id, parca_kodu, adet, birim_fiyati, toplam_fiyat, aciklama, olusturma_tarihi, guncelleme_tarihi FROM toplu_sevkiyat_kalemleri`;
          db.run(copySql, (copyErr) => {
            if (copyErr) { db.run('ROLLBACK'); db.close(); return; }
            db.run('DROP TABLE toplu_sevkiyat_kalemleri', (dErr) => {
              if (dErr) { db.run('ROLLBACK'); db.close(); return; }
              db.run('ALTER TABLE toplu_sevkiyat_kalemleri_new RENAME TO toplu_sevkiyat_kalemleri', (rErr) => {
                if (rErr) { db.run('ROLLBACK'); db.close(); return; }
                db.run('CREATE INDEX IF NOT EXISTS idx_toplu_kalem_toplu ON toplu_sevkiyat_kalemleri(toplu_id)');
                db.run('CREATE INDEX IF NOT EXISTS idx_toplu_kalem_tip ON toplu_sevkiyat_kalemleri(kalem_tipi)');
                db.run('COMMIT');
                db.close();
                console.log('✅ toplu_sevkiyat_kalemleri şeması gevşetildi (kalem_tipi NULL)');
              });
            });
          });
        });
      } else {
        db.close();
      }
    });
  });
}

function createResimlerIndexes(db) {
  db.run('CREATE INDEX IF NOT EXISTS idx_sevkiyat_resimler_sevkiyat ON sevkiyat_resimler(sevkiyat_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sevkiyat_resimler_kalem ON sevkiyat_resimler(kalem_id)', (idxErr) => {
    if (idxErr) {
      console.error('idx_sevkiyat_resimler_kalem indeks oluşturma hatası:', idxErr);
      rollback(db);
      return;
    }
    db.run('CREATE INDEX IF NOT EXISTS idx_sevkiyat_resimler_kalem_temsil ON sevkiyat_resimler(kalem_id, is_temsil)');
    db.run('CREATE INDEX IF NOT EXISTS idx_sevkiyat_resimler_toplu_kalem ON sevkiyat_resimler(toplu_kalem_id)');
    console.log('✅ sevkiyat_resimler indeksleri hazır');
    commit(db);
  });
}

function rollback(db) {
  db.run('ROLLBACK', () => {
    db.run('PRAGMA foreign_keys = ON');
    db.close();
    console.error('❌ Migration geri alındı');
  });
}

function commit(db) {
  db.run('COMMIT', () => {
    db.run('PRAGMA foreign_keys = ON');
    db.close();
    console.log('✅ Migration başarıyla tamamlandı');
  });
}

if (require.main === module) {
  run();
  // ayrı connection ile oluştur
  createTopluSevkiyatTables();
  relaxTopluKalemSchemaIfNeeded();
}


