import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Yeni scheduler API endpoints
const API_BASE = '/api/scheduler';

// Timeline verilerini getir (yeni scheduler API)
export const fetchSchedulerTimeline = createAsyncThunk(
  'scheduler/fetchTimeline',
  async (params = {}, { rejectWithValue }) => {
    try {
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
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// İstatistikleri getir
export const fetchSchedulerStatistics = createAsyncThunk(
  'scheduler/fetchStatistics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const url = queryParams.toString()
        ? `${API_BASE}/statistics?${queryParams.toString()}`
        : `${API_BASE}/statistics`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Çakışmaları kontrol et
export const fetchSchedulerConflicts = createAsyncThunk(
  'scheduler/fetchConflicts',
  async (params = {}, { rejectWithValue }) => {
    try {
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
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Yeni planlama oluştur
export const createScheduledTask = createAsyncThunk(
  'scheduler/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/tasks`, taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Planlamayı güncelle
export const updateScheduledTask = createAsyncThunk(
  'scheduler/updateTask',
  async ({ taskId, taskData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Planlamayı sil
export const deleteScheduledTask = createAsyncThunk(
  'scheduler/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE}/tasks/${taskId}`);
      return { ...response.data, deletedTaskId: taskId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const schedulerSlice = createSlice({
  name: 'scheduler',
  initialState: {
    // Ana timeline verileri
    timelineData: [],
    workstations: [],
    dateRange: null,
    statistics: null,
    conflicts: [],
    
    // Filtreleme ve görünüm ayarları
    selectedWorkstations: [],
    selectedStatuses: ['planli', 'devam_ediyor'], // Default aktif görevler
    selectedDateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 gün sonra
    },
    viewMode: 'daily', // 'daily', 'weekly', 'monthly'
    
    // Form state
    taskFormOpen: false,
    editTaskFormOpen: false,
    selectedTask: null,
    
    // Drag & Drop durumu
    draggedTask: null,
    
    // Loading durumları
    timelineLoading: false,
    statisticsLoading: false,
    conflictsLoading: false,
    taskOperationLoading: false,
    
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
    
    // Filtreleri güncelle
    setSelectedWorkstations: (state, action) => {
      state.selectedWorkstations = action.payload;
    },
    
    setSelectedStatuses: (state, action) => {
      state.selectedStatuses = action.payload;
    },
    
    setDateRange: (state, action) => {
      state.selectedDateRange = action.payload;
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Form state yönetimi
    openTaskForm: (state, action) => {
      state.taskFormOpen = true;
      state.selectedTask = action.payload || null;
    },
    
    closeTaskForm: (state) => {
      state.taskFormOpen = false;
      state.selectedTask = null;
    },
    
    openEditTaskForm: (state, action) => {
      state.editTaskFormOpen = true;
      state.selectedTask = action.payload;
    },
    
    closeEditTaskForm: (state) => {
      state.editTaskFormOpen = false;
      state.selectedTask = null;
    },
    
    // Drag & Drop
    setDraggedTask: (state, action) => {
      state.draggedTask = action.payload;
    },
    
    // Optimistic updates
    updateTaskLocal: (state, action) => {
      const { taskId, updates } = action.payload;
      state.timelineData = state.timelineData.map(workstation => ({
        ...workstation,
        tasks: workstation.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      }));
    },
    
    removeTaskLocal: (state, action) => {
      const taskId = action.payload;
      state.timelineData = state.timelineData.map(workstation => ({
        ...workstation,
        tasks: workstation.tasks.filter(task => task.id !== taskId)
      }));
    },
    
    // Verileri temizle
    clearTimelineData: (state) => {
      state.timelineData = [];
      state.workstations = [];
      state.dateRange = null;
      state.statistics = null;
      state.conflicts = [];
    },
    
    // Başarı mesajı ayarla
    setSuccessMessage: (state, action) => {
      state.success = action.payload;
    },
    
    // Hata mesajı ayarla
    setErrorMessage: (state, action) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Timeline verilerini getir
      .addCase(fetchSchedulerTimeline.pending, (state) => {
        state.timelineLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedulerTimeline.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.timelineData = action.payload.timeline_data || [];
        state.dateRange = action.payload.date_range;
        
        // Workstation listesini oluştur
        state.workstations = state.timelineData.map(ws => ({
          id: ws.workstation_id,
          name: ws.workstation_name,
          status: ws.workstation_status,
          taskCount: ws.tasks?.length || 0
        }));
      })
      .addCase(fetchSchedulerTimeline.rejected, (state, action) => {
        state.timelineLoading = false;
        state.error = action.payload?.error || action.payload || 'Timeline verileri getirilirken hata oluştu';
      })
      
      // İstatistikleri getir
      .addCase(fetchSchedulerStatistics.pending, (state) => {
        state.statisticsLoading = true;
      })
      .addCase(fetchSchedulerStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchSchedulerStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = action.payload?.error || action.payload || 'İstatistikler getirilirken hata oluştu';
      })
      
      // Çakışmaları getir
      .addCase(fetchSchedulerConflicts.pending, (state) => {
        state.conflictsLoading = true;
      })
      .addCase(fetchSchedulerConflicts.fulfilled, (state, action) => {
        state.conflictsLoading = false;
        state.conflicts = action.payload.conflicts || [];
      })
      .addCase(fetchSchedulerConflicts.rejected, (state, action) => {
        state.conflictsLoading = false;
        state.error = action.payload?.error || action.payload || 'Çakışmalar getirilirken hata oluştu';
      })
      
      // Yeni planlama oluştur
      .addCase(createScheduledTask.pending, (state) => {
        state.taskOperationLoading = true;
        state.error = null;
      })
      .addCase(createScheduledTask.fulfilled, (state, action) => {
        state.taskOperationLoading = false;
        state.success = action.payload.message || 'Planlama başarıyla oluşturuldu';
        state.taskFormOpen = false;
        state.selectedTask = null;
        
        // Yeni task'ı timeline'a ekle (optimistic update)
        if (action.payload.task) {
          const task = action.payload.task;
          const workstationIndex = state.timelineData.findIndex(
            ws => ws.workstation_id === task.workstationId
          );
          if (workstationIndex !== -1) {
            state.timelineData[workstationIndex].tasks.push({
              id: task.id,
              task_id: task.taskId,
              workstation_id: task.workstationId,
              work_order_id: task.workOrderId,
              start_time: task.startTime,
              end_time: task.endTime,
              planned_duration_minutes: task.plannedDuration,
              actual_duration_minutes: task.actualDuration,
              status: task.status,
              priority: task.priority,
              notes: task.notes,
              work_order: task.workOrder
            });
          }
        }
      })
      .addCase(createScheduledTask.rejected, (state, action) => {
        state.taskOperationLoading = false;
        state.error = action.payload?.error || action.payload || 'Planlama oluşturulurken hata oluştu';
      })
      
      // Planlamayı güncelle
      .addCase(updateScheduledTask.pending, (state) => {
        state.taskOperationLoading = true;
        state.error = null;
      })
      .addCase(updateScheduledTask.fulfilled, (state, action) => {
        state.taskOperationLoading = false;
        state.success = action.payload.message || 'Planlama başarıyla güncellendi';
        state.editTaskFormOpen = false;
        state.selectedTask = null;
        
        // Timeline'da task'ı güncelle (optimistic update)
        if (action.payload.task) {
          const task = action.payload.task;
          state.timelineData = state.timelineData.map(workstation => ({
            ...workstation,
            tasks: workstation.tasks.map(t => 
              t.id === task.id ? {
                ...t,
                start_time: task.startTime,
                end_time: task.endTime,
                planned_duration_minutes: task.plannedDuration,
                status: task.status,
                priority: task.priority,
                notes: task.notes
              } : t
            )
          }));
        }
      })
      .addCase(updateScheduledTask.rejected, (state, action) => {
        state.taskOperationLoading = false;
        state.error = action.payload?.error || action.payload || 'Planlama güncellenirken hata oluştu';
      })
      
      // Planlamayı sil
      .addCase(deleteScheduledTask.pending, (state) => {
        state.taskOperationLoading = true;
        state.error = null;
      })
      .addCase(deleteScheduledTask.fulfilled, (state, action) => {
        state.taskOperationLoading = false;
        state.success = action.payload.message || 'Planlama başarıyla silindi';
        
        // Timeline'dan task'ı kaldır (optimistic update)
        const taskId = parseInt(action.payload.deleted_task_id);
        state.timelineData = state.timelineData.map(workstation => ({
          ...workstation,
          tasks: workstation.tasks.filter(task => task.id !== taskId)
        }));
      })
      .addCase(deleteScheduledTask.rejected, (state, action) => {
        state.taskOperationLoading = false;
        state.error = action.payload?.error || action.payload || 'Planlama silinirken hata oluştu';
      });
  }
});

export const {
  clearError,
  clearSuccess,
  setSelectedWorkstations,
  setSelectedStatuses,
  setDateRange,
  setViewMode,
  openTaskForm,
  closeTaskForm,
  openEditTaskForm,
  closeEditTaskForm,
  setDraggedTask,
  updateTaskLocal,
  removeTaskLocal,
  clearTimelineData,
  setSuccessMessage,
  setErrorMessage
} = schedulerSlice.actions;

export default schedulerSlice.reducer;