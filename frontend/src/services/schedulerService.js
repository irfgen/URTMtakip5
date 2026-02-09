import axios from 'axios';

const API_BASE = '/api/scheduler';

class SchedulerService {
  // Timeline verilerini getir
  async getTimeline(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.workstationIds && params.workstationIds.length > 0) {
      queryParams.append('workstationIds', params.workstationIds.join(','));
    }
    if (params.statuses && params.statuses.length > 0) {
      queryParams.append('statuses', params.statuses.join(','));
    }
    
    const url = queryParams.toString() 
      ? `${API_BASE}/timeline?${queryParams.toString()}`
      : `${API_BASE}/timeline`;
    
    const response = await axios.get(url);
    return response.data;
  }

  // İstatistikleri getir
  async getStatistics(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString()
      ? `${API_BASE}/statistics?${queryParams.toString()}`
      : `${API_BASE}/statistics`;
    
    const response = await axios.get(url);
    return response.data;
  }

  // Çakışmaları kontrol et
  async getConflicts(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.workstationIds && params.workstationIds.length > 0) {
      queryParams.append('workstationIds', params.workstationIds.join(','));
    }
    
    const url = queryParams.toString()
      ? `${API_BASE}/conflicts?${queryParams.toString()}`
      : `${API_BASE}/conflicts`;
    
    const response = await axios.get(url);
    return response.data;
  }

  // Yeni planlama oluştur
  async createTask(taskData) {
    const response = await axios.post(`${API_BASE}/tasks`, taskData);
    return response.data;
  }

  // Planlamayı güncelle
  async updateTask(taskId, taskData) {
    const response = await axios.put(`${API_BASE}/tasks/${taskId}`, taskData);
    return response.data;
  }

  // Planlamayı sil
  async deleteTask(taskId) {
    const response = await axios.delete(`${API_BASE}/tasks/${taskId}`);
    return response.data;
  }

  // Çoklu güncelleme (drag & drop için)
  async updateMultipleTasks(updates) {
    const promises = updates.map(({ taskId, taskData }) => 
      this.updateTask(taskId, taskData)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Başarılı ve başarısız güncellemeleri ayır
    const successful = [];
    const failed = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({
          taskId: updates[index].taskId,
          data: result.value
        });
      } else {
        failed.push({
          taskId: updates[index].taskId,
          error: result.reason
        });
      }
    });
    
    return { successful, failed };
  }

  // Task durumu güncelleme (hızlı durum değişimi için)
  async updateTaskStatus(taskId, status) {
    return this.updateTask(taskId, { durum: status });
  }

  // Task öncelik güncelleme
  async updateTaskPriority(taskId, priority) {
    return this.updateTask(taskId, { oncelik: priority });
  }

  // Task notlarını güncelleme
  async updateTaskNotes(taskId, notes) {
    return this.updateTask(taskId, { notlar: notes });
  }

  // Task zamanlarını güncelleme (drag & drop için optimize)
  async updateTaskTiming(taskId, startTime, endTime) {
    return this.updateTask(taskId, {
      baslangic_zamani: startTime,
      bitis_zamani: endTime
    });
  }

  // Task'ı başka tezgaha taşı
  async moveTaskToWorkstation(taskId, newWorkstationId, startTime, endTime) {
    return this.updateTask(taskId, {
      tezgah_id: newWorkstationId,
      baslangic_zamani: startTime,
      bitis_zamani: endTime
    });
  }

  // Tarih formatı yardımcı fonksiyonları
  formatDateForAPI(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  formatDateTimeForAPI(datetime) {
    if (datetime instanceof Date) {
      return datetime.toISOString();
    }
    return datetime;
  }

  // Timeline verilerini normalize et (frontend'de kullanım kolaylığı için)
  normalizeTimelineData(data) {
    if (!data.timeline_data) return data;

    return {
      ...data,
      timeline_data: data.timeline_data.map(workstation => ({
        ...workstation,
        tasks: workstation.tasks.map(task => ({
          ...task,
          startTime: new Date(task.start_time),
          endTime: new Date(task.end_time),
          duration: task.planned_duration_minutes,
          actualDuration: task.actual_duration_minutes,
          workOrder: task.work_order
        }))
      }))
    };
  }

  // Çakışma kontrolü (client-side validation için)
  checkTaskConflict(newTask, existingTasks) {
    const newStart = new Date(newTask.baslangic_zamani);
    const newEnd = new Date(newTask.bitis_zamani);

    return existingTasks.some(task => {
      if (task.id === newTask.id) return false; // Aynı task'ı göz ardı et
      if (task.status === 'tamamlandi') return false; // Tamamlanan işleri göz ardı et

      const taskStart = new Date(task.start_time);
      const taskEnd = new Date(task.end_time);

      // Çakışma kontrolü
      return (
        (newStart >= taskStart && newStart < taskEnd) ||
        (newEnd > taskStart && newEnd <= taskEnd) ||
        (newStart <= taskStart && newEnd >= taskEnd)
      );
    });
  }

  // Tezgah kapasitesi hesapla
  calculateWorkstationUtilization(workstationTasks, dateRange) {
    if (!workstationTasks || workstationTasks.length === 0) return 0;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const totalPeriodMinutes = (endDate - startDate) / (1000 * 60);

    const busyMinutes = workstationTasks
      .filter(task => task.status !== 'iptal')
      .reduce((total, task) => {
        return total + (task.planned_duration_minutes || 0);
      }, 0);

    return Math.min(100, (busyMinutes / totalPeriodMinutes) * 100);
  }
}

export default new SchedulerService();