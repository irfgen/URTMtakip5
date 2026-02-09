const FasonIsEmri = require('../models/FasonIsEmri');
const FasonTeklif = require('../models/FasonTeklif');
const Parca = require('../models/Parca');
const FasonGrup = require('../models/FasonGrup');
const { Op } = require('sequelize');

// Tüm fason iş emirlerini listele
exports.listFasonIsEmirleri = async (req, res) => {
    try {
        const { durum, parca_kodu, tedarikci, baslangic, bitis } = req.query;
        const where = {};
        
        if (durum) where.durum = durum;
        if (parca_kodu) where.parca_kodu = parca_kodu;
        if (tedarikci) where.tedarikci = { [Op.like]: `%${tedarikci}%` };
        
        // Tarih filtresi
        if (baslangic || bitis) {
            where.verilis_tarihi = {};
            if (baslangic) where.verilis_tarihi[Op.gte] = new Date(baslangic);
            if (bitis) where.verilis_tarihi[Op.lte] = new Date(bitis);
        }
        
        const fasonIsEmirleri = await FasonIsEmri.findAll({
            where,
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ],
            order: [['verilis_tarihi', 'DESC']]
        });
        
        res.status(200).json(fasonIsEmirleri);
    } catch (error) {
        console.error('Fason iş emirleri listelenirken hata:', error);
        res.status(500).json({ message: 'Fason iş emirleri listelenirken bir hata oluştu', error: error.message });
    }
};

// Fason iş emri detayı
exports.getFasonIsEmriDetail = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fasonIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });
        
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Fason iş emri bulunamadı' });
        }
        
        res.status(200).json(fasonIsEmri);
    } catch (error) {
        console.error('Fason iş emri detayı alınırken hata:', error);
        res.status(500).json({ message: 'Fason iş emri detayı alınırken bir hata oluştu', error: error.message });
    }
};

// Yeni fason iş emri oluştur
exports.createFasonIsEmri = async (req, res) => {
    try {
        console.log('Gelen istek verileri:', req.body);
        
        const { parca_kodu, fason_adet, teslim_tarihi, ilgili_kisi, tedarikci, durum, aciklama, uretim_plani_id } = req.body;
        
        // Veri kontrolü
        if (!parca_kodu) {
            return res.status(400).json({ message: 'Parça kodu belirtilmemiş' });
        }
        
        if (!fason_adet || isNaN(Number(fason_adet))) {
            return res.status(400).json({ message: 'Geçerli bir fason adeti girilmemiş' });
        }
        
        if (!ilgili_kisi) {
            return res.status(400).json({ message: 'İlgili kişi belirtilmemiş' });
        }
        
        if (!tedarikci) {
            return res.status(400).json({ message: 'Tedarikçi belirtilmemiş' });
        }
        
        // Parça kontrolü - burada parça kodunun tam olarak aynı format ve büyük/küçük harf duyarlılığı ile aranması önemli
        console.log('Aranan parça kodu:', parca_kodu);
        
        // Tüm parçaları getirip debug için loglama
        const tumParcalar = await Parca.findAll();
        console.log('Veritabanındaki tüm parça kodları:', tumParcalar.map(p => p.parcaKodu));
        
        // Önce doğrudan primary key araması
        const parca = await Parca.findByPk(parca_kodu);
        console.log('FindByPK ile bulunan parça:', parca);
        
        // Eğer bulunamazsa, where koşulu ile deneyelim
        if (!parca) {
            const parcaWhere = await Parca.findOne({
                where: { parcaKodu: parca_kodu }
            });
            console.log('Where koşulu ile bulunan parça:', parcaWhere);
            
            if (parcaWhere) {
                return res.status(400).json({
                    message: 'Parça kodu bulundu ancak foreign key problemi var. Model tanımlarında bir uyumsuzluk olabilir.',
                    parcaKodu: parcaWhere.parcaKodu
                });
            } else {
                // Parça bulunamadığında daha detaylı hata bilgisi
                return res.status(404).json({ 
                    message: 'Belirtilen parça kodu bulunamadı', 
                    arananKod: parca_kodu,
                    veritabanindakiParcalar: tumParcalar.length > 0 ? tumParcalar.slice(0, 10).map(p => p.parcaKodu) : [],
                    ipucu: 'Parça kodu büyük/küçük harfe duyarlı olabilir. Kodun tam olarak doğru yazıldığından emin olun.'
                });
            }
        }
        
        // Durum kontrolü
        const gecerliDurumlar = ['beklemede', 'uretimde', 'tamamlandi', 'iptal'];
        const belirtilenDurum = durum || 'beklemede';
        
        if (!gecerliDurumlar.includes(belirtilenDurum)) {
            return res.status(400).json({ 
                message: 'Geçersiz durum değeri', 
                belirtilenDurum,
                gecerliDurumlar 
            });
        }
        
        // Tarih kontrolü
        let parsedTeslimTarihi = null;
        if (teslim_tarihi) {
            if (typeof teslim_tarihi === 'string') {
                parsedTeslimTarihi = new Date(teslim_tarihi);
                if (isNaN(parsedTeslimTarihi.getTime())) {
                    return res.status(400).json({ 
                        message: 'Geçersiz teslim tarihi formatı',
                        belirtilenTarih: teslim_tarihi 
                    });
                }
            } else if (teslim_tarihi instanceof Date) {
                parsedTeslimTarihi = teslim_tarihi;
            }
        }
        
        console.log('Veritabanına eklenecek veriler:', {
            parca_kodu,
            fason_adet: Number(fason_adet),
            teslim_tarihi: parsedTeslimTarihi,
            ilgili_kisi,
            tedarikci,
            durum: belirtilenDurum
        });
        
        const fasonIsEmri = await FasonIsEmri.create({
            parca_kodu,
            fason_adet: Number(fason_adet),
            teslim_adet: 0, // Başlangıçta teslim edilen adet sıfırdır
            verilis_tarihi: new Date(),
            teslim_tarihi: parsedTeslimTarihi,
            ilgili_kisi,
            tedarikci,
            durum: belirtilenDurum,
            aciklama: aciklama || null,
            uretim_plani_id: uretim_plani_id || null
        });
        
        res.status(201).json(fasonIsEmri);
    } catch (error) {
        console.error('Fason iş emri oluşturulurken hata:', error);
        console.error('Hata detayları:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            requestBody: req.body
        });
        res.status(500).json({ 
            message: 'Fason iş emri oluşturulurken bir hata oluştu', 
            error: error.message,
            errorType: error.name,
            details: error.errors ? error.errors.map(e => ({ type: e.type, message: e.message, field: e.path })) : null
        });
    }
};

