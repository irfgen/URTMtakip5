const { Op } = require('sequelize');
const Tezgah = require('../models/Tezgah');
const IsEmri = require('../models/IsEmri');
const IslemKaydi = require('../models/IslemKaydi');

/**
 * İş emrini tezgaha atar ve tüm yan etkileri yönetir (kanonik akış).
 * - Çakışan tezgahlardan temizler ve onların durumunu günceller
 * - İşlem kaydı oluşturur (başlatma/devam)
 * - İş emrini 'tezgahta' yapar, tezgah_bilgisi ve hareket ekler
 * - Tezgahın is_emirleri listesine ekler ve calisma_durumu'nu 'calisiyor' yapar
 * - Planlanan işlerden siler
 *
 * @param {number} tezgahId
 * @param {number} isEmriId
 * @returns {Promise<{tezgah: any, isEmri: any}>}
 */
async function assignIsEmriToTezgah(tezgahId, isEmriId) {
  if (!tezgahId || !isEmriId) {
    throw new Error('Geçersiz parametre: tezgahId ve isEmriId zorunludur');
  }

  const tezgah = await Tezgah.findByPk(tezgahId);
  if (!tezgah) {
    throw new Error('Tezgah bulunamadı');
  }

  const isEmri = await IsEmri.findByPk(isEmriId);
  if (!isEmri) {
    throw new Error('İş emri bulunamadı');
  }

  // 1) Aynı iş başka tezgahlardaysa çıkar ve durumlarını güncelle
  const digerTezgahlar = await Tezgah.findAll({
    where: { tezgah_id: { [Op.ne]: tezgahId } }
  });

  for (const digerTezgah of digerTezgahlar) {
    if (digerTezgah.is_emirleri && Array.isArray(digerTezgah.is_emirleri)) {
      const filtrelenmisIsEmirleri = digerTezgah.is_emirleri.filter(
        item => item.is_emri_id !== parseInt(isEmriId)
      );
      if (filtrelenmisIsEmirleri.length !== digerTezgah.is_emirleri.length) {
        await digerTezgah.update({
          is_emirleri: filtrelenmisIsEmirleri,
          calisma_durumu: filtrelenmisIsEmirleri.length > 0 ? 'calisiyor' : 'musait'
        });
      }
    }
  }

  // 2) İşlem tipi: devam/baslatma
  let islemTipi = 'baslatma';
  if (isEmri.tezgah_bilgisi && isEmri.tezgah_bilgisi.son_tezgah_id === parseInt(tezgahId)) {
    islemTipi = 'devam';
  }

  // 3) İşlem kaydı oluştur (best-effort)
  try {
    await IslemKaydi.create({
      is_emri_no: isEmri.is_emri_no,
      tezgah_id: tezgah.tezgah_id,
      islem_tipi: islemTipi,
      islenen_adet: null,
      aciklama: islemTipi === 'devam'
        ? `${tezgah.tezgah_tanimi} tezgahında işe devam edildi`
        : `${tezgah.tezgah_tanimi} tezgahında iş başlatıldı`
    });
  } catch (err) {
    console.error('İşlem kaydı oluşturma hatası (görmezden gelindi):', err.message);
  }

  // 4) İş emrini güncelle
  const yeniDurum = 'tezgahta';
  await isEmri.update({
    durum: yeniDurum,
    tezgah_id: tezgah.tezgah_id,
    tezgah_bilgisi: {
      tezgah_id: tezgah.tezgah_id,
      tezgah_adi: tezgah.tezgah_tanimi,
      atama_tarihi: new Date()
    },
    hareketler: [
      ...(isEmri.hareketler || []),
      `${new Date().toLocaleString('tr-TR')} - ${tezgah.tezgah_tanimi} tezgahına atandı (${yeniDurum})`
    ]
  });

  // 4.1) Aynı tezgaha bağlı (tamamlanmamış) diğer işlerin tezgah_id bilgisini boşalt (temizlik)
  try {
    await IsEmri.update(
      { tezgah_id: null },
      {
        where: {
          tezgah_id: parseInt(tezgahId),
          is_emri_id: { [Op.ne]: parseInt(isEmriId) },
          durum: { [Op.notIn]: ['tamamlandı', 'iptal'] }
        }
      }
    );
  } catch (clearErr) {
    console.warn('Önceki işlerin tezgah_id temizleme uyarısı:', clearErr.message);
  }

  // 5) Tezgahın iş listesine ekle ve çalışıyor yap
  let tezgahIsEmirleri = tezgah.is_emirleri || [];
  if (!tezgahIsEmirleri.some(item => item.is_emri_id === isEmri.is_emri_id)) {
    tezgahIsEmirleri = [
      ...tezgahIsEmirleri,
      {
        is_emri_id: isEmri.is_emri_id,
        is_emri_no: isEmri.is_emri_no,
        is_adi: isEmri.is_adi,
        plan_liste_no: isEmri.plan_liste_no,
        parca_kodu: isEmri.parca_kodu,
        parca_adi: isEmri.parca_adi,
        toplam_adet: isEmri.adet,
        islenen_adet: 0,
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi,
        atama_tarihi: new Date()
      }
    ];
  }

  await tezgah.update({
    is_emirleri: tezgahIsEmirleri,
    calisma_durumu: 'calisiyor'
  });

  // 6) Planlanan işlerden sil
  try {
    const { TezgahPlanlananIsler } = require('../models');
    if (TezgahPlanlananIsler) {
      await TezgahPlanlananIsler.destroy({ where: { is_emri_id: isEmri.is_emri_id } });
    }
  } catch (planErr) {
    console.error('Planlanan işlerden silme hatası (görmezden gelindi):', planErr.message);
  }

  return { tezgah, isEmri };
}

module.exports = {
  assignIsEmriToTezgah
};


