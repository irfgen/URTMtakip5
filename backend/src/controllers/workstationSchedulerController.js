const db = require('../models');
const { TezgahZamanPlani, IsEmri, Tezgah } = db;
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Workstation Scheduler Controller
 * Tezgah İş Planı modülü için tüm API endpoint'leri
 */

// Timeline verilerini getir - Ana endpoint
exports.getSchedulerTimeline = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      workstationIds, 
      statuses 
    } = req.query;

    // Tarih validasyonu
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Başlangıç ve bitiş tarihleri gereklidir',
        code: 'MISSING_DATE_RANGE'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ 
        error: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır',
        code: 'INVALID_DATE_RANGE'
      });
    }

    // Filtreler
    const workstationFilter = workstationIds ? 
      workstationIds.split(',').map(id => parseInt(id)) : null;
    
    const statusFilter = statuses ? 
      statuses.split(',') : ['planli', 'devam_ediyor'];

    // Optimized query - Single query ile tüm veriyi çek
    const timelineQuery = `
      SELECT 
        t.tezgah_id,
        t.tezgah_tanimi,
        t.calisma_durumu,
        tz.id as task_id,
        tz.baslangic_zamani,
        tz.bitis_zamani,
        tz.planlanan_sure_dakika,
        tz.gerceklesen_sure_dakika,
        tz.durum as task_status,
        tz.oncelik,
        tz.notlar,
        ie.is_emri_id,
        ie.is_emri_no,
        ie.is_adi,
        ie.parca_kodu,
        ie.adet,
        ie.durum as is_emri_status,
        ie.oncelik as is_emri_oncelik,
        ie.teslim_tarihi
      FROM tezgahlar t
      LEFT JOIN tezgah_zaman_plani tz ON t.tezgah_id = tz.tezgah_id 
        AND tz.baslangic_zamani <= ? 
        AND tz.bitis_zamani >= ?
        AND tz.durum IN (${statusFilter.map(() => '?').join(',')})
      LEFT JOIN is_emirleri ie ON tz.is_emri_id = ie.is_emri_id
      WHERE (? IS NULL OR t.tezgah_id IN (${workstationFilter ? workstationFilter.map(() => '?').join(',') : 'NULL'}))
      ORDER BY t.tezgah_id, tz.baslangic_zamani
    `;

    const queryParams = [
      end.toISOString(), 
      start.toISOString(), 
      ...statusFilter,
      workstationFilter ? 1 : null,
      ...(workstationFilter || [])
    ];

    const rawData = await sequelize.query(timelineQuery, {
      replacements: queryParams,
      type: QueryTypes.SELECT
    });

    // Veriyi workstation bazında grupla
    const workstationMap = new Map();

    rawData.forEach(row => {
      const workstationId = row.tezgah_id;
      
      if (!workstationMap.has(workstationId)) {
        workstationMap.set(workstationId, {
          workstation_id: workstationId,
          workstation_name: row.tezgah_tanimi,
          workstation_status: row.calisma_durumu,
          tasks: []
        });
      }

      // Task varsa ekle
      if (row.task_id) {
        const task = {
          id: row.task_id,
          task_id: `scheduler_task_${row.task_id}`,
          workstation_id: workstationId,
          work_order_id: row.is_emri_id,
          start_time: row.baslangic_zamani,
          end_time: row.bitis_zamani,
          planned_duration_minutes: row.planlanan_sure_dakika,
          actual_duration_minutes: row.gerceklesen_sure_dakika,
          status: row.task_status,
          priority: row.oncelik,
          notes: row.notlar,
          work_order: {
            id: row.is_emri_id,
            number: row.is_emri_no,
            name: row.is_adi,
            part_code: row.parca_kodu,
            quantity: row.adet,
            status: row.is_emri_status,
            priority: row.is_emri_oncelik,
            delivery_date: row.teslim_tarihi
          }
        };

        workstationMap.get(workstationId).tasks.push(task);
      }
    });

    const timelineData = Array.from(workstationMap.values());

    // İstatistikler hesapla
    const totalTasks = timelineData.reduce((sum, ws) => sum + ws.tasks.length, 0);
    const busyWorkstations = timelineData.filter(ws => ws.tasks.length > 0).length;

    res.json({
      timeline_data: timelineData,
      date_range: {
        start: start,
        end: end
      },
      statistics: {
        total_workstations: timelineData.length,
        busy_workstations: busyWorkstations,
        total_tasks: totalTasks,
        utilization_rate: timelineData.length > 0 ? 
          Math.round((busyWorkstations / timelineData.length) * 100) : 0
      },
      filters_applied: {
        workstation_ids: workstationFilter,
        statuses: statusFilter
      }
    });

  } catch (error) {
    console.error('Timeline verileri getirilirken hata:', error);
    res.status(500).json({ 
      error: 'Timeline verileri alınamadı',
      code: 'TIMELINE_FETCH_ERROR',
      message: error.message 
    });
  }
};