// Fason iş emri güncelle
exports.updateFasonIsEmri = async (req, res) => {
    try {
        const { id } = req.params;
        const { parca_kodu, fason_adet, teslim_adet, teslim_tarihi, gercek_teslim_tarihi, ilgili_kisi, tedarikci, durum, aciklama, toplam_maliyet } = req.body;
        
        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Güncellenecek fason iş emri bulunamadı' });
        }
        
        // Parça kontrolü (yeni parça kodu girilmişse)
        if (parca_kodu && parca_kodu !== fasonIsEmri.parca_kodu) {
            const parca = await Parca.findByPk(parca_kodu);
            if (!parca) {
                return res.status(404).json({ message: 'Belirtilen parça kodu bulunamadı' });
            }
        }
        
        // İş emrini güncelle
        await fasonIsEmri.update({
            parca_kodu: parca_kodu || fasonIsEmri.parca_kodu,
            fason_adet: fason_adet !== undefined ? fason_adet : fasonIsEmri.fason_adet,
            teslim_adet: teslim_adet !== undefined ? teslim_adet : fasonIsEmri.teslim_adet,
            teslim_tarihi: teslim_tarihi || fasonIsEmri.teslim_tarihi,
            gercek_teslim_tarihi: gercek_teslim_tarihi || fasonIsEmri.gercek_teslim_tarihi,
            ilgili_kisi: ilgili_kisi || fasonIsEmri.ilgili_kisi,
            tedarikci: tedarikci || fasonIsEmri.tedarikci,
            durum: durum || fasonIsEmri.durum,
            aciklama: aciklama !== undefined ? aciklama : fasonIsEmri.aciklama,
            toplam_maliyet: toplam_maliyet !== undefined ? toplam_maliyet : fasonIsEmri.toplam_maliyet
        });
        
        // Güncel veriyi döndür
        const updatedIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });
        
        res.status(200).json(updatedIsEmri);
    } catch (error) {
        console.error('Fason iş emri güncellenirken hata:', error);
        res.status(500).json({ message: 'Fason iş emri güncellenirken bir hata oluştu', error: error.message });
    }
};

