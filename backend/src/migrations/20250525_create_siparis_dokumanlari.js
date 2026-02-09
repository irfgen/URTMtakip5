module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('siparis_dokumanlari', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      is_emri_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      dosya_yolu: {
        type: Sequelize.STRING,
        allowNull: false
      },
      yuklenme_tarihi: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      siralama: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('siparis_dokumanlari');
  }
};
