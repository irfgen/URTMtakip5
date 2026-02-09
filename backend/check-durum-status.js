#!/usr/bin/env node

const { sequelize } = require('./src/config/database');

async function checkCurrentStatus() {
  console.log('🔍 Mevcut İş Emri Durum Analizi\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database bağlantısı başarılı\n');
    
    // Mevcut durum dağılımını kontrol et
    console.log('📊 Mevcut durum dağılımı:');
    const [currentStats] = await sequelize.query(`
      SELECT durum, COUNT(*) as count 
      FROM is_emirleri 
      GROUP BY durum 
      ORDER BY count DESC;
    `);
    
    if (currentStats.length === 0) {
      console.log('   📭 Hiç iş emri bulunamadı');
    } else {
      currentStats.forEach(stat => {
        console.log(`   - ${stat.durum}: ${stat.count} kayıt`);
      });
    }
    
    // Toplam kayıt sayısı
    const [totalCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM is_emirleri;
    `);
    console.log(`\n📋 Toplam iş emri sayısı: ${totalCount[0].total}`);
    
    // Tablo şemasını kontrol et
    console.log('\n🗂️ Durum kolonu şema bilgisi:');
    const [schemaInfo] = await sequelize.query(`
      PRAGMA table_info(is_emirleri);
    `);
    
    const durumColumn = schemaInfo.find(col => col.name === 'durum');
    if (durumColumn) {
      console.log(`   - Tip: ${durumColumn.type}`);
      console.log(`   - Varsayılan: ${durumColumn.dflt_value || 'Yok'}`);
      console.log(`   - NULL olabilir: ${durumColumn.notnull === 0 ? 'Evet' : 'Hayır'}`);
    }
    
    // Backup tablosunun varlığını kontrol et
    const [backupExists] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='is_emirleri_backup';
    `);
    
    console.log('\n🗄️ Backup durumu:');
    if (backupExists.length > 0) {
      console.log('   ⚠️  is_emirleri_backup tablosu zaten mevcut');
      console.log('   💡 Migration öncesi mevcut backup tablosunu kaldırmanız önerilir');
    } else {
      console.log('   ✅ Backup tablosu yok, migration için hazır');
    }
    
    // Migration log tablosunu kontrol et
    const [migrationLogExists] = await sequelize.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migration_logs';
    `);
    
    console.log('\n📝 Migration logs durumu:');
    if (migrationLogExists.length > 0) {
      const [migrationHistory] = await sequelize.query(`
        SELECT migration_name, executed_at, status 
        FROM migration_logs 
        WHERE migration_name = 'update_is_emri_durum_enum'
        ORDER BY executed_at DESC;
      `);
      
      if (migrationHistory.length > 0) {
        console.log('   ⚠️  Bu migration daha önce çalıştırılmış:');
        migrationHistory.forEach(log => {
          console.log(`   - ${log.executed_at}: ${log.status}`);
        });
      } else {
        console.log('   ✅ Migration logs tablosu var, bu migration daha önce çalıştırılmamış');
      }
    } else {
      console.log('   📋 Migration logs tablosu yok, migration sırasında oluşturulacak');
    }
    
    console.log('\n🎯 Migration önerisi:');
    if (currentStats.length > 0) {
      console.log('   📤 Mevcut veriler var, migration güvenli bir şekilde dönüştürülecek');
      console.log('   🔄 Önerilen komut: npm run migrate-durum');
    } else {
      console.log('   📭 Veri yok, migration sadece şema güncellemesi yapacak');
      console.log('   🔄 Önerilen komut: npm run migrate-durum');
    }
    
  } catch (error) {
    console.error('❌ Kontrol hatası:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkCurrentStatus();