// Fason iş emri sil
exports.deleteFasonIsEmri = async (req, res) => {
    try {
        const { id } = req.params;
        
        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Silinecek fason iş emri bulunamadı' });
        }
        
        await fasonIsEmri.destroy();
        res.status(200).json({ message: 'Fason iş emri başarıyla silindi' });
    } catch (error) {
        console.error('Fason iş emri silinirken hata:', error);
        res.status(500).json({ message: 'Fason iş emri silinirken bir hata oluştu', error: error.message });
    }
};

// Fason iş emrini teslim alma
exports.teslimAlFasonIsEmri = async (req, res) => {
    try {
        const { id } = req.params;
        const { teslim_adet, teslim_notlari } = req.body;
        
        if (!teslim_adet || teslim_adet <= 0) {
            return res.status(400).json({ message: 'Geçerli bir teslim adedi girilmelidir' });
        }
        
        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Fason iş emri bulunamadı' });
        }

        if (fasonIsEmri.durum === 'tamamlandi') {
            return res.status(400).json({ message: 'Bu fason işi zaten tamamlanmış' });
        }
        
        const mevcutTeslim = fasonIsEmri.teslim_adet || 0;
        const yeniToplamTeslim = mevcutTeslim + parseInt(teslim_adet);
        
        // Teslim adet kontrolü (%10 tolerans payı)
        if (yeniToplamTeslim > fasonIsEmri.fason_adet * 1.1) {
            return res.status(400).json({ 
                message: `Toplam teslim adedi (${yeniToplamTeslim}) fasona verilen adetten (${fasonIsEmri.fason_adet}) fazla olamaz`,
                fason_adet: fasonIsEmri.fason_adet,
                mevcut_teslim: mevcutTeslim,
                yeni_teslim: teslim_adet,
                toplam_teslim: yeniToplamTeslim
            });
        }
        
        // Yeni durum kontrolü - eğer teslim adet fasona verilen adete eşit veya fazla ise tamamlandı
        const yeniDurum = yeniToplamTeslim >= fasonIsEmri.fason_adet ? 'tamamlandi' : 'uretimde';
        
        console.log(`[DEBUG] Fason teslim alma: ID=${id}, Mevcut Teslim=${mevcutTeslim}, Yeni Teslim=${teslim_adet}, Toplam=${yeniToplamTeslim}, Yeni Durum=${yeniDurum}`);
        
        // Parça stok güncellemesi
        const parca = await Parca.findByPk(fasonIsEmri.parca_kodu);
        if (!parca) {
            return res.status(404).json({ message: 'İlgili parça bulunamadı' });
        }
        
        // Stoka teslim alınan adet kadar ekleme (sadece yeni teslim adeti)
        const eskiStokMiktari = parca.stokAdeti || 0;
        const yeniStokMiktari = eskiStokMiktari + parseInt(teslim_adet);
        await parca.update({ stokAdeti: yeniStokMiktari });
        
        console.log(`[DEBUG] Stok güncellendi: ${parca.parcaKodu}, Eski Stok=${eskiStokMiktari}, Eklenen=${teslim_adet}, Yeni Stok=${yeniStokMiktari}`);
        
        // Fason iş emrini güncelle - TOPLAM teslim adet ile
        await fasonIsEmri.update({
            teslim_adet: yeniToplamTeslim,
            durum: yeniDurum,
            guncelleme_tarihi: new Date(),
            teslim_notlari: teslim_notlari ? 
                `${fasonIsEmri.teslim_notlari || ''}\n${new Date().toLocaleDateString('tr-TR')}: ${teslim_notlari}`.trim() : 
                fasonIsEmri.teslim_notlari
        });

        console.log(`[DEBUG] Fason iş emri güncellendi: ID=${id}, Toplam Teslim=${yeniToplamTeslim}, Durum=${yeniDurum}`);
        
        // ✅ FASON ENTEGRASYONu: Fason tamamlandığında ilişkili iş emrinin durumunu güncelle
        if (yeniDurum === 'tamamlandi' && fasonIsEmri.is_emri_id) {
            try {
                const IsEmri = require('../models/IsEmri');
                const IslemKaydi = require('../models/IslemKaydi');
                const isEmri = await IsEmri.findByPk(fasonIsEmri.is_emri_id);
                
                if (isEmri && isEmri.durum === 'fason') {
                    const yeniHareket = `${new Date().toLocaleString('tr-TR')} - Fason teslim alındı, iş tamamlandı`;
                    await isEmri.update({
                        durum: 'tamamlandı',
                        hareketler: [...(isEmri.hareketler || []), yeniHareket]
                    });
                    
                    // ✅ ÜRETIM GEÇMİŞİ: Fason teslim kaydını işlem geçmişine ekle
                    await IslemKaydi.create({
                        is_emri_no: isEmri.is_emri_no,
                        tezgah_id: null, // Fason işlem için null
                        fason_is_emri_id: fasonIsEmri.fason_is_emri_id,
                        islem_yeri: 'fason',
                        islem_tipi: 'fason_teslim',
                        islem_tarihi: new Date(),
                        islenen_adet: parseInt(teslim_adet),
                        fason_tedarikci: fasonIsEmri.tedarikci,
                        aciklama: `${fasonIsEmri.tedarikci} fasonunda teslim alındı${teslim_notlari ? ` - ${teslim_notlari}` : ''}`
                    });
                    
                    console.log(`[DEBUG] İlişkili iş emri tamamlandı ve üretim geçmişi eklendi: İş Emri ID=${fasonIsEmri.is_emri_id}`);
                }
            } catch (error) {
                console.error('İlişkili iş emri güncelleme hatası:', error);
                // Fason işlemi başarılı olduğu için hata vermiyoruz, sadece logluyoruz
            }
        }
        
        res.status(200).json({
            message: 'Fason iş emri teslim alındı',
            fasonIsEmri: await FasonIsEmri.findByPk(id, {
                include: [
                    { model: Parca, as: 'parca' },
                    { model: FasonTeklif, as: 'teklifler' },
                    { model: FasonGrup, as: 'fason_grup' }
                ]
            }),
            parcaStok: yeniStokMiktari,
            mevcutTeslim: mevcutTeslim,
            yeniTeslim: teslim_adet,
            toplamTeslim: yeniToplamTeslim
        });
    } catch (error) {
        console.error('Fason iş emri teslim alınırken hata:', error);
        res.status(500).json({ message: 'Fason iş emri teslim alınırken bir hata oluştu', error: error.message });
    }
};

