const { sequelize } = require('../config/database');
const Makina = require('../models/Makina');
const Bom = require('../models/Bom');
const Parca = require('../models/Parca');
const Satis = require('../models/Satis');
const StokHareket = require('../models/StokHareket');

// Tüm satışları listele
exports.listSatislar = async (req, res) => {
    try {
        const { search, sortBy = 'created_at', sortDir = 'DESC' } = req.query;

        const allowedSortFields = ['id', 'makina_adi', 'satis_adedi', 'toplam_parca', 'toplam_stok_dusulen', 'durum', 'created_at'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        let query = `
            SELECT id, makina_id, makina_adi, satis_adedi, toplam_parca, toplam_stok_dusulen, durum, aciklama, created_at
            FROM satislar
        `;

        let whereClause = '';
        const replacements = [];

        if (search) {
            whereClause = ` WHERE makina_adi LIKE ? OR aciklama LIKE ?`;
            replacements.push(`%${search}%`, `%${search}%`);
        }

        query += whereClause;
        query += ` ORDER BY ${sortField} ${sortDirection}`;

        const satislar = await sequelize.query(query, {
            replacements: replacements,
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json(satislar);
    } catch (error) {
        console.error('Satışlar listelenirken hata:', error);
        res.status(500).json({ message: 'Satışlar listelenirken bir hata oluştu', error: error.message });
    }
};

// Tek bir satış detayını getir
exports.getSatisDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const satisQuery = `
            SELECT id, makina_id, makina_adi, satis_adedi, toplam_parca, toplam_stok_dusulen, durum, aciklama, created_at
            FROM satislar
            WHERE id = ?
        `;

        const satisResults = await sequelize.query(satisQuery, {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT
        });

        if (satisResults.length === 0) {
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        const satis = satisResults[0];

        // Stok hareketlerini getir
        const hareketlerQuery = `
            SELECT id, parca_kodu, parca_adi, bom_id, bom_adi, birim_miktar, satis_adedi, dusulen_miktar, onceki_stok, sonraki_stok, created_at
            FROM stok_hareketleri
            WHERE satis_id = ?
            ORDER BY id
        `;

        const hareketler = await sequelize.query(hareketlerQuery, {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT
        });

        res.status(200).json({
            ...satis,
            hareketler
        });
    } catch (error) {
        console.error('Satış detayı getirilirken hata:', error);
        res.status(500).json({ message: 'Satış detayı getirilirken bir hata oluştu', error: error.message });
    }
};

// Makina satışı yap (stok düşme işlemi)
exports.makinaSat = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { makina_id, satis_adedi = 1, aciklama } = req.body;

        // 1. Validasyon
        if (!makina_id) {
            await t.rollback();
            return res.status(400).json({ message: 'Makina ID gereklidir' });
        }

        if (satis_adedi < 1) {
            await t.rollback();
            return res.status(400).json({ message: 'Satış adedi en az 1 olmalıdır' });
        }

        // 2. Makina bilgilerini getir
        const makina = await Makina.findByPk(makina_id);
        if (!makina) {
            await t.rollback();
            return res.status(404).json({ message: 'Makina bulunamadı' });
        }

        // Makina adını al (name alanı)
        const makinaAdi = makina.name;

        // 3. Makinaya ait BOM'ları getir
        const boms = await Bom.getBomsByMakinaId(makina_id);
        if (!boms || boms.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Makinaya ait BOM bulunamadı' });
        }

        // 4. Tüm BOM'lardaki parçaları topla (tekrarları birleştir)
        const parcaMap = new Map();

        for (const bom of boms) {
            const parcalar = await Bom.getParcalarByBomId(bom.id);

            for (const parca of parcalar) {
                const parcaKodu = parca.parcaKodu;

                // Parça kodu boş ise atla
                if (!parcaKodu) continue;

                if (parcaMap.has(parcaKodu)) {
                    // Parça daha önce eklendi, miktarı artır
                    const existing = parcaMap.get(parcaKodu);
                    existing.birim_miktar_toplam += parca.miktar || 0;
                    existing.bomlar.push({
                        bom_id: bom.id,
                        bom_adi: bom.name,
                        birim_miktar: parca.miktar || 0
                    });
                } else {
                    // Yeni parça
                    parcaMap.set(parcaKodu, {
                        parca_kodu: parcaKodu,
                        parca_adi: parca.parcaAdi || parcaKodu,
                        birim_miktar_toplam: parca.miktar || 0,
                        bomlar: [{
                            bom_id: bom.id,
                            bom_adi: bom.name,
                            birim_miktar: parca.miktar || 0
                        }]
                    });
                }
            }
        }

        if (parcaMap.size === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'BOM\'larda parça bulunamadı' });
        }

        // 5. Önce satış kaydını oluştur (stok hareketleri için satis_id gerekli)
        const satis = await Satis.create({
            makina_id: makina_id,
            makina_adi: makinaAdi,
            satis_adedi: satis_adedi,
            toplam_parca: 0, // Geçici, sonra güncellenecek
            toplam_stok_dusulen: 0, // Geçici, sonra güncellenecek
            durum: 'tamamlandi',
            aciklama: aciklama || null
        }, { transaction: t });

        // 6. Stok düşme işlemi (negatife düşme aktif)
        let toplamParca = 0;
        let toplamStokDusulen = 0;
        const yetersizStokParcalar = []; // Yetersiz stok uyarıları

        for (const [parcaKodu, parcaInfo] of parcaMap) {
            // Parça bilgilerini getir
            const parca = await Parca.findByPk(parcaKodu);
            if (!parca) {
                await t.rollback();
                return res.status(404).json({ message: `Parça bulunamadı: ${parcaKodu}` });
            }

            const oncekiStok = parca.stokAdeti;
            const dusulenMiktar = parcaInfo.birim_miktar_toplam * satis_adedi;

            // Stok kontrolü - uyarı kaydet ama işlemi durdurma
            if (oncekiStok < dusulenMiktar) {
                yetersizStokParcalar.push({
                    parca_kodu: parcaKodu,
                    parca_adi: parcaInfo.parca_adi,
                    mevcut_stok: oncekiStok,
                    gereken_miktar: dusulenMiktar,
                    eksik: dusulenMiktar - oncekiStok
                });
            }

            // Stok düş (negatife olabilir)
            const sonrakiStok = Math.max(0, oncekiStok - dusulenMiktar);
            await parca.update({ stokAdeti: sonrakiStok }, { transaction: t });

            // Her BOM için ayrı stok hareketi kaydı oluştur
            for (const bomInfo of parcaInfo.bomlar) {
                await StokHareket.create({
                    satis_id: satis.id, // Artık satis.id mevcut
                    parca_kodu: parcaKodu,
                    parca_adi: parcaInfo.parca_adi,
                    bom_id: bomInfo.bom_id,
                    bom_adi: bomInfo.bom_adi,
                    birim_miktar: bomInfo.birim_miktar,
                    satis_adedi: satis_adedi,
                    dusulen_miktar: bomInfo.birim_miktar * satis_adedi,
                    onceki_stok: oncekiStok,
                    sonraki_stok: sonrakiStok
                }, { transaction: t });
            }

            toplamParca++;
            toplamStokDusulen += dusulenMiktar;
        }

        // 7. Satış kaydını güncelle (toplam bilgilerle)
        await satis.update({
            toplam_parca: toplamParca,
            toplam_stok_dusulen: toplamStokDusulen
        }, { transaction: t });

        await t.commit();

        // 8. Sonuç döndür (yetersiz stok uyarısı ile)
        const response = {
            message: 'Satış başarıyla tamamlandı',
            satis: {
                id: satis.id,
                makina_id: satis.makina_id,
                makina_adi: satis.makina_adi,
                satis_adedi: satis.satis_adedi,
                toplam_parca: satis.toplam_parca,
                toplam_stok_dusulen: satis.toplam_stok_dusulen,
                durum: satis.durum,
                aciklama: satis.aciklama,
                created_at: satis.created_at
            }
        };

        // Yetersiz stok uyarıları varsa ekle
        if (yetersizStokParcalar.length > 0) {
            response.uyari = 'Bazı parçaların stoğu yetersiz, negatife düştü';
            response.yetersiz_stok = yetersizStokParcalar;
        }

        res.status(201).json(response);

    } catch (error) {
        await t.rollback();
        console.error('Satış yapılırken hata:', error);
        res.status(500).json({ message: 'Satış yapılırken bir hata oluştu', error: error.message });
    }
};

