const db = require('../models');
const TezgahPlanlananIsler = db.TezgahPlanlananIsler;
const IsEmri = db.IsEmri;
const Tezgah = db.Tezgah;
const Vardiya = db.Vardiya;
const { Op } = require('sequelize');

// Tezgah timeline verilerini getir
exports.getTimelineData = async (req, res) => {
  try {
    const { startDate, endDate, tezgahIds } = req.query;
    
    // Tarih validasyonu
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Başlangıç ve bitiş tarihleri gereklidir' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ error: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır' });
    }

    // Tezgah filtreleme
    const tezgahFilter = tezgahIds ? 
      { tezgah_id: { [Op.in]: tezgahIds.split(',').map(id => parseInt(id)) } } : 
      {};

    // Tezgahları getir
    const tezgahlar = await Tezgah.findAll({
      where: tezgahFilter,
      order: [['tezgah_tanimi', 'ASC']]
    });

    // Her tezgah için timeline verileri oluştur
    const timelineData = await Promise.all(tezgahlar.map(async (tezgah) => {
      // Bu tezgah için planlanan işleri getir
      const planlananIsler = await TezgahPlanlananIsler.findAll({
        where: { tezgah_id: tezgah.tezgah_id },
        include: [{
          model: IsEmri,
          as: 'isEmri',
          where: {
            durum: { [Op.ne]: 'Tamamlandi' }
          }
        }],
        order: [['sira_no', 'ASC']]
      });

      // Timeline görevleri oluştur
      let currentDate = new Date(start);
      const tasks = [];

      for (const planItem of planlananIsler) {
        const isEmri = planItem.isEmri;
        const duration = isEmri.is_zaman_uzunlugu || 1.0; // saat cinsinden
        
        const task = {
          id: `task_${tezgah.tezgah_id}_${isEmri.is_emri_id}`,
          name: `${isEmri.is_emri_no} - ${isEmri.is_adi}`,
          start: new Date(currentDate),
          end: new Date(currentDate.getTime() + (duration * 60 * 60 * 1000)), // saati milisaniyeye çevir
          progress: 0,
          type: 'task',
          workstation: tezgah.tezgah_tanimi,
          workstation_id: tezgah.tezgah_id,
          work_order_id: isEmri.is_emri_id,
          work_order_no: isEmri.is_emri_no,
          priority: isEmri.oncelik,
          duration: duration,
          material: isEmri.malzeme,
          parca_kodu: isEmri.parca_kodu, // Parça kodu eklendi
          quantity: isEmri.adet,
          delivery_date: isEmri.teslim_tarihi,
          sira_no: planItem.sira_no,
          status: isEmri.durum
        };

        tasks.push(task);
        
        // Sonraki iş için tarih güncelle
        currentDate = new Date(task.end);
      }

      return {
        workstation_id: tezgah.tezgah_id,
        workstation_name: tezgah.tezgah_tanimi,
        tasks: tasks
      };
    }));

    res.json({
      timelineData,
      dateRange: {
        start: start,
        end: end
      }
    });

  } catch (error) {
    console.error('Timeline verileri getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Vardiya tabanlı timeline verilerini getir
exports.getShiftBasedTimeline = async (req, res) => {
  try {
    const { startDate, endDate, tezgahIds, vardiyaId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Başlangıç ve bitiş tarihleri gereklidir' });
    }

    // Vardiya bilgilerini getir
    const vardiyaFilter = vardiyaId ? { id: vardiyaId } : {};
    const vardiyalar = await Vardiya.findAll({
      where: vardiyaFilter,
      order: [['baslangic_saati', 'ASC']]
    });

    // Temel timeline verilerini hazırla (getTimelineData mantığını tekrar kullan)
    const tezgahFilter = tezgahIds ? 
      { tezgah_id: { [Op.in]: tezgahIds.split(',').map(id => parseInt(id)) } } : 
      {};

    const tezgahlar = await Tezgah.findAll({
      where: tezgahFilter,
      order: [['tezgah_tanimi', 'ASC']]
    });

    // Vardiya tabanlı timeline verileri oluştur - Her tezgah için görevleri vardiya bazında düzenle
    const timelineData = [];
    
    // Her tezgah için timeline verileri oluştur
    for (const tezgah of tezgahlar) {
      // Bu tezgah için planlanan işleri getir
      const planlananIsler = await TezgahPlanlananIsler.findAll({
        where: { tezgah_id: tezgah.tezgah_id },
        include: [{
          model: IsEmri,
          as: 'isEmri',
          where: {
            durum: { [Op.ne]: 'Tamamlandi' }
          }
        }],
        order: [['sira_no', 'ASC']]
      });

      // Bu tezgah için görevleri vardiya saatlerine uygun şekilde düzenle
      const tasks = [];
      
      // Tarih aralığındaki her gün için
      let currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Bu gün için her vardiya
        for (const vardiya of vardiyalar) {
          // Vardiya saatlerini hesapla
          const vardiyaBaslangic = new Date(currentDate);
          const [basSaat, basDakika] = vardiya.baslangic_saati.split(':');
          vardiyaBaslangic.setHours(parseInt(basSaat), parseInt(basDakika), 0, 0);

          const vardiyaBitis = new Date(currentDate);
          const [bitSaat, bitDakika] = vardiya.bitis_saati.split(':');
          vardiyaBitis.setHours(parseInt(bitSaat), parseInt(bitDakika), 0, 0);

          // Eğer bitiş saati başlangıç saatinden küçükse, ertesi güne geçer (gece vardiyası)
          if (vardiyaBitis <= vardiyaBaslangic) {
            vardiyaBitis.setDate(vardiyaBitis.getDate() + 1);
          }

          // Bu vardiya dönemindeki işleri ekle
          let currentTaskTime = new Date(vardiyaBaslangic);
          let taskIndex = 0;
          
          for (const planItem of planlananIsler) {
            if (taskIndex >= 2) break; // Her vardiyaya max 2 iş emri
            
            const isEmri = planItem.isEmri;
            const duration = Math.min(isEmri.is_zaman_uzunlugu || 1.0, 8); // Max 8 saat
            const taskEndTime = new Date(currentTaskTime.getTime() + (duration * 60 * 60 * 1000));

            // Vardiya süresini aşmayacak şekilde ayarla
            const actualEnd = new Date(Math.min(taskEndTime, vardiyaBitis));
            
            const task = {
              id: `shift_task_${dateStr}_${vardiya.id}_${tezgah.tezgah_id}_${isEmri.is_emri_id}_${taskIndex}`,
              name: `${isEmri.is_emri_no} - ${isEmri.is_adi}`,
              start: new Date(currentTaskTime),
              end: actualEnd,
              progress: 0,
              type: 'shift-task',
              workstation: `${tezgah.tezgah_tanimi} (${vardiya.vardiya_adi})`,
              workstation_id: tezgah.tezgah_id,
              shift_id: vardiya.id,
              shift_name: vardiya.vardiya_adi,
              shift_date: dateStr,
              work_order_id: isEmri.is_emri_id,
              work_order_no: isEmri.is_emri_no,
              priority: isEmri.oncelik,
              duration: duration,
              material: isEmri.malzeme,
              parca_kodu: isEmri.parca_kodu,
              quantity: isEmri.adet,
              delivery_date: isEmri.teslim_tarihi,
              sira_no: planItem.sira_no,
              status: isEmri.durum,
              shift_color: vardiya.renk || '#1976d2'
            };

            tasks.push(task);
            currentTaskTime = new Date(actualEnd);
            taskIndex++;
            
            // Vardiya zamanı dolduysa dur
            if (currentTaskTime >= vardiyaBitis) {
              break;
            }
          }
        }
        
        // Bir sonraki güne geç
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Tezgahı timeline'a ekle
      timelineData.push({
        workstation_id: tezgah.tezgah_id,
        workstation_name: tezgah.tezgah_tanimi,
        base_workstation_id: tezgah.tezgah_id,
        base_workstation_name: tezgah.tezgah_tanimi,
        tasks: tasks
      });
    }

    res.json({
      timelineData,
      shifts: vardiyalar,
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    });

  } catch (error) {
    console.error('Vardiya tabanlı timeline verileri getirilirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Timeline verilerini güncelle (drag & drop için)
exports.updateTimelineTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newStart, newEnd, newWorkstationId } = req.body;

    // Task ID'den iş emri ID'sini çıkar
    const [, workstationId, workOrderId] = taskId.split('_');

    if (!workOrderId) {
      return res.status(400).json({ error: 'Geçersiz task ID' });
    }

    // Yeni süreyi hesapla
    const start = new Date(newStart);
    const end = new Date(newEnd);
    const newDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // saat cinsinden

    // İş emri süresini güncelle
    await IsEmri.update(
      { is_zaman_uzunlugu: newDuration },
      { where: { is_emri_id: workOrderId } }
    );

    // Eğer tezgah değişmişse
    if (newWorkstationId && newWorkstationId !== workstationId) {
      // Eski tezgahtan kaldır
      await TezgahPlanlananIsler.destroy({
        where: {
          tezgah_id: workstationId,
          is_emri_id: workOrderId
        }
      });

      // Yeni tezgaha ekle
      const lastOrder = await TezgahPlanlananIsler.max('sira_no', {
        where: { tezgah_id: newWorkstationId }
      });

      await TezgahPlanlananIsler.create({
        tezgah_id: newWorkstationId,
        is_emri_id: workOrderId,
        sira_no: (lastOrder || 0) + 10
      });
    }

    res.json({
      success: true,
      message: 'Timeline görevi başarıyla güncellendi',
      updatedTask: {
        id: taskId,
        newStart,
        newEnd,
        newDuration,
        newWorkstationId
      }
    });

  } catch (error) {
    console.error('Timeline görevi güncellenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Timeline görevlerinin sırasını güncelle
exports.updateTaskOrder = async (req, res) => {
  try {
    const { tezgahId } = req.params;
    const { taskOrder } = req.body; // [{ is_emri_id: 1, sira_no: 10 }, ...]

    if (!taskOrder || !Array.isArray(taskOrder)) {
      return res.status(400).json({ error: 'Görev sıralaması gereklidir' });
    }

    // Tezgah planında sıra güncellemeleri
    for (const item of taskOrder) {
      await TezgahPlanlananIsler.update(
        { sira_no: item.sira_no },
        {
          where: {
            tezgah_id: tezgahId,
            is_emri_id: item.is_emri_id
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Görev sıralaması başarıyla güncellendi',
      updatedCount: taskOrder.length
    });

  } catch (error) {
    console.error('Görev sıralaması güncellenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Timeline görevini sil
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Task ID'den iş emri ID'sini çıkar
    const [, workstationId, workOrderId] = taskId.split('_');

    if (!workOrderId) {
      return res.status(400).json({ error: 'Geçersiz task ID' });
    }

    // İş emrini planlamadan kaldır
    const deleteResult = await TezgahPlanlananIsler.destroy({
      where: {
        is_emri_id: workOrderId,
        tezgah_id: workstationId
      }
    });

    if (deleteResult === 0) {
      return res.status(404).json({ error: 'Silinecek görev bulunamadı' });
    }

    res.json({
      success: true,
      message: 'Görev başarıyla silindi',
      deletedTaskId: taskId
    });

  } catch (error) {
    console.error('Görev silinirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Timeline görevini kopyala
exports.duplicateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { targetWorkstationId, targetStartTime } = req.body;

    // Task ID'den iş emri ID'sini çıkar
    const [, , workOrderId] = taskId.split('_');

    if (!workOrderId) {
      return res.status(400).json({ error: 'Geçersiz task ID' });
    }

    // Orijinal iş emrini bul
    const originalIsEmri = await IsEmri.findByPk(workOrderId);
    if (!originalIsEmri) {
      return res.status(404).json({ error: 'Kopyalanacak iş emri bulunamadı' });
    }

    // Yeni iş emri oluştur
    const newIsEmriData = {
      ...originalIsEmri.toJSON(),
      is_emri_no: `${originalIsEmri.is_emri_no}_COPY_${Date.now()}`,
      is_emri_id: undefined // Yeni ID oluşturulsun
    };

    const newIsEmri = await IsEmri.create(newIsEmriData);

    // Hedef tezgaha ekle
    const targetTezgahId = targetWorkstationId || originalIsEmri.tezgah_id;
    const lastOrder = await TezgahPlanlananIsler.max('sira_no', {
      where: { tezgah_id: targetTezgahId }
    });

    await TezgahPlanlananIsler.create({
      tezgah_id: targetTezgahId,
      is_emri_id: newIsEmri.is_emri_id,
      sira_no: (lastOrder || 0) + 10
    });

    res.json({
      success: true,
      message: 'Görev başarıyla kopyalandı',
      newTaskId: `task_${targetTezgahId}_${newIsEmri.is_emri_id}`,
      newWorkOrderId: newIsEmri.is_emri_id
    });

  } catch (error) {
    console.error('Görev kopyalanırken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// İş emri durumunu güncelle
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newStatus } = req.body;

    // Task ID'den iş emri ID'sini çıkar
    const [, , workOrderId] = taskId.split('_');

    if (!workOrderId) {
      return res.status(400).json({ error: 'Geçersiz task ID' });
    }

    // İş emri durumunu güncelle
    const [updateCount] = await IsEmri.update(
      { durum: newStatus },
      { where: { is_emri_id: workOrderId } }
    );

    if (updateCount === 0) {
      return res.status(404).json({ error: 'Güncellenecek iş emri bulunamadı' });
    }

    res.json({
      success: true,
      message: 'İş emri durumu başarıyla güncellendi',
      taskId: taskId,
      newStatus: newStatus
    });

  } catch (error) {
    console.error('İş emri durumu güncellenirken hata:', error);
    res.status(500).json({ error: error.message });
  }
};

// Timeline raporu oluştur
exports.getTimelineReport = async (req, res) => {
  try {
    const { startDate, endDate, tezgahIds, format = 'json' } = req.query;

    // Basit rapor bilgilerini oluştur
    const summary = {
      reportType: 'Timeline Report',
      dateRange: {
        start: startDate,
        end: endDate
      },
      generatedAt: new Date(),
      filters: {
        workstationIds: tezgahIds ? tezgahIds.split(',') : 'all'
      }
    };

    if (format === 'summary') {
      res.json({
        summary,
        message: 'Detaylı rapor için timeline data endpoint kullanın'
      });
    } else {
      res.json({
        summary,
        message: 'Rapor oluşturuldu. Detaylı veriler için /api/timeline/data endpoint kullanın.'
      });
    }

  } catch (error) {
    console.error('Timeline raporu oluşturulurken hata:', error);
    res.status(500).json({ error: error.message });
  }
};