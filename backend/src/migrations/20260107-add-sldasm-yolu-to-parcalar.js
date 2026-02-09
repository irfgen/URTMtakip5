const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists first
    const tableInfo = await queryInterface.describeTable('parcalar');

    if (!tableInfo.sldasm_yolu) {
      await queryInterface.addColumn('parcalar', 'sldasm_yolu', {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'SLDASM dosyasının sunucudaki yolu'
      });
      console.log('sldasm_yolu column added to parcalar table');
    } else {
      console.log('sldasm_yolu column already exists in parcalar table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('parcalar', 'sldasm_yolu');
  }
};
