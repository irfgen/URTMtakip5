// Parça kodu ile resim yolu dönen endpoint fonksiyonu
exports.parcaResimYolu = async (req, res) => {
  const { parca_kodu } = req.params;
  try {
    const parca = await Parca.findOne({ where: { parcaKodu: parca_kodu } });
    if (parca && parca.foto_path) {
      let yol = parca.foto_path;
      if (!yol.startsWith('/uploads/')) {
        yol = '/uploads/' + yol.replace(/^\/+/, '');
      }
      res.json({ resimYolu: yol });
    } else {
      res.json({ resimYolu: '' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ resimYolu: '' });
  }
};

/**
 * Stok kartı olmayan parçaları listeler
 */
exports.stokKartiOlmayanParcalar = async (req, res) => {
    try {
        const { page = 1, limit = 50, aramaMetni } = req.query;
        let where = {
            stok_karti_id: null,
            imalMi: true // Sadece imal edilen parçalar
        };

        // Arama filtresi
        if (aramaMetni) {
            where = {
                ...where,
                [Op.or]: [
                    { parcaKodu: { [Op.like]: `%${aramaMetni}%` } },
                    { parcaAdi: { [Op.like]: `%${aramaMetni}%` } },
                    { hamMalzemeOlculeri: { [Op.like]: `%${aramaMetni}%` } }
                ]
            };
        }

        const offset = (page - 1) * limit;

        const parcalar = await Parca.findAndCountAll({
            where,
            attributes: ['parcaKodu', 'parcaAdi', 'hamMalzemeOlculeri', 'hamMalzemeCinsi', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            parcalar: parcalar.rows,
            toplam: parcalar.count,
            sayfa: parseInt(page),
            sayfaBasi: parseInt(limit),
            sayfaSayisi: Math.ceil(parcalar.count / limit)
        });
    } catch (error) {
        console.error('Stok kartı olmayan parçalar listesi hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Parçaya stok kartı atar
 */
exports.parcayaStokKartiAta = async (req, res) => {
    try {
        const { parcaKodu } = req.params;
        const { stok_karti_id } = req.body;

        if (!stok_karti_id) {
            return res.status(400).json({ error: 'Stok kartı ID\'si gereklidir' });
        }

        // Stok kartını kontrol et
        const stokKarti = await StokKarti.findByPk(stok_karti_id);
        if (!stokKarti) {
            return res.status(404).json({ error: 'Stok kartı bulunamadı' });
        }

        // Parçayı kontrol et
        const parca = await Parca.findByPk(parcaKodu);
        if (!parca) {
            return res.status(404).json({ error: 'Parça bulunamadı' });
        }

        // Stok kartını ata
        await parca.update({ stok_karti_id });

        // Güncellenmiş parçayı döndür
        const updatedParca = await Parca.findByPk(parcaKodu, {
            include: [{
                model: StokKarti,
                as: 'stokKarti',
                required: false
            }]
        });

        res.json({
            message: 'Stok kartı başarıyla atandı',
            parca: updatedParca
        });
    } catch (error) {
        console.error('Stok kartı atama hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Parça stok kartı atamasını kaldırır
 */
exports.parcaStokKartiKaldir = async (req, res) => {
    try {
        const { parcaKodu } = req.params;

        const parca = await Parca.findByPk(parcaKodu);
        if (!parca) {
            return res.status(404).json({ error: 'Parça bulunamadı' });
        }

        await parca.update({ stok_karti_id: null });

        res.json({
            message: 'Stok kartı ataması kaldırıldı',
            parca: parca
        });
    } catch (error) {
        console.error('Stok kartı kaldırma hatası:', error);
        res.status(500).json({ error: error.message });
    }
};
const Parca = require('../models/Parca');
const StokKarti = require('../models/StokKarti');
const { Op, DataTypes } = require('sequelize');

exports.parcaEkle = async (req, res) => {
    try {
        console.log('[PARCA EKLE] Gelen veri:', req.body);

        // Stok kartı ID'si validasyonu
        if (req.body.stok_karti_id) {
            const stokKarti = await StokKarti.findByPk(req.body.stok_karti_id);
            if (!stokKarti) {
                return res.status(400).json({ 
                    error: 'Geçersiz stok kartı ID\'si. Stok kartı bulunamadı.' 
                });
            }
        }

        console.log('[PARCA EKLE] Veritabanına ekleniyor:', req.body);
        const parca = await Parca.create(req.body);
        console.log('[PARCA EKLE] Parça başarıyla eklendi:', parca.parcaKodu);
        
        // Stok kartı bilgisiyle birlikte döndür
        const parcaWithStok = await Parca.findByPk(parca.parcaKodu, {
            include: [{
                model: StokKarti,
                as: 'stokKarti',
                required: false
            }]
        });
        
        res.status(201).json(parcaWithStok);
    } catch (error) {
        console.error('[PARCA EKLE] Hata:', error);
        console.error('[PARCA EKLE] Hata detayları:', error.errors);
        res.status(400).json({ error: error.message });
    }
};

exports.parcalariGetir = async (req, res) => {
    try {
        const { aramaMetni, imalMi, kritikStok, sortBy, sortOrder, page = 1, limit = 20, includeStokKarti = 'true', parca_takip_listesi_id, makina_id } = req.query;
        let where = {};
        let order = [];
        
        // Sıralama seçenekleri
        if (sortBy && sortOrder) {
            // CreatedAt özel durumu için kontrol
            if (sortBy === 'createdAt') {
                order.push(['createdAt', sortOrder.toUpperCase()]);
            } else if (sortBy === 'stokKarti.kesit') {
                // Stok kartı kesiti sıralama
                order.push([{ model: StokKarti, as: 'stokKarti' }, 'kesit', sortOrder.toUpperCase()]);
            } else if (sortBy === 'stokKarti.malzeme_cinsi') {
                // Stok kartı malzeme cinsi sıralama
                order.push([{ model: StokKarti, as: 'stokKarti' }, 'malzeme_cinsi', sortOrder.toUpperCase()]);
            } else {
                order.push([sortBy, sortOrder.toUpperCase()]);
            }
        } else {
            // Varsayılan sıralama: createdAt DESC - en son eklenenler ilk
            order.push(['createdAt', 'DESC']);
        }
        
        // Arama filtresi
        if (aramaMetni) {
            where = {
                [Op.or]: [
                    { parcaKodu: { [Op.like]: `%${aramaMetni}%` } },
                    { parcaAdi: { [Op.like]: `%${aramaMetni}%` } },
                    { hamMalzemeOlculeri: { [Op.like]: `%${aramaMetni}%` } }
                ]
            };
        }
        
        // İmal edilen parçalar filtresi
        if (imalMi !== undefined) {
            where.imalMi = imalMi === 'true';
        }

        // Kritik stok filtresi
        if (kritikStok === 'true') {
            where = {
                ...where,
                [Op.and]: [
                    { stokAdeti: { [Op.ne]: null } },
                    { kritik_stok: { [Op.ne]: null } },
                    { kritik_stok: { [Op.gt]: 0 } }, // Kritik stok değeri > 0
                    Parca.sequelize.literal('stokAdeti <= kritik_stok') // Stok, kritik stoktan az veya eşit
                ]
            };
        }

        // Parça takip listesi filtresi
        if (parca_takip_listesi_id) {
            const { Op } = require('sequelize');
            const ParcaTakipListesi = require('../models/ParcaTakipListesi');
            const listId = parseInt(parca_takip_listesi_id);
            if (Number.isInteger(listId)) {
                const liste = await ParcaTakipListesi.findByPk(listId);
                if (!liste) {
                    return res.json({ parcalar: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
                }
                const kalemler = Array.isArray(liste.kalemler) ? liste.kalemler : [];
                const kodlar = kalemler.map(k => String(k.parca_kodu)).filter(k => !!k);
                if (kodlar.length > 0) {
                    where.parcaKodu = { ...(where.parcaKodu || {}), [Op.in]: kodlar };
                } else {
                    // Liste boşsa direkt boş sonuç dön
                    return res.json({ parcalar: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
                }
            }
        }

        // Makina filtresi - YENİ
        if (makina_id) {
            const Bom = require('../models/Bom');
            const { sequelize } = require('../models');

            // Önce makinaya ait BOM'ları bul
            const boms = await Bom.getBomsByMakinaId(makina_id);

            if (!boms || boms.length === 0) {
                // Makinaya ait BOM yoksa boş sonuç dön
                return res.json({ parcalar: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
            }

            // BOM ID'lerini al
            const bomIds = boms.map(b => b.id);

            // Bu BOM'lardaki parça kodlarını getir
            const parcaKodlariQuery = `
                SELECT DISTINCT bp.parcaKodu
                FROM bom_parcalar bp
                WHERE bp.bomId IN (${bomIds.map(() => '?').join(',')})
            `;

            const parcaKodlariResult = await sequelize.query(parcaKodlariQuery, {
                replacements: bomIds,
                type: sequelize.QueryTypes.SELECT
            });

            const parcaKodlari = parcaKodlariResult.map(r => r.parcaKodu);

            if (parcaKodlari.length === 0) {
                return res.json({ parcalar: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
            }

            // Where koşuluna ekle
            where.parcaKodu = { ...(where.parcaKodu || {}), [Op.in]: parcaKodlari };
        }

        // Sayfalama için offset hesaplama
        const offset = (page - 1) * limit;

        // Include seçenekleri
        const includeOptions = [];
        if (includeStokKarti === 'true') {
            includeOptions.push({
                model: StokKarti,
                as: 'stokKarti',
                required: false,
                attributes: ['id', 'kesit', 'boy', 'malzeme_cinsi', 'malzeme_adi', 'adet', 'kritik_stok_miktari']
            });
        }

        // Parçaları getir
        const parcalar = await Parca.findAndCountAll({
            where,
            include: includeOptions,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Response formatla
        const formattedParcalar = parcalar.rows.map(parca => {
            const parcaData = parca.toJSON();
            
            // Ham malzeme bilgilerini formatla
            if (parca.stokKarti) {
                parcaData.hamMalzemeFormatted = {
                    kesit: parca.stokKarti.kesit,
                    boy: parca.stokKarti.boy,
                    olculeri: parca.hamMalzemeOlculeriFormatted,
                    cinsi: parca.stokKarti.malzeme_cinsi,
                    adi: parca.stokKarti.malzeme_adi,
                    stokMiktari: parca.stokKarti.adet,
                    kritikStokMiktari: parca.stokKarti.kritik_stok_miktari,
                    tamAciklama: parca.hamMalzemeTamAciklama
                };
            } else {
                // Fallback için eski alanları kullan
                parcaData.hamMalzemeFormatted = {
                    olculeri: parca.hamMalzemeOlculeri,
                    cinsi: parca.hamMalzemeCinsi,
                    tamAciklama: parca.hamMalzemeOlculeri || 'Ham malzeme belirtilmemiş'
                };
            }
            
            return parcaData;
        });
        
        res.json({
            parcalar: formattedParcalar,
            toplam: parcalar.count,
            sayfa: parseInt(page),
            sayfaBasi: parseInt(limit),
            sayfaSayisi: Math.ceil(parcalar.count / limit)
        });
    } catch (error) {
        console.error('Parça listesi getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.parcaGetir = async (req, res) => {
    try {
        console.log("Parça Getir - Parça Kodu:", req.params.parcaKodu);
        
        // Stok kartı bilgisiyle birlikte parçayı getir
        const parca = await Parca.findByPk(req.params.parcaKodu, {
            include: [{
                model: StokKarti,
                as: 'stokKarti',
                required: false,
                attributes: ['id', 'kesit', 'boy', 'malzeme_cinsi', 'malzeme_adi', 'adet', 'kritik_stok_miktari', 'lokasyon', 'firma']
            }]
        });
        
        if (!parca) {
            console.log("Parça bulunamadı:", req.params.parcaKodu);
            return res.status(404).json({ error: 'Parça bulunamadı' });
        }
        
        // Modeli formatla - hem camelCase hem de snake_case değerleri dön
        const parcaData = parca.toJSON();

        // Tüm string alanları trimle
        Object.keys(parcaData).forEach(key => {
            if (typeof parcaData[key] === 'string') {
                parcaData[key] = parcaData[key].trim();
            }
        });

        // Her iki formatı da dahil et
        if (parcaData.setupSayisi !== undefined) {
            parcaData.setup_sayisi = parcaData.setupSayisi;
        }
        if (parcaData.cncIslemeSuresi !== undefined) {
            parcaData.cnc_isleme_suresi = parcaData.cncIslemeSuresi;
        }

        // Ham malzeme bilgilerini formatla
        if (parca.stokKarti) {
            parcaData.hamMalzemeFormatted = {
                stokKartiId: parca.stokKarti.id,
                kesit: parca.stokKarti.kesit,
                boy: parca.stokKarti.boy,
                olculeri: parca.hamMalzemeOlculeriFormatted,
                cinsi: parca.stokKarti.malzeme_cinsi,
                adi: parca.stokKarti.malzeme_adi,
                stokMiktari: parca.stokKarti.adet,
                kritikStokMiktari: parca.stokKarti.kritik_stok_miktari,
                lokasyon: parca.stokKarti.lokasyon,
                firma: parca.stokKarti.firma,
                tamAciklama: parca.hamMalzemeTamAciklama
            };
        } else {
            // Fallback için eski alanları kullan
            parcaData.hamMalzemeFormatted = {
                olculeri: parca.hamMalzemeOlculeri,
                cinsi: parca.hamMalzemeCinsi,
                tamAciklama: parca.hamMalzemeOlculeri || 'Ham malzeme belirtilmemiş'
            };
        }

        console.log("Döndürülen parça verileri:", parcaData);
        res.json(parcaData);
    } catch (error) {
        console.error('Parça getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.parcaGuncelle = async (req, res) => {
    try {
        // SQLite foreign key constraint'lerini tamamen bypass etmek için
        // Raw SQL query kullanarak doğrudan güncelleme yapıyoruz
        
        const parcaKodu = req.params.parcaKodu;
        let updateData = req.body;
        
        // Stok kartı objesini ID'ye dönüştür
        if (updateData.stok_karti_id && typeof updateData.stok_karti_id === 'object') {
            updateData.stok_karti_id = updateData.stok_karti_id.id || null;
        }
        
        // Sequelize model field mapping'ini raw SQL için yap
        const fieldMapping = {
            'parcaAdi': 'parca_adi',
            'parcaKayitIdleri': 'parca_kayit_idleri',
            'stokAdeti': 'stok_adeti',
            'tedarikBedeli': 'tedarik_bedeli',
            'imalMi': 'imal_mi',
            'hamMalzemeCinsi': 'ham_malzeme_cinsi',
            'hamMalzemeOlculeri': 'ham_malzeme_olculeri',
            'fasonMaliyeti': 'fason_maliyeti',
            'sirketIciMaliyeti': 'sirket_ici_maliyeti',
            'setupSayisi': 'setup_sayisi',
            'cncIslemeSuresi': 'cnc_isleme_suresi',
            'createdAt': 'created_at',
            'updatedAt': 'updated_at'
        };
        
        // İzin verilen veritabanı alanları (güvenlik için)
        const allowedDbFields = [
            'parca_adi', 'kategori', 'stok_adeti', 'kritik_stok', 'tedarik_bedeli',
            'imal_mi', 'ham_malzeme_cinsi', 'ham_malzeme_olculeri', 'stok_karti_id',
            'imalat_prosedur_no', 'fason_maliyeti', 'sirket_ici_maliyeti',
            'setup_sayisi', 'cnc_isleme_suresi', 'siyah', 'teknik_resim_path',
            'foto_path', 'parca_kayit_idleri', 'sldprt_yolu', 'slddrw_yolu'
        ];
        
        // Diğer obje tipindeki alanları temizle ve field mapping yap
        const cleanedUpdateData = {};
        Object.keys(updateData).forEach(key => {
            if (key !== 'parcaKodu' && key !== 'stokKarti') { // Primary key ve gereksiz objeleri güncellemiyoruz
                // Sadece primitive değerleri kabul et
                if (typeof updateData[key] !== 'object' || updateData[key] === null) {
                    // Field mapping uygula
                    const dbFieldName = fieldMapping[key] || key;
                    
                    // Sadece izin verilen alanları ekle
                    if (allowedDbFields.includes(dbFieldName)) {
                        cleanedUpdateData[dbFieldName] = updateData[key];
                    }
                }
            }
        });
        
        console.log('🐛 Original updateData:', updateData);
        console.log('🐛 Cleaned updateData:', cleanedUpdateData);
        
        // Önce parçanın var olup olmadığını kontrol et
        const existingParca = await Parca.findByPk(parcaKodu);
        if (!existingParca) {
            return res.status(404).json({ error: 'Parça bulunamadı' });
        }

        // Stok kartı ID'si validasyonu
        if (cleanedUpdateData.stok_karti_id && cleanedUpdateData.stok_karti_id !== null) {
            const stokKarti = await StokKarti.findByPk(cleanedUpdateData.stok_karti_id);
            if (!stokKarti) {
                return res.status(400).json({ 
                    error: 'Geçersiz stok kartı ID\'si. Stok kartı bulunamadı.' 
                });
            }
        }

        // Foreign key constraint'leri devre dışı bırak ve raw SQL ile güncelle
        await Parca.sequelize.query('PRAGMA foreign_keys = OFF');
        
        // Raw SQL update query'si
        const setClause = Object.keys(cleanedUpdateData)
            .map(key => `${key} = :${key}`)
            .join(', ');

        if (setClause) {
            const updateQuery = `UPDATE parcalar SET ${setClause}, updated_at = datetime('now') WHERE parca_kodu = :parcaKodu`;
            
            const replacements = {
                ...cleanedUpdateData,
                parcaKodu: parcaKodu
            };

            await Parca.sequelize.query(updateQuery, {
                replacements,
                type: Parca.sequelize.QueryTypes.UPDATE
            });
        }
        
        // Foreign key constraint'leri tekrar etkinleştir
        await Parca.sequelize.query('PRAGMA foreign_keys = ON');
        
        // Güncellenmiş parçayı stok kartı bilgisiyle birlikte döndür
        const updatedParca = await Parca.findByPk(parcaKodu, {
            include: [{
                model: StokKarti,
                as: 'stokKarti',
                required: false,
                attributes: ['id', 'kesit', 'boy', 'malzeme_cinsi', 'malzeme_adi', 'adet', 'kritik_stok_miktari']
            }]
        });
        
        res.json(updatedParca);
        
    } catch (error) {
        console.error('Parça güncelleme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.parcaSil = async (req, res) => {
    try {
        const parcaKodu = req.params.parcaKodu;
        const force = req.query.force === 'true';

        // Parçayı kontrol et
        const parca = await Parca.findByPk(parcaKodu);
        if (!parca) {
            return res.status(404).json({ error: 'Parça bulunamadı' });
        }

        // Parçaya referans veren kayıtları kontrol et
        const { IsEmri, FasonIsEmri, FasonTeklif, sequelize } = require('../models');
        
        // Define GrupParca model inline 
        const GrupParca = sequelize.define('GrupParca', {
            grup_id: {
                type: DataTypes.UUID,
                primaryKey: true
            },
            parca_kodu: {
                type: DataTypes.STRING,
                primaryKey: true
            }
        }, {
            tableName: 'grup_parcalar',
            timestamps: true
        });

        // Define FasonGrupParca model inline for fason group checks
        const FasonGrupParca = sequelize.define('FasonGrupParca', {
            fason_grup_parca_id: {
                type: DataTypes.UUID,
                primaryKey: true
            },
            fason_grup_id: {
                type: DataTypes.UUID,
                allowNull: false
            },
            parca_kodu: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            tableName: 'fason_grup_parcalari',
            timestamps: false
        });

        // Foreign key constraint'leri devre dışı bırak
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // İlişkili kayıtları bul
        const isEmirleri = await IsEmri.findAll({ where: { parca_kodu: parcaKodu } });
        const fasonIsEmirleri = await FasonIsEmri.findAll({ where: { parca_kodu: parcaKodu } });
        const fasonTeklifler = await FasonTeklif.findAll({ where: { parca_kodu: parcaKodu } });
        const grupParcalar = await GrupParca.findAll({ where: { parca_kodu: parcaKodu } });
        const fasonGrupParcalar = await FasonGrupParca.findAll({ where: { parca_kodu: parcaKodu } });

        // Referans sayısını hesapla
        const referanslar = {
            isEmirleri: isEmirleri.length,
            fasonIsEmirleri: fasonIsEmirleri.length,
            fasonTeklifler: fasonTeklifler.length,
            grupParcalar: grupParcalar.length,
            fasonGrupParcalar: fasonGrupParcalar.length,
            toplam: isEmirleri.length + fasonIsEmirleri.length + fasonTeklifler.length + grupParcalar.length + fasonGrupParcalar.length
        };

        // Referans varsa ve force=false ise hata döndür
        if (referanslar.toplam > 0 && !force) {
            // Foreign key constraint'leri tekrar etkinleştir
            await sequelize.query('PRAGMA foreign_keys = ON');
            return res.status(400).json({
                error: 'Bu parça başka tablolarda kullanıldığı için silinemiyor.',
                referanslar: referanslar,
                mesaj: 'Parçayı ve ilişkili kayıtları silmek için ?force=true parametresi ekleyin.'
            });
        }

        // Parçanın ilişkili kayıtlarını sil (force=true ise)
        if (force) {
            const transaction = await sequelize.transaction();
            
            try {
                // Fason grup ilişkilerini sil
                if (referanslar.fasonGrupParcalar > 0) {
                    await FasonGrupParca.destroy({
                        where: { parca_kodu: parcaKodu },
                        transaction
                    });
                }

                // Grup ilişkilerini sil
                if (referanslar.grupParcalar > 0) {
                    await GrupParca.destroy({
                        where: { parca_kodu: parcaKodu },
                        transaction
                    });
                }

                // Fason teklifleri sil
                if (referanslar.fasonTeklifler > 0) {
                    await FasonTeklif.destroy({
                        where: { parca_kodu: parcaKodu },
                        transaction
                    });
                }

                // Fason iş emirlerini sil
                if (referanslar.fasonIsEmirleri > 0) {
                    await FasonIsEmri.destroy({
                        where: { parca_kodu: parcaKodu },
                        transaction
                    });
                }

                // İş emirlerindeki parça referansını temizle
                if (referanslar.isEmirleri > 0) {
                    await IsEmri.update(
                        { parca_kodu: null },
                        { 
                            where: { parca_kodu: parcaKodu },
                            transaction
                        }
                    );
                }

                // Parçayı sil
                await parca.destroy({ transaction });
                
                // İşlemi onayla
                await transaction.commit();
                
                // Foreign key constraint'leri tekrar etkinleştir
                await sequelize.query('PRAGMA foreign_keys = ON');
                
                return res.json({
                    message: 'Parça ve ilişkili kayıtlar başarıyla silindi',
                    silinenReferanslar: {
                        isEmirleriGuncellendi: referanslar.isEmirleri,
                        fasonIsEmirleriSilindi: referanslar.fasonIsEmirleri,
                        fasonTekliflerSilindi: referanslar.fasonTeklifler,
                        grupIliskileriSilindi: referanslar.grupParcalar,
                        fasonGrupIliskileriSilindi: referanslar.fasonGrupParcalar
                    }
                });
            } catch (error) {
                // Hata durumunda işlemi geri al
                await transaction.rollback();
                // Foreign key constraint'leri tekrar etkinleştir
                await sequelize.query('PRAGMA foreign_keys = ON');
                throw error;
            }
        } else {
            // Normal silme işlemi (referans yoksa)
            await parca.destroy();
            // Foreign key constraint'leri tekrar etkinleştir
            await sequelize.query('PRAGMA foreign_keys = ON');
            return res.json({ message: 'Parça başarıyla silindi' });
        }
    } catch (error) {
        console.error('Parça silinirken hata:', error);
        
        // Foreign key constraint'leri tekrar etkinleştir (hata durumunda da)
        try {
            await Parca.sequelize.query('PRAGMA foreign_keys = ON');
        } catch (pragmaError) {
            console.error('Foreign key constraint tekrar etkinleştirilirken hata:', pragmaError);
        }
        
        // Foreign key constraint hatası için özel mesaj
        if (error.name === 'SequelizeForeignKeyConstraintError' || 
            (error.parent && error.parent.code === 'SQLITE_CONSTRAINT') ||
            error.message.includes('foreign key mismatch')) {
            return res.status(400).json({ 
                error: 'Bu parça başka tablolarda kullanıldığı için silinemiyor. Foreign key constraint hatası.',
                details: error.message,
                mesaj: 'Parçayı zorla silmek için ?force=true parametresi ekleyin.'
            });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Tek parça kodu kontrol endpoint'i (teknik resim analizi için)
 */
exports.checkParcaKodu = async (req, res) => {
    try {
        const { parcaKodu } = req.query;
        
        if (!parcaKodu) {
            return res.status(400).json({ 
                success: false,
                message: 'Parça kodu belirtilmemiş' 
            });
        }

        console.log('[DEBUG] Parça kodu kontrol ediliyor:', parcaKodu);

        // Önce tam eşleşme ile ara
        let parca = await Parca.findOne({
            where: { parcaKodu: parcaKodu },
            attributes: ['parcaKodu', 'parcaAdi', 'hamMalzemeCinsi', 'hamMalzemeOlculeri', 'imalMi']
        });

        // Tam eşleşme yoksa case-insensitive arama yap 
        if (!parca) {
            const { Op } = require('sequelize');
            parca = await Parca.findOne({
                where: {
                    parcaKodu: {
                        [Op.like]: parcaKodu
                    }
                },
                attributes: ['parcaKodu', 'parcaAdi', 'hamMalzemeCinsi', 'hamMalzemeOlculeri', 'imalMi']
            });
        }

        // Hala bulunamadıysa fuzzy search (başında veya sonunda eşleşen)
        if (!parca) {
            const { Op } = require('sequelize');
            parca = await Parca.findOne({
                where: {
                    [Op.or]: [
                        { parcaKodu: { [Op.like]: `%${parcaKodu}%` } },
                        { parcaAdi: { [Op.like]: `%${parcaKodu}%` } }
                    ]
                },
                attributes: ['parcaKodu', 'parcaAdi', 'hamMalzemeCinsi', 'hamMalzemeOlculeri', 'imalMi']
            });
        }

        const response = {
            success: true,
            searchedFor: parcaKodu,
            exists: !!parca,
            parca: parca ? {
                parcaKodu: parca.parcaKodu,
                parcaAdi: parca.parcaAdi,
                hamMalzemeCinsi: parca.hamMalzemeCinsi,
                hamMalzemeOlculeri: parca.hamMalzemeOlculeri,
                imalMi: parca.imalMi
            } : null
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Parça kodu kontrol hatası:', error);
        res.status(500).json({ 
            success: false,
            message: 'Parça kontrol edilirken hata oluştu',
            error: error.message 
        });
    }
};

/**
 * Parça adlarının listesini kontrol ederek mevcut ve eksik olanları döner
 */
exports.checkBulk = async (req, res) => {
    try {
        const { parcaAdlari } = req.body;
        
        if (!parcaAdlari || !Array.isArray(parcaAdlari) || parcaAdlari.length === 0) {
            return res.status(400).json({ 
                error: 'parcaAdlari array\'i gereklidir ve boş olamaz' 
            });
        }

        // Veritabanında mevcut parçaları bul
        const mevcutParcalar = await Parca.findAll({
            where: {
                [Op.or]: [
                    { parcaKodu: { [Op.in]: parcaAdlari } },
                    { parcaAdi: { [Op.in]: parcaAdlari } }
                ]
            },
            attributes: ['parcaKodu', 'parcaAdi']
        });

        // Mevcut parça adlarını al
        const mevcutParcaAdlari = [];
        mevcutParcalar.forEach(parca => {
            if (parcaAdlari.includes(parca.parcaKodu)) {
                mevcutParcaAdlari.push(parca.parcaKodu);
            }
            if (parcaAdlari.includes(parca.parcaAdi)) {
                mevcutParcaAdlari.push(parca.parcaAdi);
            }
        });

        // Eksik parçaları belirle
        const eksikParcalar = parcaAdlari.filter(parcaAdi => 
            !mevcutParcaAdlari.includes(parcaAdi)
        );

        res.json({
            success: true,
            data: {
                mevcutParcalar: [...new Set(mevcutParcaAdlari)], // Duplikatları temizle
                eksikParcalar: eksikParcalar,
                toplamKontrolEdilen: parcaAdlari.length,
                mevcutSayisi: [...new Set(mevcutParcaAdlari)].length,
                eksikSayisi: eksikParcalar.length
            }
        });
    } catch (error) {
        console.error('Parça bulk kontrol hatası:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

/**
 * Parça için ham malzeme stok kartı önerisi
 */
exports.suggestHamMalzeme = async (req, res) => {
    try {
        const { parcaKodu } = req.params;
        const { kesit, boy, malzeme } = req.query;

        if (!parcaKodu) {
            return res.status(400).json({ 
                success: false,
                error: 'Parça kodu gereklidir' 
            });
        }

        // Stok kartlarını getir
        const stokKartlari = await StokKarti.findAll({
            attributes: ['id', 'malzeme_adi', 'malzeme_cinsi', 'kesit', 'boy'],
            where: {
                aktif_mi: true
            }
        });

        // Akıllı eşleştirme algoritması
        const suggestions = smartMaterialMatching({
            parcaKodu,
            kesit,
            boy,
            malzeme
        }, stokKartlari);

        res.json({
            success: true,
            suggestions: suggestions.slice(0, 10), // En iyi 10 öneriyi döndür
            totalFound: suggestions.length
        });

    } catch (error) {
        console.error('Ham malzeme önerisi hatası:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

/**
 * Akıllı malzeme eşleştirme algoritması
 */
function smartMaterialMatching(parcaInfo, stokKartlari) {
    const { parcaKodu, kesit, boy, malzeme } = parcaInfo;
    const suggestions = [];

    for (const stok of stokKartlari) {
        let score = 0;
        let matchReasons = [];
        
        // 1. Malzeme cinsi eşleştirmesi (30 puan)
        if (malzeme && stok.malzeme_cinsi) {
            const parcaMalzeme = malzeme.toUpperCase();
            const stokCinsi = stok.malzeme_cinsi.toUpperCase();
            
            // Exact match
            if (stokCinsi.includes(parcaMalzeme) || parcaMalzeme.includes(stokCinsi)) {
                score += 30;
                matchReasons.push('Malzeme cinsi eşleşmesi');
            }
            
            // Özel malzeme türleri için bonus (20 puan)
            const specialMatches = [
                { pattern: 'SOĞUK', keywords: ['SOĞUK', 'COLD'] },
                { pattern: 'SICAK', keywords: ['SICAK', 'HOT'] },
                { pattern: 'GALVANIZ', keywords: ['GALVANIZ', 'GALV'] },
                { pattern: 'PASLANMAZ', keywords: ['PASLANMAZ', 'INOX', '304', '316'] },
                { pattern: 'ALM', keywords: ['ALM', 'ALÜMINYUM', 'ALUMINUM'] }
            ];
            
            for (const match of specialMatches) {
                if (parcaMalzeme.includes(match.pattern)) {
                    for (const keyword of match.keywords) {
                        if (stokCinsi.includes(keyword)) {
                            score += 20;
                            matchReasons.push(`${match.pattern} malzeme eşleşmesi`);
                            break;
                        }
                    }
                }
            }
        }
        
        // 2. Kesit/ölçü eşleştirmesi (40 puan)
        if (kesit && stok.kesit) {
            const parcaKesit = normalizeKesit(kesit);
            const stokKesit = normalizeKesit(stok.kesit);
            
            // Exact match (40 puan)
            if (parcaKesit === stokKesit) {
                score += 40;
                matchReasons.push('Kesit tam eşleşme');
            } 
            // Tolerance match (30 puan) - ±2mm tolerans
            else if (toleranceMatch(parcaKesit, stokKesit, 2)) {
                score += 30;
                matchReasons.push('Kesit tolerans eşleşmesi (±2mm)');
            }
            // Partial match (20 puan)
            else if (parcaKesit.includes(stokKesit) || stokKesit.includes(parcaKesit)) {
                score += 20;
                matchReasons.push('Kesit kısmi eşleşme');
            }
        }
        
        // 3. Boy eşleştirmesi (20 puan)
        if (boy && stok.boy) {
            const requiredLength = parseFloat(boy);
            const stokLength = parseFloat(stok.boy);
            
            if (stokLength && stokLength >= requiredLength) {
                if (stokLength === requiredLength) {
                    score += 20;
                    matchReasons.push('Boy tam eşleşme');
                } else if (stokLength >= requiredLength && stokLength <= requiredLength * 1.5) {
                    score += 15;
                    matchReasons.push('Boy yeterli');
                } else {
                    score += 10;
                    matchReasons.push('Boy fazla ama uygun');
                }
            }
        }
        
        // 4. Malzeme adı ile parça kodu benzerliği (10 puan)
        if (stok.malzeme_adi && parcaKodu) {
            const malzemeAdi = stok.malzeme_adi.toUpperCase();
            const pKodu = parcaKodu.toUpperCase();
            
            if (malzemeAdi.includes(pKodu.substring(0, 4)) || 
                pKodu.includes(malzemeAdi.substring(0, 4))) {
                score += 10;
                matchReasons.push('Kod benzerliği');
            }
        }
        
        // Minimum eşik puanı: 30
        if (score >= 30) {
            suggestions.push({
                id: stok.id,
                malzeme_adi: stok.malzeme_adi,
                malzeme_cinsi: stok.malzeme_cinsi,
                kesit: stok.kesit,
                boy: stok.boy,
                score: score,
                match_reason: matchReasons.join(', ')
            });
        }
    }
    
    // Puana göre sırala (yüksekten düşüğe)
    return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Kesit normalleştirme fonksiyonu
 */
function normalizeKesit(kesit) {
    if (!kesit) return '';
    return kesit.toUpperCase()
        .replace(/[^0-9X]/g, '')  // Sadece rakam ve X bırak
        .replace(/\*/g, 'X');     // *'ları X'e çevir
}

/**
 * Tolerans eşleştirme kontrolü
 */
function toleranceMatch(kesit1, kesit2, toleranceMm) {
    const dims1 = extractDimensions(kesit1);
    const dims2 = extractDimensions(kesit2);
    
    if (!dims1 || !dims2) return false;
    
    return Math.abs(dims1.width - dims2.width) <= toleranceMm &&
           Math.abs(dims1.height - dims2.height) <= toleranceMm;
}

/**
 * Kesit boyutlarını çıkar (örn: "40X25" -> {width: 40, height: 25})
 */
function extractDimensions(kesit) {
    const match = kesit.match(/(\d+)X(\d+)/);
    if (!match) return null;
    
    return {
        width: parseInt(match[1]),
        height: parseInt(match[2])
    };
}

/**
 * Excel'den gelen parça kodları için toplu varlık kontrolü
 */
exports.batchCheckParcalar = async (req, res) => {
    try {
        const { parcaKodlari } = req.body;

        if (!parcaKodlari || !Array.isArray(parcaKodlari)) {
            return res.status(400).json({
                error: 'parcaKodlari array olarak gönderilmelidir'
            });
        }

        const sonuclar = [];

        for (const parcaKodu of parcaKodlari) {
            try {
                // Parça varlığını kontrol et
                const parca = await Parca.findOne({
                    where: {
                        [Op.or]: [
                            { parcaKodu: parcaKodu },
                            { parcaAdi: parcaKodu }
                        ]
                    },
                    include: [{
                        model: StokKarti,
                        as: 'stokKarti',
                        required: false
                    }]
                });

                sonuclar.push({
                    parcaKodu: parcaKodu,
                    mevcutMu: !!parca,
                    parcaDetay: parca ? {
                        id: parca.id,
                        parcaKodu: parca.parcaKodu,
                        parcaAdi: parca.parcaAdi,
                        hamMalzemeCinsi: parca.hamMalzemeCinsi,
                        hamMalzemeOlculeri: parca.hamMalzemeOlculeri
                    } : null,
                    hamMalzemeStokKarti: parca?.stokKarti ? {
                        id: parca.stokKarti.id,
                        malzeme_adi: parca.stokKarti.malzeme_adi,
                        malzeme_cinsi: parca.stokKarti.malzeme_cinsi,
                        kesit: parca.stokKarti.kesit,
                        boy: parca.stokKarti.boy
                    } : null
                });

            } catch (itemError) {
                console.error(`Parça kontrolü hatası (${parcaKodu}):`, itemError);
                sonuclar.push({
                    parcaKodu: parcaKodu,
                    mevcutMu: false,
                    parcaDetay: null,
                    hamMalzemeStokKarti: null,
                    error: 'Kontrol edilemedi'
                });
            }
        }

        res.json(sonuclar);

    } catch (error) {
        console.error('Batch parça kontrolü hatası:', error);
        res.status(500).json({
            error: 'Parça kontrolü yapılırken hata oluştu',
            details: error.message
        });
    }
};

/**
 * Parça için QR kod oluşturma endpoint'i
 */
exports.generateQRCode = async (req, res) => {
    try {
        const { parcaKodu } = req.params;
        const { size = 200 } = req.query;

        if (!parcaKodu) {
            return res.status(400).json({
                success: false,
                error: 'Parça kodu gereklidir'
            });
        }

        // Parçanın var olup olmadığını kontrol et
        const parca = await Parca.findByPk(parcaKodu, {
            attributes: ['parcaKodu', 'parcaAdi']
        });

        if (!parca) {
            return res.status(404).json({
                success: false,
                error: 'Parça bulunamadı'
            });
        }

        // QR code kütüphanesini import et
        const QRCode = require('qrcode');

        // QR kod içeriğini oluştur
        const qrData = {
            parcaKodu: parca.parcaKodu,
            parcaAdi: parca.parcaAdi,
            sistem: 'ÜRTM Takip',
            url: `${req.protocol}://${req.get('host')}/parcalar/${parca.parcaKodu}`,
            olusturulmaTarihi: new Date().toISOString()
        };

        // QR kodunu Base64 formatında oluştur
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: parseInt(size),
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            success: true,
            data: {
                parcaKodu: parca.parcaKodu,
                parcaAdi: parca.parcaAdi,
                qrCodeDataUrl: qrCodeDataUrl,
                qrData: qrData
            }
        });

    } catch (error) {
        console.error('QR kod oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            error: 'QR kod oluşturulurken bir hata oluştu',
            details: error.message
        });
    }
};