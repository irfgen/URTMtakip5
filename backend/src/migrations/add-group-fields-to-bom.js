const { sequelize } = require('../config/database');

async function addGroupFieldsToBom() {
  try {
    console.log('Starting migration: Adding group fields to BOM table...');

    // Check if columns exist before adding
    const [tableInfo] = await sequelize.query("PRAGMA table_info(boms)");

    const columns = {};
    tableInfo.forEach(col => {
      columns[col.name] = true;
    });

    // Add new columns to boms table (one by one for SQLite compatibility)
    if (!columns.grup_tipi) {
      await sequelize.query(`
        ALTER TABLE boms
        ADD COLUMN grup_tipi VARCHAR(20) DEFAULT 'standard'
      `);
      console.log('✓ Added grup_tipi column');
    } else {
      console.log('✓ grup_tipi column already exists');
    }

    if (!columns.marka) {
      await sequelize.query(`
        ALTER TABLE boms
        ADD COLUMN marka VARCHAR(100)
      `);
      console.log('✓ Added marka column');
    } else {
      console.log('✓ marka column already exists');
    }

    if (!columns.ozel_etiket) {
      await sequelize.query(`
        ALTER TABLE boms
        ADD COLUMN ozel_etiket VARCHAR(255)
      `);
      console.log('✓ Added ozel_etiket column');
    } else {
      console.log('✓ ozel_etiket column already exists');
    }

    if (!columns.gorsel_ikon) {
      await sequelize.query(`
        ALTER TABLE boms
        ADD COLUMN gorsel_ikon VARCHAR(50)
      `);
      console.log('✓ Added gorsel_ikon column');
    } else {
      console.log('✓ gorsel_ikon column already exists');
    }

    // Set default values for existing records
    await sequelize.query(`
      UPDATE boms
      SET grup_tipi = 'standard'
      WHERE grup_tipi IS NULL
    `);

    console.log('✓ Added group fields to boms table');

    console.log('✓ Group fields added (constraint handled at model level)');

    // Create special BOM records for ADVANTAGE machines
    await createAdvantageGroups();

    console.log('✅ Migration completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

async function createAdvantageGroups() {
  try {
    console.log('Creating ADVANTAGE machine groups...');

    // Get ADVANTAGE machines
    const [advantageMachines] = await sequelize.query(`
      SELECT DISTINCT m.makina_id, m.name, ms.ad as sinif_adi
      FROM makinalar m
      JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
      WHERE m.name LIKE 'ADVANTAGE%'
      AND m.durum = 'aktif'
    `);

    console.log(`Found ${advantageMachines.length} ADVANTAGE machines`);

    for (const machine of advantageMachines) {
      // Check if group already exists
      const [existingGroups] = await sequelize.query(`
        SELECT id FROM boms
        WHERE marka = 'ADVANTAGE'
        AND ozel_etiket = 'Avantaj Makinaları'
        AND bom_kodu = 'AV-STANDART'
      `);

      if (existingGroups.length === 0) {
        // Create standard ADVANTAGE group
        await sequelize.query(`
          INSERT INTO boms (
            bom_kodu,
            name,
            bom_aciklamasi,
            versiyon,
            grup_tipi,
            marka,
            ozel_etiket,
            gorsel_ikon,
            aktif,
            createdAt,
            updatedAt
          ) VALUES (
            'AV-STANDART',
            'Avantaj Standart Grubu',
            'Tüm ADVANTAGE makineleri için standart üretim grubu',
            '1.0',
            'marka',
            'ADVANTAGE',
            'Avantaj Makinaları',
            'brand',
            true,
            datetime('now'),
            datetime('now')
          )
        `);

        const [newGroup] = await sequelize.query(`
          SELECT id FROM boms
          WHERE bom_kodu = 'AV-STANDART'
          AND marka = 'ADVANTAGE'
          ORDER BY id DESC
          LIMIT 1
        `);

        const groupId = newGroup[0].id;

        // Associate machines with this group (check table structure first)
        const [makinaBomInfo] = await sequelize.query("PRAGMA table_info(makina_bom)");
        const makinaBomColumns = {};
        makinaBomInfo.forEach(col => {
          makinaBomColumns[col.name] = true;
        });

        let insertQuery;
        if (makinaBomColumns.createdAt && makinaBomColumns.updatedAt) {
          insertQuery = `
            INSERT OR IGNORE INTO makina_bom (makina_id, bom_id, createdAt, updatedAt)
            SELECT m.makina_id, :groupId, datetime('now'), datetime('now')
            FROM makinalar m
            WHERE m.name LIKE 'ADVANTAGE%'
            AND m.durum = 'aktif'
          `;
        } else {
          insertQuery = `
            INSERT OR IGNORE INTO makina_bom (makina_id, bom_id)
            SELECT m.makina_id, :groupId
            FROM makinalar m
            WHERE m.name LIKE 'ADVANTAGE%'
            AND m.durum = 'aktif'
          `;
        }

        await sequelize.query(insertQuery, {
          replacements: { groupId }
        });

        console.log(`✓ Created ADVANTAGE group (ID: ${groupId}) and associated machines`);
      } else {
        console.log('✓ ADVANTAGE group already exists');
      }
    }

    console.log('✅ ADVANTAGE groups created successfully');

  } catch (error) {
    console.error('❌ Failed to create ADVANTAGE groups:', error);
    throw error;
  }
}

async function rollbackMigration() {
  try {
    console.log('Starting rollback: Removing group fields from BOM table...');

    // SQLite doesn't support constraint dropping in ALTER TABLE

    // Remove columns (one by one for SQLite compatibility)
    await sequelize.query(`
      ALTER TABLE boms
      DROP COLUMN IF EXISTS grup_tipi
    `);

    await sequelize.query(`
      ALTER TABLE boms
      DROP COLUMN IF EXISTS marka
    `);

    await sequelize.query(`
      ALTER TABLE boms
      DROP COLUMN IF EXISTS ozel_etiket
    `);

    await sequelize.query(`
      ALTER TABLE boms
      DROP COLUMN IF EXISTS gorsel_ikon
    `);

    console.log('✅ Rollback completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    return false;
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback') {
    rollbackMigration();
  } else {
    addGroupFieldsToBom();
  }
}

module.exports = {
  addGroupFieldsToBom,
  rollbackMigration
};