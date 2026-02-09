/**
 * İş Emri Durum Migration Script
 * Bu script iş emri durum sistemini 3 durumdan 9 duruma genişletir
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const migration = require('./migrations/20250602_update_is_emri_durum_values_only.js');

const dbPath = path.join(__dirname, 'database.sqlite');

async function runMigration() {
    console.log('🚀 İş Emri Durum Migration başlatılıyor...');
    console.log('� Veritabanı:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Veritabanı bağlantı hatası:', err.message);
            process.exit(1);
        }
        console.log('✅ Veritabanı bağlantısı başarılı');
    });

    try {
        await migration.runMigration(db);
        console.log('🎉 Migration başarıyla tamamlandı!');
        console.log('');
        console.log('📋 Yapılan değişiklikler:');
        console.log('   - Eski durumlar yeni sisteme uyarlandı');
        console.log('   - Yeni sistem: sipariş verilecek, sparişte, beklemede, iptal, freze, torna, 5 metre, 6 metre, kaynak');
        console.log('');
        console.log('⚠️  Sonraki adımlar:');
        console.log('   1. Sequelize modelini güncelleyin (src/models/IsEmri.js)');
        console.log('   2. Frontend kanban boardunu 9 kolona genişletin');
        console.log('   3. Backend controller validation\'ını güncelleyin');
    } catch (error) {
        console.error('❌ Migration hatası:', error.message);
        console.log('� Rollback deneniyor...');
        
        try {
            await migration.rollbackMigration(db);
            console.log('✅ Rollback başarılı');
        } catch (rollbackError) {
            console.error('❌ Rollback hatası:', rollbackError.message);
            console.error('⚠️ Manuel müdahale gerekebilir!');
        }
        
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Veritabanı kapatma hatası:', err.message);
            } else {
                console.log('✅ Veritabanı bağlantısı kapatıldı');
            }
        });
    }
}

async function rollbackMigration() {
    console.log('🔄 İş Emri Durum Migration Rollback başlatılıyor...');
    console.log('📍 Veritabanı:', dbPath);
    
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Veritabanı bağlantı hatası:', err.message);
            process.exit(1);
        }
        console.log('✅ Veritabanı bağlantısı başarılı');
    });

    try {
        await migration.rollbackMigration(db);
        console.log('🎉 Rollback başarıyla tamamlandı!');
    } catch (error) {
        console.error('❌ Rollback hatası:', error.message);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Veritabanı kapatma hatası:', err.message);
            } else {
                console.log('✅ Veritabanı bağlantısı kapatıldı');
            }
        });
    }
}

// Command line argument kontrolü
const command = process.argv[2];

if (command === 'rollback') {
    rollbackMigration();
} else {
    runMigration();
}