// Fason iş durumunu güncelle
exports.updateFasonIsEmriDurum = async (req, res) => {
    try {
        const { id } = req.params;
        const { durum } = req.body;

        console.log(`[DEBUG] Fason durum değiştirme isteği: ID=${id}, Yeni Durum=${durum}`);
        
        // Durum kontrolü
        const gecerliDurumlar = ['beklemede', 'uretimde', 'tamamlandi', 'iptal'];
        if (!gecerliDurumlar.includes(durum)) {
            console.log(`[HATA] Geçersiz durum: ${durum}`);
            return res.status(400).json({ 
                message: 'Geçersiz durum değeri', 
                belirtilenDurum: durum,
                gecerliDurumlar 
            });
        }
        
        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        
        if (!fasonIsEmri) {
            console.log(`[HATA] Fason iş emri bulunamadı: ${id}`);
            return res.status(404).json({ message: 'Fason iş emri bulunamadı' });
        }

        console.log(`[DEBUG] Mevcut durum: ${fasonIsEmri.durum}, Yeni durum: ${durum}`);
        
        // Daha önce tamamlandı durumundaysa ve yeni durum farklıysa stok güncelleme
        if (fasonIsEmri.durum === 'tamamlandi' && durum !== 'tamamlandi') {
            // Parça stoğunu azalt
            const parca = await Parca.findByPk(fasonIsEmri.parca_kodu);
            if (parca) {
                const stokAzaltma = fasonIsEmri.teslim_adet;
                await parca.update({
                    stokAdeti: Math.max(0, parca.stokAdeti - stokAzaltma)
                });
                console.log(`[DEBUG] Parça stoğu azaltıldı: ${parca.parcaKodu}, Çıkarılan: ${stokAzaltma}, Yeni stok: ${parca.stokAdeti}`);
                
                // Teslim adet ve gerçek teslim tarihi bilgilerini sıfırla
                await fasonIsEmri.update({
                    teslim_adet: 0,
                    gercek_teslim_tarihi: null
                });
                console.log(`[DEBUG] Teslim bilgileri sıfırlandı`);
            }
        }
        
        // Eğer yeni durum tamamlandı ise ve önceden tamamlandı değilse stok güncelleme
        if (durum === 'tamamlandi' && fasonIsEmri.durum !== 'tamamlandi') {
            // Not: Doğrudan stok güncelleme yapmıyoruz, çünkü bu işlem teslimAlFasonIsEmri tarafından yapılacak
            console.log(`[DEBUG] Durum tamamlandı olarak işaretlendi fakat stok güncelleme işlemi teslim alma dialodu üzerinden yapılacak.`);
            
            // Bağlı iş emrini de tamamlandı olarak işaretle
            if (fasonIsEmri.is_emri_id) {
                try {
                    const IsEmri = require('../models/IsEmri');
                    const bagliIsEmri = await IsEmri.findByPk(fasonIsEmri.is_emri_id);
                    
                    if (bagliIsEmri && bagliIsEmri.durum === 'fason') {
                        const yeniHareket = `${new Date().toLocaleString('tr-TR')} - Fason iş emri tamamlandığı için 'tamamlandı' durumuna geçirildi`;
                        await bagliIsEmri.update({
                            durum: 'tamamlandı',
                            hareketler: [...bagliIsEmri.hareketler, yeniHareket]
                        });
                        console.log(`[DEBUG] Bağlı iş emri ${bagliIsEmri.is_emri_no} tamamlandı olarak işaretlendi`);
                    }
                } catch (error) {
                    console.error('Bağlı iş emri güncellenirken hata:', error);
                }
            }
        }
        
        // Durum güncelleniyor
        await fasonIsEmri.update({ durum });
        console.log(`[DEBUG] Fason durum güncellendi: ${durum}`);

        // Güncel fason iş emrini getir
        const updatedFasonIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });
        
        // İlgili parçanın güncel bilgilerini getir
        const updatedParca = await Parca.findByPk(fasonIsEmri.parca_kodu);
        
        res.status(200).json({
            message: 'Fason iş emri durumu güncellendi',
            fasonIsEmri: updatedFasonIsEmri,
            parcaStok: updatedParca ? updatedParca.stokAdeti : null
        });
    } catch (error) {
        console.error('[HATA] Fason iş emri durumu güncellenirken hata:', error);
        res.status(500).json({ 
            message: 'Fason iş emri durumu güncellenirken bir hata oluştu', 
            error: error.message 
        });
    }
};

