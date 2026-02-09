const StokKarti = require('../models/StokKarti');
const Parca = require('../models/Parca');
const { Op } = require('sequelize');
const StokTakipListesi = require('../models/StokTakipListesi');

/**
 * Stok kartlarını listeler
 */
exports.stokKartlariGetir = async (req, res) => {
    try {
        const { 
            aramaMetni, 
            malzemeCinsi, 
            sortBy = 'createdAt', 
            sortOrder = 'DESC',
            page = 1, 
            limit = 20,
            includeParcalar = 'false',
            stok_takip_listesi_id
        } = req.query;

        let where = {};
        let order = [];

        // Sıralama
        if (sortBy && sortOrder) {
            // Geçerli sütunları kontrol et
            const validColumns = ['id', 'kesit', 'boy', 'malzeme_cinsi', 'malzeme_adi', 'adet', 'olusturma_tarihi'];
            if (validColumns.includes(sortBy)) {
                order.push([sortBy, sortOrder.toUpperCase()]);
            } else {
                order.push(['olusturma_tarihi', 'DESC']);
            }
        } else {
            order.push(['olusturma_tarihi', 'DESC']);
        }

        // Arama filtresi
        if (aramaMetni) {
            where = {
                [Op.or]: [
                    { kesit: { [Op.like]: `%${aramaMetni}%` } },
                    { malzeme_cinsi: { [Op.like]: `%${aramaMetni}%` } },
                    { malzeme_adi: { [Op.like]: `%${aramaMetni}%` } }
                ]
            };
        }

        // Malzeme cinsi filtresi
        if (malzemeCinsi) {
            where.malzeme_cinsi = { [Op.like]: `%${malzemeCinsi}%` };
        }

        // Stok takip listesi filtresi
        if (stok_takip_listesi_id) {
            const listId = parseInt(stok_takip_listesi_id);
            if (Number.isInteger(listId)) {
                const liste = await StokTakipListesi.findByPk(listId);
                if (!liste) {
                    return res.json({ stokKartlari: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
                }
                const kalemler = Array.isArray(liste.kalemler) ? liste.kalemler : [];
                const ids = kalemler.map(k => parseInt(k.stok_karti_id)).filter(Number.isInteger);
                if (ids.length > 0) {
                    where.id = { ...(where.id || {}), [Op.in]: ids };
                } else {
                    // Liste boşsa direkt boş sonuç dön
                    return res.json({ stokKartlari: [], toplam: 0, sayfa: parseInt(page), sayfaBasi: parseInt(limit), sayfaSayisi: 0 });
                }
            }
        }

        const offset = (page - 1) * limit;

        // Include seçenekleri
        const includeOptions = [];
        if (includeParcalar === 'true') {
            includeOptions.push({
                model: Parca,
                as: 'parcalar',
                required: false,
                attributes: ['parcaKodu', 'parcaAdi', 'stokAdeti']
            });
        }

        const stokKartlari = await StokKarti.findAndCountAll({
            where,
            include: includeOptions,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format response
        const formattedStokKartlari = stokKartlari.rows.map(stokKarti => {
            const data = stokKarti.toJSON();
            
            // Ölçü formatı ekle
            data.olculeriFormatted = stokKarti.kesit;
            if (stokKarti.boy) {
                data.olculeriFormatted += ` x ${stokKarti.boy}mm`;
            }

            // Parça sayısı ekle
            if (data.parcalar) {
                data.parcaSayisi = data.parcalar.length;
            }

            return data;
        });

        res.json({
            stokKartlari: formattedStokKartlari,
            toplam: stokKartlari.count,
            sayfa: parseInt(page),
            sayfaBasi: parseInt(limit),
            sayfaSayisi: Math.ceil(stokKartlari.count / limit)
        });
    } catch (error) {
        console.error('Stok kartları getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Ham malzeme ölçülerine göre stok kartı arar
 */
exports.hamMalzemeOlcuAra = async (req, res) => {
    try {
        const { olcu } = req.query;
        
        if (!olcu) {
            return res.status(400).json({ error: 'Ölçü parametresi gereklidir' });
        }

        // Ölçüyü parse et
        const parseResults = parseHamMalzemeOlculeri(olcu);
        
        let stokKartlari = [];
        let searchQueries = [];

        // Parse edilen sonuçlara göre ara
        if (parseResults.genislik && parseResults.yukseklik) {
            // Dikdörtgen ölçüler
            searchQueries.push({
                kesit: `${parseResults.genislik}x${parseResults.yukseklik}`,
                matchType: 'exact'
            });
            
            // Ters boyutları da dene
            if (parseResults.genislik !== parseResults.yukseklik) {
                searchQueries.push({
                    kesit: `${parseResults.yukseklik}x${parseResults.genislik}`,
                    matchType: 'reverse'
                });
            }
        } else if (parseResults.cap) {
            // Çap ölçüleri
            searchQueries.push({
                kesit: { [Op.like]: `%Çap${parseResults.cap}%` },
                matchType: 'diameter'
            });
        }

        // Benzer ölçüleri de ara
        if (parseResults.genislik) {
            searchQueries.push({
                kesit: { [Op.like]: `%${parseResults.genislik}%` },
                matchType: 'partial'
            });
        }

        // Arama yap
        for (const query of searchQueries) {
            const results = await StokKarti.findAll({
                where: { kesit: query.kesit },
                attributes: ['id', 'kesit', 'boy', 'malzeme_cinsi', 'malzeme_adi', 'adet'],
                limit: 10
            });

            results.forEach(result => {
                const data = result.toJSON();
                data.matchType = query.matchType;
                data.olculeriFormatted = result.kesit;
                if (result.boy) {
                    data.olculeriFormatted += ` x ${result.boy}mm`;
                }
                stokKartlari.push(data);
            });
        }

        // Benzersiz sonuçları filtrele
        const uniqueStokKartlari = stokKartlari.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );

        res.json({
            aramaMetni: olcu,
            parseResults,
            stokKartlari: uniqueStokKartlari,
            toplam: uniqueStokKartlari.length
        });
    } catch (error) {
        console.error('Ham malzeme ölçü arama hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Yeni stok kartı oluşturur
 */
exports.stokKartiOlustur = async (req, res) => {
    try {
        const stokKarti = await StokKarti.create(req.body);
        res.status(201).json(stokKarti);
    } catch (error) {
        console.error('Stok kartı oluşturma hatası:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Stok kartı detayını getirir
 */
exports.stokKartiGetir = async (req, res) => {
    try {
        const { id } = req.params;
        
        const stokKarti = await StokKarti.findByPk(id, {
            include: [{
                model: Parca,
                as: 'parcalar',
                required: false,
                attributes: ['parcaKodu', 'parcaAdi', 'stokAdeti', 'imalMi']
            }]
        });

        if (!stokKarti) {
            return res.status(404).json({ error: 'Stok kartı bulunamadı' });
        }

        const data = stokKarti.toJSON();
        data.olculeriFormatted = stokKarti.kesit;
        if (stokKarti.boy) {
            data.olculeriFormatted += ` x ${stokKarti.boy}mm`;
        }

        res.json(data);
    } catch (error) {
        console.error('Stok kartı getirme hatası:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Ham malzeme ölçülerini parse eden yardımcı fonksiyon
 * Migration scriptindeki parseHamMalzemeOlculeri fonksiyonunun kopyası
 */
function parseHamMalzemeOlculeri(olculer) {
    if (!olculer || typeof olculer !== 'string') {
        return { basarili: false, sebep: 'Geçersiz ölçü metni' };
    }

    const temizOlcu = olculer.trim().toUpperCase();
    
    // Çap kontrolü
    const capRegex = /(?:ø|Ø|CAP|ÇAP|DIA|DIAMETER|O)\s*(\d+(?:[.,]\d+)?)/i;
    const capMatch = temizOlcu.match(capRegex);
    
    if (capMatch) {
        const cap = parseFloat(capMatch[1].replace(',', '.'));
        return { 
            basarili: true, 
            tip: 'cap',
            cap: cap,
            formatlanmis: `Çap${cap}`
        };
    }
    
    // Dikdörtgen ölçüler (genişlik x yükseklik)
    const dikdortgenRegex = /(\d+(?:[.,]\d+)?)\s*[xX×*]\s*(\d+(?:[.,]\d+)?)/;
    const dikdortgenMatch = temizOlcu.match(dikdortgenRegex);
    
    if (dikdortgenMatch) {
        const genislik = parseFloat(dikdortgenMatch[1].replace(',', '.'));
        const yukseklik = parseFloat(dikdortgenMatch[2].replace(',', '.'));
        return { 
            basarili: true, 
            tip: 'dikdortgen',
            genislik: genislik,
            yukseklik: yukseklik,
            formatlanmis: `${genislik}x${yukseklik}`
        };
    }
    
    return { 
        basarili: false, 
        sebep: 'Parse edilemeyen format',
        metin: temizOlcu
    };
}

module.exports = exports;
