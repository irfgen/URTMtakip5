const Sequelize = require('sequelize');
const path = require('path');

async function analyzeDatabase(dbPath) {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });

  try {
    await sequelize.authenticate();

    // Tabloları al
    const [tables] = await sequelize.query(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tableSchemas = {};

    for (const table of tables) {
      const tableName = table.name;
      const [columns] = await sequelize.query(`PRAGMA table_info(${tableName})`);
      const [indexes] = await sequelize.query(`PRAGMA index_list(${tableName})`);
      const [foreignKeys] = await sequelize.query(`PRAGMA foreign_key_list(${tableName})`);

      tableSchemas[tableName] = {
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          defaultValue: col.dflt_value,
          primaryKey: col.pk > 0
        })),
        indexes: indexes.map(idx => idx.name),
        foreignKeys: foreignKeys.map(fk => ({
          table: fk.table,
          from: fk.from,
          to: fk.to
        }))
      };
    }

    await sequelize.close();
    return tableSchemas;
  } catch (error) {
    console.error('Database analysis error:', error.message);
    await sequelize.close();
    throw error;
  }
}

function compareSchemas(oldSchema, newSchema) {
  const oldTables = new Set(Object.keys(oldSchema));
  const newTables = new Set(Object.keys(newSchema));

  const addedTables = [...newTables].filter(t => !oldTables.has(t));
  const removedTables = [...oldTables].filter(t => !newTables.has(t));
  const commonTables = [...oldTables].filter(t => newTables.has(t));

  const tableChanges = {};

  // Yeni tablolar
  for (const table of addedTables) {
    tableChanges[table] = {
      action: 'CREATE_TABLE',
      details: newSchema[table]
    };
  }

  // Ortak tablolardaki değişiklikler
  for (const table of commonTables) {
    const oldCols = oldSchema[table].columns;
    const newCols = newSchema[table].columns;

    const oldColNames = new Set(oldCols.map(c => c.name));
    const newColNames = new Set(newCols.map(c => c.name));

    const addedColumns = newCols.filter(c => !oldColNames.has(c.name));
    const removedColumns = oldCols.filter(c => !newColNames.has(c.name));
    const modifiedColumns = [];

    // Değiştirilmiş columnları kontrol et
    for (const oldCol of oldCols) {
      const newCol = newCols.find(c => c.name === oldCol.name);
      if (newCol) {
        const changes = [];
        if (oldCol.type !== newCol.type) changes.push(`type: ${oldCol.type} -> ${newCol.type}`);
        if (oldCol.notNull !== newCol.notNull) changes.push(`notNull: ${oldCol.notNull} -> ${newCol.notNull}`);
        if (oldCol.defaultValue !== newCol.defaultValue) changes.push(`defaultValue: ${oldCol.defaultValue} -> ${newCol.defaultValue}`);
        if (oldCol.primaryKey !== newCol.primaryKey) changes.push(`primaryKey: ${oldCol.primaryKey} -> ${newCol.primaryKey}`);

        if (changes.length > 0) {
          modifiedColumns.push({
            name: oldCol.name,
            changes: changes
          });
        }
      }
    }

    if (addedColumns.length > 0 || removedColumns.length > 0 || modifiedColumns.length > 0) {
      tableChanges[table] = {
        action: 'ALTER_TABLE',
        addedColumns,
        removedColumns,
        modifiedColumns
      };
    }
  }

  return {
    summary: {
      totalTablesOld: oldTables.size,
      totalTablesNew: newTables.size,
      addedTables: addedTables.length,
      removedTables: removedTables.length,
      modifiedTables: Object.keys(tableChanges).filter(t =>
        tableChanges[t].action === 'ALTER_TABLE' || t.startsWith('added'))
        .length
    },
    addedTables,
    removedTables,
    tableChanges
  };
}

async function main() {
  const oldDbPath = path.join(__dirname, 'database_eski.sqlite');
  const newDbPath = path.join(__dirname, 'database.sqlite');

  console.log('='.repeat(80));
  console.log('VERİTABANI KARŞILAŞTIRMA ANALİZİ');
  console.log('='.repeat(80));
  console.log(`\nEski Veritabanı: ${oldDbPath}`);
  console.log(`Yeni Veritabanı: ${newDbPath}\n`);

  console.log('1. Eski veritabanı analiz ediliyor...');
  const oldSchema = await analyzeDatabase(oldDbPath);

  console.log('2. Yeni veritabanı analiz ediliyor...');
  const newSchema = await analyzeDatabase(newDbPath);

  console.log('3. Karşılaştırma yapılıyor...\n');
  const comparison = compareSchemas(oldSchema, newSchema);

  console.log('='.repeat(80));
  console.log('ÖZET RAPOR');
  console.log('='.repeat(80));
  console.log(`Eski DB Tablo Sayısı: ${comparison.summary.totalTablesOld}`);
  console.log(`Yeni DB Tablo Sayısı: ${comparison.summary.totalTablesNew}`);
  console.log(`Eklenen Tablolar: ${comparison.summary.addedTables}`);
  console.log(`Kaldırılan Tablolar: ${comparison.summary.removedTables}`);
  console.log(`Değişen Tablolar: ${comparison.summary.modifiedTables}`);

  if (comparison.addedTables.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('EKLENEN TABLOLAR:');
    console.log('='.repeat(80));
    for (const table of comparison.addedTables) {
      console.log(`\n+ ${table}`);
      const cols = newSchema[table].columns;
      cols.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}${col.notNull ? ' NOT NULL' : ''}${col.primaryKey ? ' PRIMARY KEY' : ''}`);
      });
    }
  }

  if (comparison.removedTables.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('KALDIRILAN TABLOLAR:');
    console.log('='.repeat(80));
    for (const table of comparison.removedTables) {
      console.log(`- ${table}`);
    }
  }

  const modifiedTables = Object.entries(comparison.tableChanges)
    .filter(([_, change]) => change.action === 'ALTER_TABLE');

  if (modifiedTables.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('DEĞİŞEN TABLOLAR:');
    console.log('='.repeat(80));
    for (const [table, changes] of modifiedTables) {
      console.log(`\n* ${table}`);

      if (changes.addedColumns.length > 0) {
        console.log('  Eklenen Columnlar:');
        changes.addedColumns.forEach(col => {
          console.log(`    + ${col.name}: ${col.type}${col.notNull ? ' NOT NULL' : ''}${col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''}`);
        });
      }

      if (changes.removedColumns.length > 0) {
        console.log('  Kaldırılan Columnlar:');
        changes.removedColumns.forEach(col => {
          console.log(`    - ${col.name}: ${col.type}`);
        });
      }

      if (changes.modifiedColumns.length > 0) {
        console.log('  Değişen Columnlar:');
        changes.modifiedColumns.forEach(col => {
          console.log(`    ~ ${col.name}: ${col.changes.join(', ')}`);
        });
      }
    }
  }

  // JSON çıktı
  const outputPath = path.join(__dirname, 'db_comparison_report.json');
  require('fs').writeFileSync(outputPath, JSON.stringify({
    oldSchema,
    newSchema,
    comparison
  }, null, 2));
  console.log(`\nDetaylı rapor: ${outputPath}`);
}

main().catch(console.error);
