const { sequelize } = require('../config/database');

/**
 * Tezgah Timeline Raporu
 * GET /api/tezgah/rapor/timeline?tezgah_id=...&tarih=YYYY-MM-DD
 */
exports.getTezgahTimeline = async (req, res) => {
  try {
    const tezgahId = parseInt(req.query.tezgah_id);
    const tarih = req.query.tarih || new Date().toISOString().split('T')[0];

    if (!tezgahId || Number.isNaN(tezgahId)) {
      return res.status(400).json({ success: false, message: 'tezgah_id zorunludur' });
    }

    // Run segmentleri: parca_isleme_kayitlari + is_emirleri join
    const runQuery = `
      SELECT pik.id, pik.is_emri_id, pik.baslangic_zamani, pik.bitis_zamani, pik.isleme_suresi_dakika,
             ie.is_emri_no, ie.parca_kodu
      FROM parca_isleme_kayitlari pik
      LEFT JOIN is_emirleri ie ON ie.is_emri_id = pik.is_emri_id
      WHERE pik.tezgah_id = ?
        AND DATE(pik.baslangic_zamani) = ?
      ORDER BY pik.baslangic_zamani ASC
    `;

    const [runs] = await sequelize.query(runQuery, {
      replacements: [tezgahId, tarih]
    });

    // Yardımcı: ISO string → Date
    const toDate = (val) => (val ? new Date(val) : null);
    const toISO = (d) => (d ? new Date(d).toISOString() : null);

    // Gün başlangıcı ve sonu
    const dayStart = new Date(`${tarih}T00:00:00.000Z`);
    const dayEnd = new Date(`${tarih}T23:59:59.999Z`);

    // Run segmentlerini normalize et
    const runSegments = (runs || []).map((r) => {
      const start = toDate(r.baslangic_zamani);
      const end = toDate(r.bitis_zamani);
      // Dakika hesaplamasını güvence altına al (en az 1)
      const minutes = Math.max(1, Math.round(((end - start) / 1000) / 60));
      return {
        type: 'run',
        start: toISO(start),
        end: toISO(end),
        minutes,
        is_emri_id: r.is_emri_id,
        is_emri_no: r.is_emri_no || null,
        parca_kodu: r.parca_kodu || null
      };
    });

    // Stop segmentlerini üret: run'lar arasındaki boşluklar
    const timeline = [];
    let cursor = dayStart;

    for (const seg of runSegments) {
      const segStart = new Date(seg.start);
      if (segStart > cursor) {
        const gapMinutes = Math.max(0, Math.round(((segStart - cursor) / 1000) / 60));
        if (gapMinutes > 0) {
          timeline.push({
            type: 'stop',
            start: toISO(cursor),
            end: toISO(segStart),
            minutes: gapMinutes
          });
        }
      }
      timeline.push(seg);
      const segEnd = new Date(seg.end);
      if (segEnd > cursor) cursor = segEnd;
    }

    if (cursor < dayEnd) {
      const tailMinutes = Math.max(0, Math.round(((dayEnd - cursor) / 1000) / 60));
      if (tailMinutes > 0) {
        timeline.push({
          type: 'stop',
          start: toISO(cursor),
          end: toISO(dayEnd),
          minutes: tailMinutes
        });
      }
    }

    // Başta hiç run yoksa tüm gün stop
    if (runSegments.length === 0) {
      const allMinutes = Math.max(0, Math.round(((dayEnd - dayStart) / 1000) / 60));
      if (allMinutes > 0) {
        timeline.push({
          type: 'stop',
          start: toISO(dayStart),
          end: toISO(dayEnd),
          minutes: allMinutes
        });
      }
    }

    return res.json({ success: true, tezgah_id: tezgahId, tarih, timeline });
  } catch (error) {
    console.error('Tezgah timeline raporu hatası:', error);
    return res.status(500).json({ success: false, message: 'Timeline alınamadı', error: error.message });
  }
};


