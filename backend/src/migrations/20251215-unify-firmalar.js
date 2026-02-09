'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. firmalar tablosuna tip alanını ekle
        await queryInterface.addColumn('firmalar', 'tip', {
            type: Sequelize.ENUM('ic', 'dis'),
            allowNull: true,
            after: 'aciklama'
        });

        // 2. Mevcut firmaları varsayılan olarak 'dis' olarak işaretle
        await queryInterface.sequelize.query(
            `UPDATE firmalar SET tip = 'dis' WHERE tip IS NULL`
        );

        // 3. sevkiyat_firmalari verilerini firmalar tablosuna aktar
        const [sevkiyatFirmalari] = await queryInterface.sequelize.query(
            `SELECT * FROM sevkiyat_firmalari`
        );

        for (const firma of sevkiyatFirmalari) {
            // Firma adının daha önce mevcut olup olmadığını kontrol et
            const [existingFirma] = await queryInterface.sequelize.query(
                `SELECT id FROM firmalar WHERE LOWER(TRIM(firma_adi)) = LOWER(TRIM(?))`,
                { replacements: [firma.firma_adi] }
            );

            if (!existingFirma.length) {
                // Yeni firma ekle
                await queryInterface.sequelize.query(
                    `INSERT INTO firmalar
                     (firma_adi, firma_kodu, tip, adres, telefon, yetkili_kisi, durum, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    {
                        replacements: [
                            firma.firma_adi,
                            `FRM-${firma.id.toString().padStart(5, '0')}`, // Benzersiz kod oluştur
                            firma.tip,
                            firma.adres,
                            firma.telefon,
                            firma.yetkili_kisi,
                            firma.aktif ? 'aktif' : 'pasif',
                            new Date(),
                            new Date()
                        ]
                    }
                );
            } else {
                // Mevcut firmayı güncelle (tip bilgisi varsa)
                await queryInterface.sequelize.query(
                    `UPDATE firmalar SET tip = ? WHERE id = ?`,
                    { replacements: [firma.tip, existingFirma[0].id] }
                );
            }
        }

        // 4. tedarik_talepleri tablosundaki firma_id referanslarını güncelle
        await queryInterface.sequelize.query(`
            UPDATE tedarik_talepleri
            SET firma_id = (
                SELECT f.id FROM firmalar f
                JOIN sevkiyat_firmalari sf ON LOWER(TRIM(f.firma_adi)) = LOWER(TRIM(sf.firma_adi))
                WHERE sf.id = tedarik_talepleri.firma_id
            )
            WHERE firma_id IN (SELECT id FROM sevkiyat_firmalari)
        `);

        // 5. sevkiyatlar tablosundaki firma_id referanslarını güncelle
        await queryInterface.sequelize.query(`
            UPDATE sevkiyatlar
            SET firma_id = (
                SELECT f.id FROM firmalar f
                JOIN sevkiyat_firmalari sf ON LOWER(TRIM(f.firma_adi)) = LOWER(TRIM(sf.firma_adi))
                WHERE sf.id = sevkiyatlar.firma_id
            )
            WHERE firma_id IN (SELECT id FROM sevkiyat_firmalari)
        `);

        // 6. Diğer olası tablolardaki referansları kontrol et ve güncelle
        // Fason işler tablosu
        await queryInterface.sequelize.query(`
            UPDATE fason_isleri
            SET firma_id = (
                SELECT f.id FROM firmalar f
                JOIN sevkiyat_firmalari sf ON LOWER(TRIM(f.firma_adi)) = LOWER(TRIM(sf.firma_adi))
                WHERE sf.id = fason_isleri.firma_id
            )
            WHERE firma_id IN (SELECT id FROM sevkiyat_firmalari)
        `);

        // 7. tip alanını NOT NULL yap
        await queryInterface.changeColumn('firmalar', 'tip', {
            type: Sequelize.ENUM('ic', 'dis'),
            allowNull: false,
            defaultValue: 'dis'
        });
    },

    down: async (queryInterface, Sequelize) => {
        // Geri alma işlemi (veri kaybı riskine karşı)
        console.warn('Geri alma işlemi veri kaybına neden olabilir. Lütfen yedek alınmış veritabanını kullanın.');

        // tip alanını kaldır
        await queryInterface.removeColumn('firmalar', 'tip');

        // Not: Bu geri alma işlemi veri birleştirme işlemini tamamen geri alamaz
        // Dönüşüm için veritabanı yedeği kullanılmalıdır
    }
};