// Yeni planlama oluştur
exports.createScheduledTask = async (req, res) => {
  try {
    const {
      tezgah_id,
      is_emri_id,
      baslangic_zamani,
      bitis_zamani,
      oncelik = 1,
      notlar
    } = req.body;

    // Validation
    if (!tezgah_id || !is_emri_id || !baslangic_zamani || !bitis_zamani) {
      return res.status(400).json({
        error: 'Tezgah ID, İş Emri ID, başlangıç ve bitiş zamanları gereklidir',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const startTime = new Date(baslangic_zamani);
    const endTime = new Date(bitis_zamani);

    if (startTime >= endTime) {
      return res.status(400).json({
        error: 'Bitiş zamanı başlangıç zamanından sonra olmalıdır',
        code: 'INVALID_TIME_RANGE'
      });
    }

    // Çakışma kontrolü
    const conflicts = await TezgahZamanPlani.findConflicts(
      tezgah_id, 
      baslangic_zamani, 
      bitis_zamani
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Bu zaman aralığında çakışan planlama bulundu',
        code: 'TIME_CONFLICT',
        conflicts: conflicts.map(c => ({
          id: c.id,
          work_order: c.isEmri?.is_emri_no,
          start_time: c.baslangic_zamani,
          end_time: c.bitis_zamani
        }))
      });
    }

    // Süreyi hesapla
    const plannedDuration = Math.round((endTime - startTime) / (1000 * 60));

    // Yeni planlama oluştur
    const newSchedule = await TezgahZamanPlani.create({
      tezgah_id,
      is_emri_id,
      baslangic_zamani: startTime,
      bitis_zamani: endTime,
      planlanan_sure_dakika: plannedDuration,
      oncelik: oncelik || 1,
      notlar: notlar || null,
      durum: 'planli'
    });

    // İş emri durumunu güncelle
    await IsEmri.update(
      { 
        plan_durumu: 'planlandi',
        plan_baslangic: startTime,
        plan_bitis: endTime
      },
      { where: { is_emri_id } }
    );

    // İlişkili verilerle birlikte döndür
    const createdTask = await TezgahZamanPlani.findByPk(newSchedule.id, {
      include: [
        { model: IsEmri, as: 'isEmri' },
        { model: Tezgah, as: 'tezgah' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Planlama başarıyla oluşturuldu',
      task: createdTask.toSchedulerFormat()
    });

  } catch (error) {
    console.error('Planlama oluşturulurken hata:', error);
    res.status(500).json({
      error: 'Planlama oluşturulamadı',
      code: 'CREATE_SCHEDULE_ERROR',
      message: error.message
    });
  }
};

// Planlamayı güncelle (drag & drop için)
exports.updateScheduledTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      baslangic_zamani,
      bitis_zamani,
      tezgah_id,
      oncelik,
      notlar
    } = req.body;

    const existingTask = await TezgahZamanPlani.findByPk(taskId);
    if (!existingTask) {
      return res.status(404).json({
        error: 'Planlama bulunamadı',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Güncellenecek alanları belirle
    const updateData = {};
    
    if (baslangic_zamani) updateData.baslangic_zamani = new Date(baslangic_zamani);
    if (bitis_zamani) updateData.bitis_zamani = new Date(bitis_zamani);
    if (tezgah_id) updateData.tezgah_id = tezgah_id;
    if (oncelik !== undefined) updateData.oncelik = oncelik;
    if (notlar !== undefined) updateData.notlar = notlar;

    // Zaman değişikliği varsa çakışma kontrolü
    if (baslangic_zamani || bitis_zamani || tezgah_id) {
      const startTime = updateData.baslangic_zamani || existingTask.baslangic_zamani;
      const endTime = updateData.bitis_zamani || existingTask.bitis_zamani;
      const workstationId = updateData.tezgah_id || existingTask.tezgah_id;

      const conflicts = await TezgahZamanPlani.findConflicts(
        workstationId,
        startTime,
        endTime,
        taskId // Mevcut task'ı hariç tut
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: 'Güncelleme çakışan planlama oluşturacak',
          code: 'TIME_CONFLICT',
          conflicts: conflicts.map(c => ({
            id: c.id,
            work_order: c.isEmri?.is_emri_no,
            start_time: c.baslangic_zamani,
            end_time: c.bitis_zamani
          }))
        });
      }

      // Süreyi yeniden hesapla
      updateData.planlanan_sure_dakika = Math.round((endTime - startTime) / (1000 * 60));
    }

    // Güncelleme zamanını ekle
    updateData.guncelleme_tarihi = new Date();

    // Güncelle
    await existingTask.update(updateData);

    // İş emri planını da güncelle
    if (baslangic_zamani || bitis_zamani) {
      await IsEmri.update(
        {
          plan_baslangic: updateData.baslangic_zamani || existingTask.baslangic_zamani,
          plan_bitis: updateData.bitis_zamani || existingTask.bitis_zamani
        },
        { where: { is_emri_id: existingTask.is_emri_id } }
      );
    }

    // Güncellenmiş veriyi döndür
    const updatedTask = await TezgahZamanPlani.findByPk(taskId, {
      include: [
        { model: IsEmri, as: 'isEmri' },
        { model: Tezgah, as: 'tezgah' }
      ]
    });

    res.json({
      success: true,
      message: 'Planlama başarıyla güncellendi',
      task: updatedTask.toSchedulerFormat()
    });

  } catch (error) {
    console.error('Planlama güncellenirken hata:', error);
    res.status(500).json({
      error: 'Planlama güncellenemedi',
      code: 'UPDATE_SCHEDULE_ERROR',
      message: error.message
    });
  }
};

// Planlamayı sil
exports.deleteScheduledTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const existingTask = await TezgahZamanPlani.findByPk(taskId);
    if (!existingTask) {
      return res.status(404).json({
        error: 'Planlama bulunamadı',
        code: 'TASK_NOT_FOUND'
      });
    }

    const isEmriId = existingTask.is_emri_id;

    // Planlamayı sil
    await existingTask.destroy();

    // İş emri durumunu güncelle
    await IsEmri.update(
      { 
        plan_durumu: 'planlanmadi',
        plan_baslangic: null,
        plan_bitis: null
      },
      { where: { is_emri_id: isEmriId } }
    );

    res.json({
      success: true,
      message: 'Planlama başarıyla silindi',
      deleted_task_id: taskId
    });

  } catch (error) {
    console.error('Planlama silinirken hata:', error);
    res.status(500).json({
      error: 'Planlama silinemedi',
      code: 'DELETE_SCHEDULE_ERROR',
      message: error.message
    });
  }
};