// Ham malzeme gönderimi kaydet
exports.hamMalzemeGonder = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            ham_malzeme_miktari, 
            gonderim_irsaliye_no, 
            gonderen_kisi, 
            ham_malzeme_notlar,
            gonderim_tarihi 
        } = req.body;

        console.log(`[DEBUG] Ham malzeme gönderim isteği: ID=${id}`);

        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }

        // Ham malzeme bilgilerini güncelle
        await fasonIsEmri.update({
            ham_malzeme_gonderim_tarihi: gonderim_tarihi || new Date().toISOString().split('T')[0],
            ham_malzeme_durumu: 'gonderildi',
            ham_malzeme_miktari,
            gonderim_irsaliye_no,
            gonderen_kisi,
            ham_malzeme_notlar
            // durum alanını değiştirmiyoruz - ham malzeme gönderimi ana durum ile alakasız
        });

        const updatedFasonIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });

        res.status(200).json({ 
            message: 'Ham malzeme gönderimi kaydedildi', 
            fasonIsEmri: updatedFasonIsEmri
        });
    } catch (error) {
        console.error('Ham malzeme gönderimi kaydedilirken hata:', error);
        res.status(500).json({ message: 'Ham malzeme gönderimi kaydedilemedi', error: error.message });
    }
};

// Ham malzeme teslim et
exports.hamMalzemeTeslimEt = async (req, res) => {
    try {
        const { id } = req.params;
        const { teslim_sorumlusu, notlar } = req.body;

        console.log(`[DEBUG] Ham malzeme teslim: ID=${id}, Sorumlu=${teslim_sorumlusu}`);

        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }

        if (fasonIsEmri.ham_malzeme_durumu !== 'gonderildi') {
            return res.status(400).json({ message: 'Ham malzeme henüz gönderilmedi' });
        }

        const updateData = {
            ham_malzeme_durumu: 'teslim_edildi',
            ham_malzeme_teslim_tarihi: new Date(),
            ham_malzeme_teslim_sorumlusu: teslim_sorumlusu
            // ana durum değişikliği yapmıyoruz
        };

        if (notlar) {
            updateData.ham_malzeme_notlar = notlar;
        }

        await fasonIsEmri.update(updateData);

        const updatedFasonIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });

        res.status(200).json({ 
            message: 'Ham malzeme teslim edildi', 
            fasonIsEmri: updatedFasonIsEmri
        });
    } catch (error) {
        console.error('Ham malzeme teslim edilirken hata:', error);
        res.status(500).json({ message: 'Ham malzeme teslim edilemedi', error: error.message });
    }
};

