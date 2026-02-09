import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Timeline verilerini getir
export const fetchTimelineData = createAsyncThunk(
  'timeline/fetchTimelineData',
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = '/api/timeline/data';
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.tezgahIds) queryParams.append('tezgahIds', params.tezgahIds.join(','));
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Vardiya tabanlı timeline verilerini getir
export const fetchShiftBasedTimeline = createAsyncThunk(
  'timeline/fetchShiftBasedTimeline',
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = '/api/timeline/shift-based';
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.tezgahIds) queryParams.append('tezgahIds', params.tezgahIds.join(','));
      if (params.vardiyaId) queryParams.append('vardiyaId', params.vardiyaId);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Timeline görevini güncelle (drag & drop)
export const updateTimelineTask = createAsyncThunk(
  'timeline/updateTimelineTask',
  async ({ taskId, newStart, newEnd, newWorkstationId }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/timeline/task/${taskId}`, {
        newStart,
        newEnd,
        newWorkstationId
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Görev sırasını güncelle
export const updateTaskOrder = createAsyncThunk(
  'timeline/updateTaskOrder',
  async ({ tezgahId, taskOrder }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/timeline/order/${tezgahId}`, {
        taskOrder
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Timeline raporu getir
export const getTimelineReport = createAsyncThunk(
  'timeline/getTimelineReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      let url = '/api/timeline/report';
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.tezgahIds) queryParams.append('tezgahIds', params.tezgahIds.join(','));
      if (params.format) queryParams.append('format', params.format);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Timeline görevini sil
export const deleteTask = createAsyncThunk(
  'timeline/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/timeline/task/${taskId}`);
      return { ...response.data, deletedTaskId: taskId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Timeline görevini kopyala
export const duplicateTask = createAsyncThunk(
  'timeline/duplicateTask',
  async ({ taskId, targetWorkstationId, targetStartTime }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/timeline/task/${taskId}/duplicate`, {
        targetWorkstationId,
        targetStartTime
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// İş emri durumunu güncelle
export const updateTaskStatus = createAsyncThunk(
  'timeline/updateTaskStatus',
  async ({ taskId, newStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/timeline/task/${taskId}/status`, {
        newStatus
      });
      return { ...response.data, taskId, newStatus };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const timelineSlice = createSlice({
  name: 'timeline',
  initialState: {
    // Ana timeline verileri
    timelineData: [],
    workstations: [],
    dateRange: null,
    
    // Filtreleme ve görünüm ayarları
    selectedWorkstations: [],
    selectedDateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 gün sonra
    },
    viewMode: 'daily', // 'daily', 'weekly', 'monthly'
    showShifts: true,
    selectedShift: null,
    
    // Drag & Drop durumu
    draggedTask: null,
    isTaskBeingUpdated: false,
    
    // Rapor verileri
    reportData: null,
    
    // Loading durumları
    loading: false,
    shiftLoading: false,
    taskUpdateLoading: false,
    reportLoading: false,
    
    // Hata ve başarı mesajları
    error: null,
    success: null
  },
  reducers: {
    // Hata ve başarı mesajlarını temizle
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    
    // Seçili tezgahları güncelle
    setSelectedWorkstations: (state, action) => {
      state.selectedWorkstations = action.payload;
    },
    
    // Tarih aralığını güncelle
    setDateRange: (state, action) => {
      state.selectedDateRange = action.payload;
    },
    
    // Görüntüleme modunu güncelle
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Vardiya görüntüleme durumunu güncelle
    toggleShifts: (state) => {
      state.showShifts = !state.showShifts;
    },
    
    // Seçili vardiyayı güncelle
    setSelectedShift: (state, action) => {
      state.selectedShift = action.payload;
    },
    
    // Sürüklenen görevi ayarla
    setDraggedTask: (state, action) => {
      state.draggedTask = action.payload;
    },
    
    // Timeline verilerini yerel olarak güncelle (optimistic update için)
    updateTimelineDataLocal: (state, action) => {
      const { taskId, newData } = action.payload;
      state.timelineData = state.timelineData.map(workstation => ({
        ...workstation,
        tasks: workstation.tasks.map(task => 
          task.id === taskId ? { ...task, ...newData } : task
        )
      }));
    },
    
    // Timeline verilerini temizle
    clearTimelineData: (state) => {
      state.timelineData = [];
      state.workstations = [];
      state.dateRange = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Timeline verilerini getir
      .addCase(fetchTimelineData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimelineData.fulfilled, (state, action) => {
        state.loading = false;
        state.timelineData = action.payload.timelineData;
        state.dateRange = action.payload.dateRange;
        state.workstations = action.payload.timelineData.map(ws => ({
          id: ws.workstation_id,
          name: ws.workstation_name,
          taskCount: ws.tasks.length
        }));
      })
      .addCase(fetchTimelineData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload || 'Timeline verileri getirilirken bir hata oluştu';
      })
      
      // Vardiya tabanlı timeline
      .addCase(fetchShiftBasedTimeline.pending, (state) => {
        state.shiftLoading = true;
        state.loading = true; // shift modunda da genel loading göster
        state.error = null;
      })
      .addCase(fetchShiftBasedTimeline.fulfilled, (state, action) => {
        state.shiftLoading = false;
        state.loading = false;

        const payload = action.payload || {};

        // Backend: { timelineData, shifts, dateRange }
        if (payload.timelineData) {
          state.timelineData = payload.timelineData;

          // Filtrelerde kullanılacak tezgah listesini, base tezgah bilgilerinden türet
          const uniqueMap = {};
          for (const row of payload.timelineData) {
            const id = row.base_workstation_id ?? row.workstation_id;
            const name = row.base_workstation_name ?? row.workstation_name;
            if (!uniqueMap[id]) {
              uniqueMap[id] = { id, name, taskCount: 0 };
            }
            uniqueMap[id].taskCount += (row.tasks?.length || 0);
          }
          state.workstations = Object.values(uniqueMap);
        }

        if (payload.dateRange) {
          state.dateRange = payload.dateRange;
        }
      })
      .addCase(fetchShiftBasedTimeline.rejected, (state, action) => {
        state.shiftLoading = false;
        state.loading = false;
        state.error = action.payload?.error || action.payload || 'Vardiya tabanlı timeline verileri getirilirken bir hata oluştu';
      })
      
      // Timeline görevini güncelle
      .addCase(updateTimelineTask.pending, (state) => {
        state.taskUpdateLoading = true;
        state.error = null;
      })
      .addCase(updateTimelineTask.fulfilled, (state, action) => {
        state.taskUpdateLoading = false;
        state.success = action.payload.message || 'Görev başarıyla güncellendi';
        
        // Timeline verilerini yerel olarak güncelle
        if (action.payload.updatedTask) {
          const { taskId, newStart, newEnd, newWorkstationId } = action.payload.updatedTask;
          state.timelineData = state.timelineData.map(workstation => ({
            ...workstation,
            tasks: workstation.tasks.map(task => 
              task.id === taskId ? { 
                ...task, 
                start: newStart, 
                end: newEnd,
                workstation_id: newWorkstationId || task.workstation_id
              } : task
            )
          }));
        }
      })
      .addCase(updateTimelineTask.rejected, (state, action) => {
        state.taskUpdateLoading = false;
        state.error = action.payload?.error || action.payload || 'Görev güncellenirken bir hata oluştu';
      })
      
      // Görev sırasını güncelle
      .addCase(updateTaskOrder.pending, (state) => {
        state.taskUpdateLoading = true;
        state.error = null;
      })
      .addCase(updateTaskOrder.fulfilled, (state, action) => {
        state.taskUpdateLoading = false;
        state.success = action.payload.message || 'Görev sırası başarıyla güncellendi';
      })
      .addCase(updateTaskOrder.rejected, (state, action) => {
        state.taskUpdateLoading = false;
        state.error = action.payload?.error || action.payload || 'Görev sırası güncellenirken bir hata oluştu';
      })
      
      // Timeline raporu getir
      .addCase(getTimelineReport.pending, (state) => {
        state.reportLoading = true;
        state.error = null;
      })
      .addCase(getTimelineReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.reportData = action.payload;
        state.success = 'Rapor başarıyla oluşturuldu';
      })
      .addCase(getTimelineReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.error = action.payload?.error || action.payload || 'Rapor oluşturulurken bir hata oluştu';
      })
      
      // Timeline görevini sil
      .addCase(deleteTask.pending, (state) => {
        state.taskUpdateLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.taskUpdateLoading = false;
        state.success = action.payload.message || 'Görev başarıyla silindi';
        
        // Silinen görevi timeline verilerinden kaldır
        const taskId = action.payload.deletedTaskId;
        state.timelineData = state.timelineData.map(workstation => ({
          ...workstation,
          tasks: workstation.tasks.filter(task => task.id !== taskId)
        }));
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.taskUpdateLoading = false;
        state.error = action.payload?.error || action.payload || 'Görev silinirken bir hata oluştu';
      })
      
      // Timeline görevini kopyala
      .addCase(duplicateTask.pending, (state) => {
        state.taskUpdateLoading = true;
        state.error = null;
      })
      .addCase(duplicateTask.fulfilled, (state, action) => {
        state.taskUpdateLoading = false;
        state.success = action.payload.message || 'Görev başarıyla kopyalandı';
        
        // Yeni kopyalanan görev için timeline verilerini yeniden yüklemek gerekebilir
        // Burada optimistic update yapabiliriz veya refetch tetikleyebiliriz
      })
      .addCase(duplicateTask.rejected, (state, action) => {
        state.taskUpdateLoading = false;
        state.error = action.payload?.error || action.payload || 'Görev kopyalanırken bir hata oluştu';
      })
      
      // İş emri durumunu güncelle
      .addCase(updateTaskStatus.pending, (state) => {
        state.taskUpdateLoading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.taskUpdateLoading = false;
        state.success = action.payload.message || 'Görev durumu başarıyla güncellendi';
        
        // Timeline verilerinde görev durumunu güncelle
        const { taskId, newStatus } = action.payload;
        state.timelineData = state.timelineData.map(workstation => ({
          ...workstation,
          tasks: workstation.tasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        }));
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.taskUpdateLoading = false;
        state.error = action.payload?.error || action.payload || 'Görev durumu güncellenirken bir hata oluştu';
      });
  }
});

export const {
  clearError,
  clearSuccess,
  setSelectedWorkstations,
  setDateRange,
  setViewMode,
  toggleShifts,
  setSelectedShift,
  setDraggedTask,
  updateTimelineDataLocal,
  clearTimelineData
} = timelineSlice.actions;

export default timelineSlice.reducer;