// Satış sil (rollback işlemi)
exports.deleteSatis = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        // Satış kaydını getir
        const satis = await Satis.findByPk(id);
        if (!satis) {
            await t.rollback();
            return res.status(404).json({ message: 'Satış bulunamadı' });
        }

        // Stok hareketlerini getir
        const hareketler = await StokHareket.findAll({
            where: { satis_id: id }
        });

        // Stokları geri yükle
        for (const hareket of hareketler) {
            const parca = await Parca.findByPk(hareket.parca_kodu);
            if (parca) {
                const yeniStok = parca.stokAdeti + hareket.dusulen_miktar;
                await parca.update({ stokAdeti: yeniStok }, { transaction: t });
            }
        }

        // Stok hareketlerini sil
        await StokHareket.destroy({
            where: { satis_id: id },
            transaction: t
        });

        // Satış kaydını sil
        await satis.destroy({ transaction: t });

        await t.commit();

        res.status(200).json({ message: 'Satış başarıyla geri alındı' });

    } catch (error) {
        await t.rollback();
        console.error('Satış geri alınırken hata:', error);
        res.status(500).json({ message: 'Satış geri alınırken bir hata oluştu', error: error.message });
    }
};

// Makinaları listele (dropdown için)
exports.listMakinalar = async (req, res) => {
    try {
        const makinalar = await Makina.findAll({
            attributes: ['makina_id', 'name'],
            order: [['name', 'ASC']]
        });

        // Frontend uyumluluğu için makinaAdi alias'ı ekleyelim
        const formattedMakinalar = makinalar.map(m => ({
            makina_id: m.makina_id,
            makinaAdi: m.name
        }));

        res.status(200).json(formattedMakinalar);
    } catch (error) {
        console.error('Makinalar listelenirken hata:', error);
        res.status(500).json({ message: 'Makinalar listelenirken bir hata oluştu', error: error.message });
    }
};
