const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IsEmriTaslak = sequelize.define('IsEmriTaslak', {
    taslak_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    oturum_id: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Taslak oluşturma oturumu ID'
    },
    is_adi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    plan_liste_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parca_kodu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    adet: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    malzeme: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teslim_tarihi: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    oncelik: {
        type: DataTypes.ENUM('düşük', 'normal', 'yüksek', 'acil'),
        defaultValue: 'normal'
    },
    aciklama: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    uretim_plani_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    durum: {
        type: DataTypes.ENUM('taslak', 'hazir', 'yayinlandi'),
        defaultValue: 'taslak'
    },
    kaynak: {
        type: DataTypes.STRING,
        defaultValue: 'excel',
        comment: 'Taslağın kaynağı: excel, manual, vb.'
    },
    excel_satir_no: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Excel dosyasındaki satır numarası'
    },
    olusturma_tarihi: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    guncelleme_tarihi: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'is_emri_taslaklari',
    timestamps: true,
    createdAt: 'olusturma_tarihi',
    updatedAt: 'guncelleme_tarihi',
    indexes: [
        {
            fields: ['oturum_id']
        },
        {
            fields: ['durum']
        },
        {
            fields: ['parca_kodu']
        }
    ]
});

module.exports = IsEmriTaslak;
