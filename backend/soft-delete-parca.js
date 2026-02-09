// Script to safely delete a part and its related records
// Usage: node soft-delete-parca.js <parca_kodu>

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbPath = path.join(__dirname, 'database.sqlite');

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Connect to database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// Define required models
const Parca = sequelize.define('Parca', {
  parcaKodu: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: 'parca_kodu'
  }
}, {
  tableName: 'parcalar',
  timestamps: true
});

const IsEmri = sequelize.define('IsEmri', {
  is_emri_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'is_emirleri',
  timestamps: true
});

const FasonIsEmri = sequelize.define('FasonIsEmri', {
  fason_is_emri_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'fason_is_emirleri',
  timestamps: true
});

const FasonTeklif = sequelize.define('FasonTeklif', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'fason_teklifler',
  timestamps: true
});

const GrupParca = sequelize.define('GrupParca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  grup_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parca_kodu: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'grup_parcalar',
  timestamps: true
});

async function findReferences(parcaKodu) {
  try {
    // Check each related table for references
    const isEmirleri = await IsEmri.findAll({
      where: { parca_kodu: parcaKodu }
    });

    const fasonIsEmirleri = await FasonIsEmri.findAll({
      where: { parca_kodu: parcaKodu }
    });

    const fasonTeklifler = await FasonTeklif.findAll({
      where: { parca_kodu: parcaKodu }
    });

    const grupParcalar = await GrupParca.findAll({
      where: { parca_kodu: parcaKodu }
    });

    return {
      isEmirleri,
      fasonIsEmirleri,
      fasonTeklifler,
      grupParcalar
    };
  } catch (error) {
    console.error('Referanslar kontrol edilirken hata:', error);
    throw error;
  }
}

async function deleteParca(parcaKodu, force = false) {
  try {
    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Check if part exists
      const parca = await Parca.findByPk(parcaKodu, { transaction });
      if (!parca) {
        console.error(`Parça bulunamadı: ${parcaKodu}`);
        await transaction.rollback();
        return {
          basarili: false,
          mesaj: `Parça bulunamadı: ${parcaKodu}`
        };
      }

      // Check references
      const references = await findReferences(parcaKodu);
      
      // Count number of references
      const referenceCount = 
        references.isEmirleri.length + 
        references.fasonIsEmirleri.length + 
        references.fasonTeklifler.length + 
        references.grupParcalar.length;

      console.log(`${parcaKodu} için toplam ${referenceCount} referans bulundu:`);
      console.log(`- İş emirleri: ${references.isEmirleri.length}`);
      console.log(`- Fason iş emirleri: ${references.fasonIsEmirleri.length}`);
      console.log(`- Fason teklifler: ${references.fasonTeklifler.length}`);
      console.log(`- Grup ilişkileri: ${references.grupParcalar.length}`);

      if (referenceCount > 0 && !force) {
        console.error(`Bu parça başka kayıtlarda kullanılmaktadır. Silmek için force=true parametresi gerekli.`);
        await transaction.rollback();
        return {
          basarili: false,
          mesaj: `Bu parça başka kayıtlarda kullanılmaktadır. Silmek için force parametresi gerekli.`,
          referanslar: {
            isEmirleriSayisi: references.isEmirleri.length,
            fasonIsEmirleriSayisi: references.fasonIsEmirleri.length,
            fasonTekliflerSayisi: references.fasonTeklifler.length,
            grupParcalarSayisi: references.grupParcalar.length
          }
        };
      }

      // If force=true, delete all references
      if (force) {
        // Delete grup_parcalar references (junction table)
        if (references.grupParcalar.length > 0) {
          console.log(`${references.grupParcalar.length} grup ilişkisi siliniyor...`);
          await GrupParca.destroy({
            where: { parca_kodu: parcaKodu },
            transaction
          });
        }

        // Delete fason teklifler
        if (references.fasonTeklifler.length > 0) {
          console.log(`${references.fasonTeklifler.length} fason teklif siliniyor...`);
          await FasonTeklif.destroy({
            where: { parca_kodu: parcaKodu },
            transaction
          });
        }

        // Delete fason iş emirleri
        if (references.fasonIsEmirleri.length > 0) {
          console.log(`${references.fasonIsEmirleri.length} fason iş emri siliniyor...`);
          await FasonIsEmri.destroy({
            where: { parca_kodu: parcaKodu },
            transaction
          });
        }

        // Update iş emirleri to remove parca_kodu reference
        if (references.isEmirleri.length > 0) {
          console.log(`${references.isEmirleri.length} iş emrinde parça referansı kaldırılıyor...`);
          await IsEmri.update(
            { parca_kodu: null },
            { 
              where: { parca_kodu: parcaKodu },
              transaction
            }
          );
        }
      }

      // Finally delete the part
      const deletedCount = await Parca.destroy({
        where: { parcaKodu: parcaKodu },
        transaction
      });

      if (deletedCount === 0) {
        console.error(`Parça silinemedi: ${parcaKodu}`);
        await transaction.rollback();
        return {
          basarili: false,
          mesaj: `Parça silinemedi: ${parcaKodu}`
        };
      }

      // Commit transaction
      await transaction.commit();
      
      return {
        basarili: true,
        mesaj: `Parça başarıyla silindi: ${parcaKodu}`,
        silinenReferanslar: force ? {
          isEmirleriGuncellendi: references.isEmirleri.length,
          fasonIsEmirleriSilindi: references.fasonIsEmirleri.length,
          fasonTekliflerSilindi: references.fasonTeklifler.length,
          grupIliskileriSilindi: references.grupParcalar.length
        } : {}
      };
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Parça silinirken hata:', error);
    return {
      basarili: false,
      mesaj: `Parça silinirken hata oluştu: ${error.message}`
    };
  }
}

async function main() {
  try {
    // Get part code from command line argument
    const parcaKodu = process.argv[2];
    const force = process.argv.includes('--force');
    
    if (!parcaKodu) {
      console.error('Parça kodu belirtilmedi. Kullanım: node soft-delete-parca.js <parca_kodu> [--force]');
      process.exit(1);
    }

    console.log(`${parcaKodu} kodlu parça ${force ? 'ZORLA ' : ''}siliniyor...`);
    
    const result = await deleteParca(parcaKodu, force);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.basarili) {
      console.log('İşlem başarıyla tamamlandı.');
    } else {
      console.error('İşlem başarısız: ' + result.mesaj);
      process.exit(1);
    }
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// If this script is run directly
if (require.main === module) {
  main();
} else {
  // If imported as a module, export the deleteParca function
  module.exports = { deleteParca, findReferences };
}
