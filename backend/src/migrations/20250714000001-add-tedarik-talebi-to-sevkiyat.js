'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('sevkiyatlar', 'tedarik_talebi_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            after: 'firma_id'
        });

        // Add index for performance
        await queryInterface.addIndex('sevkiyatlar', ['tedarik_talebi_id']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('sevkiyatlar', 'tedarik_talebi_id');
    }
};