// Ham malzeme durumunu güncelle
exports.hamMalzemeDurumGuncelle = async (req, res) => {
    try {
        const { id } = req.params;
        const { ham_malzeme_durumu } = req.body;

        console.log(`[DEBUG] Ham malzeme durum güncelleme: ID=${id}, Durum=${ham_malzeme_durumu}`);

        const fasonIsEmri = await FasonIsEmri.findByPk(id);
        if (!fasonIsEmri) {
            return res.status(404).json({ message: 'Fason işi bulunamadı' });
        }

        const updateData = { ham_malzeme_durumu };

        await fasonIsEmri.update(updateData);

        const updatedFasonIsEmri = await FasonIsEmri.findByPk(id, {
            include: [
                { model: Parca, as: 'parca' },
                { model: FasonTeklif, as: 'teklifler' },
                { model: FasonGrup, as: 'fason_grup' }
            ]
        });

        res.status(200).json({ 
            message: 'Ham malzeme durumu güncellendi', 
            fasonIsEmri: updatedFasonIsEmri
        });
    } catch (error) {
        console.error('Ham malzeme durumu güncellenirken hata:', error);
        res.status(500).json({ message: 'Ham malzeme durumu güncellenemedi', error: error.message });
    }
};

// Üretim planı için seçilebilir fason iş emirlerini getir
exports.getSelectableFasonIsEmirleri = async (req, res) => {
    try {
        const { 
            durum = 'beklemede,uretimde', 
            tamamlananlari_goster = 'false',
            excludePlanId,
            search,
            limit = 50,
            offset = 0 
        } = req.query;
        
        const where = {
            uretim_plani_id: null, // Henüz hiçbir üretim planına atanmamış fasonlar
        };
        
        // Durum filtresi
        if (durum) {
            let durumlar = durum.split(',');
            
            // Tamamlanan fasonları da dahil et
            if (tamamlananlari_goster === 'true') {
                if (!durumlar.includes('tamamlandi')) {
                    durumlar.push('tamamlandi');
                }
            }
            
            where.durum = { [Op.in]: durumlar };
        }
        
        // Arama filtresi
        if (search) {
            where[Op.or] = [
                { '$parca.parcaKodu$': { [Op.like]: `%${search}%` } },
                { '$parca.parcaAdi$': { [Op.like]: `%${search}%` } },
                { tedarikci: { [Op.like]: `%${search}%` } }
            ];
        }
        
        // Belirli bir planın fasonlarını hariç tut (düzenleme durumunda)
        if (excludePlanId) {
            where[Op.or] = [
                { uretim_plani_id: null },
                { uretim_plani_id: excludePlanId }
            ];
        }
        
        const fasonIsEmirleri = await FasonIsEmri.findAll({
            where,
            include: [
                { 
                    model: Parca, 
                    as: 'parca',
                    attributes: ['parcaKodu', 'parcaAdi', 'teknik_resim_path', 'foto_path']
                },
                { 
                    model: FasonGrup, 
                    as: 'fason_grup',
                    attributes: ['grup_adi', 'renk']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['verilis_tarihi', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            data: fasonIsEmirleri,
            total: fasonIsEmirleri.length
        });
    } catch (error) {
        console.error('Seçilebilir fason iş emirleri getirilirken hata:', error);
        res.status(500).json({ 
            success: false,
            message: 'Seçilebilir fason iş emirleri getirilirken hata oluştu', 
            error: error.message 
        });
    }
};

// Üretim planına bağlı fason iş emirlerini getir
exports.getFasonIsEmirleriByUretimPlani = async (req, res) => {
    try {
        const { uretim_plani_id } = req.params;
        
        const fasonIsEmirleri = await FasonIsEmri.findAll({
            where: {
                uretim_plani_id: uretim_plani_id
            },
            include: [
                { 
                    model: Parca, 
                    as: 'parca',
                    attributes: ['parca_kodu', 'parca_adi', 'foto_path']
                },
                { 
                    model: FasonGrup, 
                    as: 'fason_grup',
                    attributes: ['grup_adi', 'renk']
                }
            ],
            order: [['verilis_tarihi', 'DESC']]
        });
        
        res.status(200).json(fasonIsEmirleri);
    } catch (error) {
        console.error('Üretim planına bağlı fason iş emirleri getirilirken hata:', error);
        res.status(500).json({ 
            message: 'Üretim planına bağlı fason iş emirleri getirilirken hata oluştu', 
            error: error.message 
        });
    }
};