// Çakışma analizi
exports.getConflicts = async (req, res) => {
  try {
    const { startDate, endDate, workstationIds } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Başlangıç ve bitiş tarihleri gereklidir',
        code: 'MISSING_DATE_RANGE'
      });
    }

    // Çakışan planlamaları bul
    const conflictQuery = `
      SELECT 
        t1.id as task1_id,
        t2.id as task2_id,
        t1.tezgah_id,
        t1.baslangic_zamani as t1_start,
        t1.bitis_zamani as t1_end,
        t2.baslangic_zamani as t2_start,
        t2.bitis_zamani as t2_end,
        ie1.is_emri_no as task1_work_order,
        ie2.is_emri_no as task2_work_order
      FROM tezgah_zaman_plani t1
      INNER JOIN tezgah_zaman_plani t2 ON t1.tezgah_id = t2.tezgah_id AND t1.id < t2.id
      LEFT JOIN is_emirleri ie1 ON t1.is_emri_id = ie1.is_emri_id
      LEFT JOIN is_emirleri ie2 ON t2.is_emri_id = ie2.is_emri_id
      WHERE t1.baslangic_zamani < t2.bitis_zamani 
        AND t2.baslangic_zamani < t1.bitis_zamani
        AND t1.durum IN ('planli', 'devam_ediyor')
        AND t2.durum IN ('planli', 'devam_ediyor')
        AND t1.baslangic_zamani >= ?
        AND t1.bitis_zamani <= ?
      ORDER BY t1.tezgah_id, t1.baslangic_zamani
    `;

    const conflicts = await sequelize.query(conflictQuery, {
      replacements: [startDate, endDate],
      type: QueryTypes.SELECT
    });

    res.json({
      conflicts: conflicts,
      total_conflicts: conflicts.length,
      date_range: { startDate, endDate }
    });

  } catch (error) {
    console.error('Çakışma analizi hatası:', error);
    res.status(500).json({
      error: 'Çakışma analizi yapılamadı',
      code: 'CONFLICT_ANALYSIS_ERROR',
      message: error.message
    });
  }
};

