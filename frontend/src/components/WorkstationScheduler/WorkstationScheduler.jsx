import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Toolbar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { DragDropContext } from 'react-beautiful-dnd';

import {
  fetchSchedulerTimeline,
  fetchSchedulerStatistics,
  fetchSchedulerConflicts,
  updateScheduledTask,
  deleteScheduledTask,
  setSelectedWorkstations,
  setSelectedStatuses,
  setDateRange,
  openTaskForm,
  openEditTaskForm,
  clearError,
  clearSuccess
} from '../../store/slices/schedulerSlice';

import WorkstationRow from './WorkstationRow';
import ScheduleTaskForm from './ScheduleTaskForm';
import ConflictDetector from './ConflictDetector';

const WorkstationScheduler = () => {
  console.log('🚀 NEW WorkstationScheduler component loading!');
  const dispatch = useDispatch();
  const {
    timelineData,
    workstations,
    statistics,
    conflicts,
    selectedWorkstations,
    selectedStatuses,
    selectedDateRange,
    timelineLoading,
    statisticsLoading,
    taskOperationLoading,
    error,
    success,
    taskFormOpen
  } = useSelector(state => state.scheduler);

  // Local state
  const [expandedWorkstations, setExpandedWorkstations] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Component mount ve data loading
  useEffect(() => {
    loadData();
    loadStatistics();
    checkConflicts();
  }, [selectedDateRange, selectedWorkstations, selectedStatuses]);

  const loadData = useCallback(() => {
    dispatch(fetchSchedulerTimeline({
      startDate: selectedDateRange.start,
      endDate: selectedDateRange.end,
      workstationIds: selectedWorkstations,
      statuses: selectedStatuses
    }));
  }, [dispatch, selectedDateRange, selectedWorkstations, selectedStatuses]);

  const loadStatistics = useCallback(() => {
    dispatch(fetchSchedulerStatistics({
      startDate: selectedDateRange.start,
      endDate: selectedDateRange.end
    }));
  }, [dispatch, selectedDateRange]);

  const checkConflicts = useCallback(() => {
    dispatch(fetchSchedulerConflicts({
      startDate: selectedDateRange.start,
      endDate: selectedDateRange.end,
      workstationIds: selectedWorkstations
    }));
  }, [dispatch, selectedDateRange, selectedWorkstations]);

  // Event handlers
  const handleRefresh = () => {
    loadData();
    loadStatistics();
    checkConflicts();
  };

  const handleDateRangeChange = (field, value) => {
    const newDateRange = {
      ...selectedDateRange,
      [field]: value.toISOString().split('T')[0]
    };
    dispatch(setDateRange(newDateRange));
  };

  const handleWorkstationFilterChange = (event) => {
    dispatch(setSelectedWorkstations(event.target.value));
  };

  const handleStatusFilterChange = (event) => {
    dispatch(setSelectedStatuses(event.target.value));
  };

  const handleTaskEdit = (task) => {
    dispatch(openEditTaskForm(task));
  };

  const handleTaskDelete = async (taskId) => {
    if (window.confirm('Bu planlamayı silmek istediğinizden emin misiniz?')) {
      await dispatch(deleteScheduledTask(taskId));
      // Data'yı yeniden yüklemek yerine optimistic update kullanıyoruz (slice içinde)
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    await dispatch(updateScheduledTask({
      taskId,
      taskData: { durum: newStatus }
    }));
  };

  const handleAddTask = (workstationId) => {
    dispatch(openTaskForm({ workstationId }));
  };

  const handleWorkstationToggle = (workstationId) => {
    const newExpanded = new Set(expandedWorkstations);
    if (newExpanded.has(workstationId)) {
      newExpanded.delete(workstationId);
    } else {
      newExpanded.add(workstationId);
    }
    setExpandedWorkstations(newExpanded);
  };

  // Drag & Drop handler
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Drop edilmeyen durumlar
    if (!destination) return;
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) return;

    const taskId = parseInt(draggableId.replace('task-', ''));
    const newWorkstationId = parseInt(destination.droppableId.replace('workstation-', ''));

    try {
      // API çağrısı - şimdilik sadece tezgah değişikliğini destekliyoruz
      await dispatch(updateScheduledTask({
        taskId,
        taskData: { tezgah_id: newWorkstationId }
      }));
      
      // Başarılı olursa timeline'ı yeniden yükle
      loadData();
    } catch (error) {
      console.error('Görev taşınırken hata:', error);
    }
  };

  // Snackbar handlers
  const handleCloseSnackbar = () => {
    if (error) dispatch(clearError());
    if (success) dispatch(clearSuccess());
  };

  // İstatistikleri render et
  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {statistics.summary.total_tasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Görev
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {statistics.summary.busy_workstations}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aktif Tezgah
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {statistics.summary.status_distribution.tamamlandi || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tamamlanan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {statistics.summary.status_distribution.devam_ediyor || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Devam Eden
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Tüm tezgahları genişlet/daralt
  const handleExpandAll = () => {
    if (expandedWorkstations.size === workstations.length) {
      setExpandedWorkstations(new Set());
    } else {
      setExpandedWorkstations(new Set(workstations.map(w => w.id)));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" color="primary">
            Tezgah İş Planı
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Yenile">
              <IconButton onClick={handleRefresh} disabled={timelineLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filtreleri göster/gizle">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => dispatch(openTaskForm())}
            >
              Yeni Planlama
            </Button>
          </Box>
        </Box>

        {/* Loading bar */}
        {(timelineLoading || statisticsLoading) && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Başlangıç"
                  value={new Date(selectedDateRange.start)}
                  onChange={(date) => handleDateRangeChange('start', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Bitiş"
                  value={new Date(selectedDateRange.end)}
                  onChange={(date) => handleDateRangeChange('end', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tezgahlar</InputLabel>
                  <Select
                    multiple
                    value={selectedWorkstations}
                    onChange={handleWorkstationFilterChange}
                    renderValue={(selected) => 
                      selected.length === 0 ? 'Tümü' : `${selected.length} tezgah`
                    }
                  >
                    {workstations.map((ws) => (
                      <MenuItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Durumlar</InputLabel>
                  <Select
                    multiple
                    value={selectedStatuses}
                    onChange={handleStatusFilterChange}
                    renderValue={(selected) => 
                      `${selected.length} durum`
                    }
                  >
                    <MenuItem value="planli">Planlı</MenuItem>
                    <MenuItem value="devam_ediyor">Devam Ediyor</MenuItem>
                    <MenuItem value="tamamlandi">Tamamlandı</MenuItem>
                    <MenuItem value="iptal">İptal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={2}>
                <Button 
                  fullWidth 
                  size="small" 
                  onClick={handleExpandAll}
                  variant="outlined"
                >
                  {expandedWorkstations.size === workstations.length ? 'Tümünü Daralt' : 'Tümünü Genişlet'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Gelişmiş Çakışma Detektörü */}
        <ConflictDetector 
          autoResolve={false} 
          showDetails={true}
          onConflictDetected={(conflicts) => {
            console.log('Çakışmalar tespit edildi:', conflicts);
          }}
        />

        {/* İstatistikler */}
        {renderStatistics()}

        {/* Timeline */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box>
            {timelineData && timelineData.length > 0 ? (
              timelineData.map((workstation) => (
                <WorkstationRow
                  key={workstation.workstation_id}
                  workstation={workstation}
                  onTaskEdit={handleTaskEdit}
                  onTaskDelete={handleTaskDelete}
                  onTaskStatusChange={handleTaskStatusChange}
                  onAddTask={handleAddTask}
                  isExpanded={expandedWorkstations.has(workstation.workstation_id)}
                  onToggleExpand={() => handleWorkstationToggle(workstation.workstation_id)}
                />
              ))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Seçilen kriterlere uygun planlama bulunamadı
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Farklı tarih aralığı veya filtreler deneyin
                </Typography>
              </Paper>
            )}
          </Box>
        </DragDropContext>

        {/* Forms */}
        {taskFormOpen && <ScheduleTaskForm />}

        {/* Snackbar */}
        <Snackbar
          open={Boolean(error || success)}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={() => dispatch(openTaskForm())}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
};

export default WorkstationScheduler;