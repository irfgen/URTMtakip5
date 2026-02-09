import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  Box,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  DateTimePicker
} from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { addHours, addMinutes } from 'date-fns';

import {
  createScheduledTask,
  updateScheduledTask,
  closeTaskForm,
  closeEditTaskForm
} from '../../store/slices/schedulerSlice';

const ScheduleTaskForm = () => {
  const dispatch = useDispatch();
  const {
    taskFormOpen,
    editTaskFormOpen,
    selectedTask,
    workstations,
    taskOperationLoading
  } = useSelector(state => state.scheduler);

  // Form state
  const [formData, setFormData] = useState({
    tezgah_id: '',
    is_emri_id: '',
    baslangic_zamani: new Date(),
    bitis_zamani: addHours(new Date(), 4), // Default 4 saat
    oncelik: 2,
    notlar: ''
  });

  // İş emirleri ve tezgah verileri
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState('');

  const isEditMode = editTaskFormOpen && selectedTask;
  const isOpen = taskFormOpen || editTaskFormOpen;

  // Form'u başlat
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Edit mode - mevcut task verileriyle doldur
        setFormData({
          tezgah_id: selectedTask.workstation_id || '',
          is_emri_id: selectedTask.work_order_id || '',
          baslangic_zamani: new Date(selectedTask.start_time),
          bitis_zamani: new Date(selectedTask.end_time),
          oncelik: selectedTask.priority || 2,
          notlar: selectedTask.notes || ''
        });
      } else {
        // Create mode - temiz form
        const now = new Date();
        setFormData({
          tezgah_id: selectedTask?.workstationId || '',
          is_emri_id: '',
          baslangic_zamani: now,
          bitis_zamani: addHours(now, 4),
          oncelik: 2,
          notlar: ''
        });
      }
      
      // İş emirlerini yükle
      loadWorkOrders();
    }
  }, [isOpen, isEditMode, selectedTask]);

  // İş emirlerini yükle
  const loadWorkOrders = async () => {
    setWorkOrdersLoading(true);
    try {
      // Basit bir iş emri listesi endpoint'i gerekli
      // Şimdilik mock data kullanacağız
      const mockWorkOrders = [
        { id: 1, number: 'IE25030001', name: 'Test İş Emri 1' },
        { id: 2, number: 'IE25030002', name: 'Test İş Emri 2' },
        { id: 3, number: 'IE25030003', name: 'Test İş Emri 3' },
        { id: 4, number: 'IE25030004', name: 'Test İş Emri 4' },
        { id: 5, number: 'IE25030005', name: 'Test İş Emri 5' }
      ];
      setWorkOrders(mockWorkOrders);
    } catch (error) {
      console.error('İş emirleri yüklenirken hata:', error);
    } finally {
      setWorkOrdersLoading(false);
    }
  };

  // Form değişiklikleri
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Başlangıç zamanı değişirse, bitiş zamanını da ayarla
    if (field === 'baslangic_zamani' && value) {
      const currentDuration = (formData.bitis_zamani - formData.baslangic_zamani) / (1000 * 60); // dakika
      setFormData(prev => ({
        ...prev,
        bitis_zamani: addMinutes(value, currentDuration > 0 ? currentDuration : 240) // Min 4 saat
      }));
    }

    // Validation hatalarını temizle
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const errors = {};

    if (!formData.tezgah_id) {
      errors.tezgah_id = 'Tezgah seçimi zorunludur';
    }

    if (!formData.is_emri_id) {
      errors.is_emri_id = 'İş emri seçimi zorunludur';
    }

    if (!formData.baslangic_zamani) {
      errors.baslangic_zamani = 'Başlangıç zamanı zorunludur';
    }

    if (!formData.bitis_zamani) {
      errors.bitis_zamani = 'Bitiş zamanı zorunludur';
    }

    if (formData.baslangic_zamani && formData.bitis_zamani && 
        formData.bitis_zamani <= formData.baslangic_zamani) {
      errors.bitis_zamani = 'Bitiş zamanı başlangıç zamanından sonra olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form gönder
  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Süreyi hesapla
    const durationMinutes = (formData.bitis_zamani - formData.baslangic_zamani) / (1000 * 60);

    const taskData = {
      tezgah_id: formData.tezgah_id,
      is_emri_id: formData.is_emri_id,
      baslangic_zamani: formData.baslangic_zamani.toISOString(),
      bitis_zamani: formData.bitis_zamani.toISOString(),
      oncelik: formData.oncelik,
      notlar: formData.notlar
    };

    try {
      if (isEditMode) {
        await dispatch(updateScheduledTask({
          taskId: selectedTask.id,
          taskData
        }));
      } else {
        await dispatch(createScheduledTask(taskData));
      }
    } catch (error) {
      console.error('Form gönderilirken hata:', error);
    }
  };

  // Form kapat
  const handleClose = () => {
    if (isEditMode) {
      dispatch(closeEditTaskForm());
    } else {
      dispatch(closeTaskForm());
    }
    
    // Form state'i temizle
    setFormData({
      tezgah_id: '',
      is_emri_id: '',
      baslangic_zamani: new Date(),
      bitis_zamani: addHours(new Date(), 4),
      oncelik: 2,
      notlar: ''
    });
    setFormErrors({});
    setConflictWarning('');
  };

  // Süre hesapla ve göster
  const calculateDuration = () => {
    if (formData.baslangic_zamani && formData.bitis_zamani) {
      const minutes = (formData.bitis_zamani - formData.baslangic_zamani) / (1000 * 60);
      if (minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours === 0) return `${mins} dakika`;
        if (mins === 0) return `${hours} saat`;
        return `${hours} saat ${mins} dakika`;
      }
    }
    return '';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Dialog 
        open={isOpen} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditMode ? 'Planlamayı Düzenle' : 'Yeni Planlama Oluştur'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Tezgah Seçimi */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formErrors.tezgah_id)}>
                  <InputLabel>Tezgah</InputLabel>
                  <Select
                    value={formData.tezgah_id}
                    onChange={(e) => handleChange('tezgah_id', e.target.value)}
                    label="Tezgah"
                  >
                    {workstations.map((workstation) => (
                      <MenuItem key={workstation.id} value={workstation.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography>{workstation.name}</Typography>
                          <Chip
                            label={workstation.status === 'musait' ? 'Müsait' :
                                  workstation.status === 'calisiyor' ? 'Çalışıyor' : 
                                  'Bakım'}
                            size="small"
                            color={workstation.status === 'musait' ? 'success' :
                                  workstation.status === 'calisiyor' ? 'warning' : 
                                  'error'}
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.tezgah_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {formErrors.tezgah_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* İş Emri Seçimi */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={workOrders}
                  getOptionLabel={(option) => `${option.number} - ${option.name}`}
                  loading={workOrdersLoading}
                  value={workOrders.find(wo => wo.id === formData.is_emri_id) || null}
                  onChange={(event, newValue) => {
                    handleChange('is_emri_id', newValue ? newValue.id : '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="İş Emri"
                      error={Boolean(formErrors.is_emri_id)}
                      helperText={formErrors.is_emri_id}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {workOrdersLoading && (
                              <CircularProgress color="inherit" size={20} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Başlangıç Zamanı */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Başlangıç Zamanı"
                  value={formData.baslangic_zamani}
                  onChange={(date) => handleChange('baslangic_zamani', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(formErrors.baslangic_zamani),
                      helperText: formErrors.baslangic_zamani
                    }
                  }}
                />
              </Grid>

              {/* Bitiş Zamanı */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Bitiş Zamanı"
                  value={formData.bitis_zamani}
                  onChange={(date) => handleChange('bitis_zamani', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(formErrors.bitis_zamani),
                      helperText: formErrors.bitis_zamani
                    }
                  }}
                />
              </Grid>

              {/* Süre Gösterimi */}
              {calculateDuration() && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      <strong>Planlanan Süre:</strong> {calculateDuration()}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Öncelik */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Öncelik</InputLabel>
                  <Select
                    value={formData.oncelik}
                    onChange={(e) => handleChange('oncelik', e.target.value)}
                    label="Öncelik"
                  >
                    <MenuItem value={1}>
                      <Chip label="1 - Yüksek" color="error" size="small" />
                    </MenuItem>
                    <MenuItem value={2}>
                      <Chip label="2 - Orta" color="warning" size="small" />
                    </MenuItem>
                    <MenuItem value={3}>
                      <Chip label="3 - Normal" color="info" size="small" />
                    </MenuItem>
                    <MenuItem value={4}>
                      <Chip label="4 - Düşük" color="success" size="small" />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Boş alan */}
              <Grid item xs={12} sm={6}></Grid>

              {/* Notlar */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notlar"
                  value={formData.notlar}
                  onChange={(e) => handleChange('notlar', e.target.value)}
                  placeholder="Bu planlama hakkında notlarınızı buraya yazabilirsiniz..."
                />
              </Grid>

              {/* Çakışma Uyarısı */}
              {conflictWarning && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    {conflictWarning}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose}
            disabled={taskOperationLoading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={taskOperationLoading}
            startIcon={taskOperationLoading && <CircularProgress size={16} />}
          >
            {isEditMode ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ScheduleTaskForm;