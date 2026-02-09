# Makindex Database Schema Documentation

## Overview

Makindex implementation adds hierarchical machine data management to the existing ÜRTM Takip system. The schema introduces a 4-level hierarchy: Machine Classes → Machines → BOMs → Parts.

## New Tables

### 1. makina_siniflari

Machine classes categorize machines into functional groups.

**Columns:**
```sql
- id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- ad (STRING, NOT NULL) - Class name
- aciklama (TEXT) - Description
- aktif (BOOLEAN, DEFAULT true) - Active status
- created_at (DATETIME) - Creation timestamp
- updated_at (DATETIME) - Last update timestamp
- deleted_at (DATETIME) - Soft delete timestamp
```

**Example Data:**
```sql
INSERT INTO makina_siniflari (ad, aciklama) VALUES
('CNC Torna', 'CNC turning machines'),
('CNC Freze', 'CNC milling machines'),
('Manuel Tezgah', 'Manual workstations'),
('Özel Makinalar', 'Special purpose machines'),
('Montaj Hatları', 'Assembly workstations');
```

### 2. makina_bom (Junction Table)

Many-to-many relationship between machines and BOMs.

**Columns:**
```sql
- id (INTEGER, PRIMARY KEY, AUTOINCREMENT)
- makina_id (INTEGER, NOT NULL) - Foreign key to makinalar.makina_id
- bom_id (INTEGER, NOT NULL) - Foreign key to boms.id
- created_at (DATETIME) - Creation timestamp
- updated_at (DATETIME) - Last update timestamp
```

**Foreign Key Constraints:**
- `makina_id` references `makinalar(makina_id)`
- `bom_id` references `boms(id)`

## Modified Tables

### makinalar

Added foreign key to link machines to classes.

**New Column:**
```sql
- makina_sinifi_id (INTEGER, FOREIGN KEY) - References makina_siniflari.id
```

**Foreign Key Constraint:**
- `makina_sinifi_id` references `makina_siniflari(id)`

## Existing Tables Used

### boms

Bill of Materials tables (already existing)
- Used in junction table with machines
- Contains product structure information

### parcalar

Parts catalog (already existing)
- Linked through BOM relationships
- Contains stock and technical information

## Relationships

### Hierarchical Structure

```
makina_siniflari (1) ──── (∗) makinalar
    makina_sinifi_id (FK)     makina_id (PK)

makinalar (∗) ──── (∗) boms
    makina_id (PK, FK)        id (PK, FK)

boms (∗) ──── (∗) parcalar
    id (PK, FK)              bom_id (FK)
```

### Model Associations (Sequelize)

```javascript
// MakinaSinifi
MakinaSinifi.hasMany(Makina, {
  foreignKey: 'makina_sinifi_id',
  as: 'makinalar'
});

// Makina
Makina.belongsTo(MakinaSinifi, {
  foreignKey: 'makina_sinifi_id',
  as: 'makinaSinifi'
});
Makina.belongsToMany(Bom, {
  through: 'makina_bom',
  foreignKey: 'makina_id',
  otherKey: 'bom_id',
  as: 'boms'
});

// Bom
Bom.belongsToMany(Makina, {
  through: 'makina_bom',
  foreignKey: 'bom_id',
  otherKey: 'makina_id',
  as: 'makinalar'
});
Bom.hasMany(Parca, {
  foreignKey: 'bom_id',
  as: 'parcalar'
});
```

## Data Migration

### Migration File: `20251017145756-create-makindex-hierarchy.js`

1. **Create makina_siniflari table**
   - Add indexes on `ad` and `aktif` columns
   - Add timestamps and soft delete support

2. **Create makina_bom junction table**
   - Add composite unique index on `(makina_id, bom_id)`
   - Add indexes for performance

3. **Update makinalar table**
   - Add `makina_sinifi_id` column
   - Create foreign key constraint
   - Add index for faster lookups

4. **Seed initial data**
   - 5 machine classes with descriptions
   - Assign existing machines to appropriate classes
   - Create initial machine-BOM relationships

## Performance Optimizations

### Indexes

```sql
-- makina_siniflari
CREATE INDEX idx_makina_siniflari_ad ON makina_siniflari(ad);
CREATE INDEX idx_makina_siniflari_aktif ON makina_siniflari(aktif);

-- makina_bom
CREATE UNIQUE INDEX idx_makina_bom_unique ON makina_bom(makina_id, bom_id);
CREATE INDEX idx_makina_bom_makina_id ON makina_bom(makina_id);
CREATE INDEX idx_makina_bom_bom_id ON makina_bom(bom_id);

-- makinalar
CREATE INDEX idx_makinalar_sinif_id ON makinalar(makina_sinifi_id);
```

### Query Optimization

- Use indexed columns for WHERE clauses
- Implement pagination for large datasets
- Cache frequently accessed hierarchy data
- Use junction table for efficient many-to-many queries

## Data Integrity

### Constraints

```sql
-- Foreign key constraints ensure referential integrity
ALTER TABLE makinalar ADD CONSTRAINT fk_makinalar_sinif
  FOREIGN KEY (makina_sinifi_id) REFERENCES makina_siniflari(id);

ALTER TABLE makina_bom ADD CONSTRAINT fk_makina_bom_makina
  FOREIGN KEY (makina_id) REFERENCES makinalar(makina_id);

ALTER TABLE makina_bom ADD CONSTRAINT fk_makina_bom_bom
  FOREIGN KEY (bom_id) REFERENCES boms(id);
```

### Validation Rules

- Machine class names must be unique
- Machine-BOM relationships must be unique
- Foreign keys must be valid references

## Usage Examples

### Get All Machines in a Class

```sql
SELECT m.*, ms.ad as sinif_adi
FROM makinalar m
JOIN makina_siniflari ms ON m.makina_sinifi_id = ms.id
WHERE ms.id = 1 AND ms.aktif = 1;
```

### Get All BOMs for a Machine

```sql
SELECT b.*
FROM boms b
JOIN makina_bom mb ON b.id = mb.bom_id
WHERE mb.makina_id = 1;
```

### Get Machine Hierarchy with Parts Count

```sql
SELECT
  ms.id as sinif_id,
  ms.ad as sinif_adi,
  COUNT(DISTINCT m.makina_id) as makina_sayisi,
  COUNT(DISTINCT b.id) as bom_sayisi,
  COUNT(DISTINCT p.id) as parca_sayisi
FROM makina_siniflari ms
LEFT JOIN makinalar m ON ms.id = m.makina_sinifi_id
LEFT JOIN makina_bom mb ON m.makina_id = mb.makina_id
LEFT JOIN boms b ON mb.bom_id = b.id
LEFT JOIN parcalar p ON b.id = p.bom_id
WHERE ms.aktif = 1
GROUP BY ms.id, ms.ad;
```

## Backup and Rollback

### Backup Strategy

- Export schema before migration
- Create backup of existing makinalar data
- Test migration on staging environment

### Rollback Procedure

1. Remove foreign key constraints
2. Drop junction table
3. Remove makina_sinifi_id column from makinalar
4. Restore original data if needed

## Future Enhancements

- Add machine capabilities matrix
- Implement versioning for BOMs
- Add machine maintenance history
- Create machine performance metrics table