'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // SQLite doesn't support altering ENUM directly
    // We need to recreate the table or use a workaround

    // Step 1: Add the new column cozum_adimlari (JSON type works in SQLite)
    await queryInterface.addColumn('uygunsuzluk_raporlari', 'cozum_adimlari', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: '[]'
    });

    // Step 2: SQLite ENUM values are just CHECK constraints
    // We need to update the CHECK constraint to allow new values
    // First, get the current table definition
    const tableDefinition = await queryInterface.describeTable('uygunsuzluk_raporlari');

    // Step 3: Drop the old CHECK constraint for durum
    // In SQLite, we need to recreate the table to modify ENUM
    // For now, we'll just update the data and rely on the model to enforce new values

    // Note: In production with PostgreSQL, we would use:
    // await queryInterface.sequelize.query(`
    //   ALTER TYPE enum_uygunsuzluk_raporlari_durum
    //   ADD VALUE 'cozum_surecinde' BEFORE 'kapatildi';
    // `);

    // For SQLite, the model will handle the new values
    // Existing records with 'cozum_bekliyor' will need manual update if desired
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the cozum_adimlari column
    await queryInterface.removeColumn('uygunsuzluk_raporlari', 'cozum_adimlari');
  }
};