// Dashboard istatistikleri
exports.getSchedulerStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // İstatistik sorguları
    const stats = await Promise.all([
      // Toplam planlama sayısı
      TezgahZamanPlani.count({
        where: {
          baslangic_zamani: { [Op.between]: [start, end] }
        }
      }),
      
      // Durum bazında dağılım
      TezgahZamanPlani.findAll({
        attributes: [
          'durum',
          [sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          baslangic_zamani: { [Op.between]: [start, end] }
        },
        group: ['durum'],
        raw: true
      }),

      // Tezgah kullanım oranları
      sequelize.query(`
        SELECT 
          t.tezgah_id,
          t.tezgah_tanimi,
          COUNT(tz.id) as task_count,
          SUM(tz.planlanan_sure_dakika) as total_planned_minutes
        FROM tezgahlar t
        LEFT JOIN tezgah_zaman_plani tz ON t.tezgah_id = tz.tezgah_id 
          AND tz.baslangic_zamani BETWEEN ? AND ?
        GROUP BY t.tezgah_id, t.tezgah_tanimi
        ORDER BY task_count DESC
      `, {
        replacements: [start, end],
        type: QueryTypes.SELECT
      })
    ]);

    const [totalTasks, statusDistribution, workstationUsage] = stats;

    // Durum dağılımını obje formatına çevir
    const statusMap = {};
    statusDistribution.forEach(item => {
      statusMap[item.durum] = parseInt(item.count);
    });

    res.json({
      date_range: { start, end },
      summary: {
        total_tasks: totalTasks,
        status_distribution: statusMap,
        total_workstations: workstationUsage.length,
        busy_workstations: workstationUsage.filter(w => w.task_count > 0).length
      },
      workstation_usage: workstationUsage
    });

  } catch (error) {
    console.error('İstatistik verileri alınırken hata:', error);
    res.status(500).json({
      error: 'İstatistikler alınamadı',
      code: 'STATISTICS_ERROR',
      message: error.message
    });
  }
};