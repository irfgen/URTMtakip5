import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe locale ayarla
dayjs.locale('tr');

const HAFTANIN_GUNLERI = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' }
];

const VARSAYILAN_RENKLER = [
  '#1976d2', '#f44336', '#ff9800', '#4caf50', 
  '#9c27b0', '#795548', '#607d8b', '#e91e63'
];

function VardiyaListesi({ onMessage, setLoading }) {
  const [vardiyalar, setVardiyalar] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVardiya, setEditingVardiya] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteVardiya, setDeleteVardiya] = useState(null);
  const [formData, setFormData] = useState({
    vardiya_adi: '',
    baslangic_saati: null,
    bitis_saati: null,
    haftalik_calisma_gunleri: [1, 2, 3, 4, 5],
    aktif: true,
    aciklama: '',
    renk: '#1976d2'
  });

  useEffect(() => {
    fetchVardiyalar();
  }, []);

  const fetchVardiyalar = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vardiyalar?with_personel=true');
      if (!response.ok) throw new Error('Vardiyalar getirilemedi');
      const data = await response.json();
      setVardiyalar(data);
    } catch (error) {
      console.error('Vardiyalar getirilirken hata:', error);
      onMessage('Vardiyalar getirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormOpen = (vardiya = null) => {
    if (vardiya) {
      setEditingVardiya(vardiya);
      setFormData({
        vardiya_adi: vardiya.vardiya_adi,
        baslangic_saati: dayjs(vardiya.baslangic_saati, 'HH:mm:ss'),
        bitis_saati: dayjs(vardiya.bitis_saati, 'HH:mm:ss'),
        haftalik_calisma_gunleri: vardiya.haftalik_calisma_gunleri || [1, 2, 3, 4, 5],
        aktif: vardiya.aktif,
        aciklama: vardiya.aciklama || '',
        renk: vardiya.renk || '#1976d2'
      });
    } else {
      setEditingVardiya(null);
      setFormData({
        vardiya_adi: '',
        baslangic_saati: null,
        bitis_saati: null,
        haftalik_calisma_gunleri: [1, 2, 3, 4, 5],
        aktif: true,
        aciklama: '',
        renk: '#1976d2'
      });
    }
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingVardiya(null);
  };

  const checkTimeConflicts = () => {
    if (!formData.baslangic_saati || !formData.bitis_saati) return [];
    
    const conflicts = vardiyalar.filter(vardiya => {
      if (editingVardiya && vardiya.id === editingVardiya.id) return false;
      
      const newStart = formData.baslangic_saati;
      const newEnd = formData.bitis_saati;
      const existingStart = dayjs(vardiya.baslangic_saati, 'HH:mm:ss');
      const existingEnd = dayjs(vardiya.bitis_saati, 'HH:mm:ss');
      
      // Gece vardiyası kontrolü
      let adjustedNewEnd = newEnd;
      let adjustedExistingEnd = existingEnd;
      
      if (newEnd.isBefore(newStart)) {
        adjustedNewEnd = newEnd.add(1, 'day');
      }
      
      if (existingEnd.isBefore(existingStart)) {
        adjustedExistingEnd = existingEnd.add(1, 'day');
      }
      
      // Çakışma kontrolü
      return (newStart.isBefore(adjustedExistingEnd) && adjustedNewEnd.isAfter(existingStart)) ||
             (existingStart.isBefore(adjustedNewEnd) && adjustedExistingEnd.isAfter(newStart));
    });
    
    return conflicts;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vardiya_adi || !formData.baslangic_saati || !formData.bitis_saati) {
      onMessage('Lütfen tüm gerekli alanları doldurun', 'error');
      return;
    }

    // Minimum vardiya süresi kontrolü (en az 1 saat)
    const duration = formData.bitis_saati.isBefore(formData.baslangic_saati) 
      ? formData.bitis_saati.add(1, 'day').diff(formData.baslangic_saati, 'minute')
      : formData.bitis_saati.diff(formData.baslangic_saati, 'minute');
    
    if (duration < 60) {
      onMessage('Vardiya süresi en az 1 saat olmalıdır', 'error');
      return;
    }

    // Zaman çakışması kontrolü
    const conflicts = checkTimeConflicts();
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(v => v.vardiya_adi).join(', ');
      const proceed = window.confirm(
        `Bu vardiya saatleri şu vardiyalarla çakışıyor: ${conflictNames}\n\nDevam etmek istiyor musunuz?`
      );
      if (!proceed) return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        vardiya_adi: formData.vardiya_adi,
        baslangic_saati: formData.baslangic_saati.format('HH:mm:ss'),
        bitis_saati: formData.bitis_saati.format('HH:mm:ss'),
        haftalik_calisma_gunleri: formData.haftalik_calisma_gunleri,
        aktif: formData.aktif,
        aciklama: formData.aciklama,
        renk: formData.renk
      };

      const url = editingVardiya 
        ? `/api/vardiyalar/${editingVardiya.id}` 
        : '/api/vardiyalar';
      
      const method = editingVardiya ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vardiya kaydedilemedi');
      }

      onMessage(
        editingVardiya ? 'Vardiya güncellendi' : 'Vardiya eklendi',
        'success'
      );
      
      handleFormClose();
      fetchVardiyalar();
    } catch (error) {
      console.error('Vardiya kaydedilirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteVardiya) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/vardiyalar/${deleteVardiya.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Vardiya silinemedi');
      }

      onMessage('Vardiya silindi', 'success');
      setDeleteConfirmOpen(false);
      setDeleteVardiya(null);
      fetchVardiyalar();
    } catch (error) {
      console.error('Vardiya silinirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    return dayjs(timeString, 'HH:mm:ss').format('HH:mm');
  };

  const calculateShiftDuration = (startTime, endTime) => {
    const start = dayjs(startTime, 'HH:mm:ss');
    let end = dayjs(endTime, 'HH:mm:ss');
    
    // Gece vardiyası kontrolü (bitiş saati başlangıçtan küçükse)
    if (end.isBefore(start)) {
      end = end.add(1, 'day');
    }
    
    const duration = end.diff(start, 'minute');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    return `${hours}s ${minutes > 0 ? minutes + 'dk' : ''}`;
  };

  const isOvernightShift = (startTime, endTime) => {
    const start = dayjs(startTime, 'HH:mm:ss');
    const end = dayjs(endTime, 'HH:mm:ss');
    return end.isBefore(start);
  };

  const formatWorkingDays = (days) => {
    if (!days) return 'Belirtilmemiş';
    
    // Eğer string ise JSON parse et
    let workingDays = days;
    if (typeof days === 'string') {
      try {
        workingDays = JSON.parse(days);
      } catch (e) {
        console.error('Çalışma günleri parse edilemedi:', days);
        return 'Belirtilmemiş';
      }
    }
    
    // Array kontrolü
    if (!Array.isArray(workingDays) || workingDays.length === 0) {
      return 'Belirtilmemiş';
    }
    
    return workingDays
      .map(day => HAFTANIN_GUNLERI.find(d => d.value === day)?.label || day)
      .join(', ');
  };

  const handleWorkingDayChange = (dayValue) => {
    const currentDays = formData.haftalik_calisma_gunleri;
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort();
    
    setFormData({
      ...formData,
      haftalik_calisma_gunleri: newDays
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vardiya Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleFormOpen()}
          >
            Yeni Vardiya
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vardiya Adı</TableCell>
                <TableCell>Çalışma Saatleri</TableCell>
                <TableCell>Süre</TableCell>
                <TableCell>Çalışma Günleri</TableCell>
                <TableCell>Personel Sayısı</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vardiyalar.map((vardiya) => (
                <TableRow key={vardiya.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: vardiya.renk,
                          borderRadius: '50%'
                        }}
                      />
                      {vardiya.vardiya_adi}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" />
                      {formatTime(vardiya.baslangic_saati)} - {formatTime(vardiya.bitis_saati)}
                      {isOvernightShift(vardiya.baslangic_saati, vardiya.bitis_saati) && (
                        <Chip 
                          label="Gece" 
                          size="small" 
                          color="info" 
                          sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {calculateShiftDuration(vardiya.baslangic_saati, vardiya.bitis_saati)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatWorkingDays(vardiya.haftalik_calisma_gunleri)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" />
                      {vardiya.personeller?.length || 0}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vardiya.aktif ? 'Aktif' : 'Pasif'}
                      color={vardiya.aktif ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          onClick={() => handleFormOpen(vardiya)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeleteVardiya(vardiya);
                            setDeleteConfirmOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Vardiya Formu */}
        <Dialog open={formOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
          <form onSubmit={handleFormSubmit}>
            <DialogTitle>
              {editingVardiya ? 'Vardiya Düzenle' : 'Yeni Vardiya Ekle'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vardiya Adı"
                      value={formData.vardiya_adi}
                      onChange={(e) => setFormData({...formData, vardiya_adi: e.target.value})}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Renk</InputLabel>
                      <Select
                        value={formData.renk}
                        onChange={(e) => setFormData({...formData, renk: e.target.value})}
                        renderValue={(value) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                backgroundColor: value,
                                borderRadius: '50%'
                              }}
                            />
                            {value}
                          </Box>
                        )}
                      >
                        {VARSAYILAN_RENKLER.map((color) => (
                          <MenuItem key={color} value={color}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  backgroundColor: color,
                                  borderRadius: '50%'
                                }}
                              />
                              {color}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="Başlangıç Saati"
                      value={formData.baslangic_saati}
                      onChange={(newValue) => setFormData({...formData, baslangic_saati: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TimePicker
                      label="Bitiş Saati"
                      value={formData.bitis_saati}
                      onChange={(newValue) => setFormData({...formData, bitis_saati: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  {formData.baslangic_saati && formData.bitis_saati && (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'background.paper', 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <ScheduleIcon color="primary" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Vardiya Süresi
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {(() => {
                              const start = formData.baslangic_saati;
                              let end = formData.bitis_saati;
                              
                              if (end.isBefore(start)) {
                                end = end.add(1, 'day');
                              }
                              
                              const duration = end.diff(start, 'minute');
                              const hours = Math.floor(duration / 60);
                              const minutes = duration % 60;
                              
                              return `${hours} saat ${minutes > 0 ? minutes + ' dakika' : ''}`;
                            })()}
                          </Typography>
                        </Box>
                        {formData.bitis_saati.isBefore(formData.baslangic_saati) && (
                          <Chip 
                            label="Gece Vardiyası" 
                            color="info" 
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        )}
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Çalışma Günleri
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {HAFTANIN_GUNLERI.map((day) => (
                        <FormControlLabel
                          key={day.value}
                          control={
                            <Switch
                              checked={formData.haftalik_calisma_gunleri.includes(day.value)}
                              onChange={() => handleWorkingDayChange(day.value)}
                            />
                          }
                          label={day.label}
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Açıklama"
                      multiline
                      rows={3}
                      value={formData.aciklama}
                      onChange={(e) => setFormData({...formData, aciklama: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.aktif}
                          onChange={(e) => setFormData({...formData, aktif: e.target.checked})}
                        />
                      }
                      label="Aktif"
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleFormClose}>İptal</Button>
              <Button type="submit" variant="contained">
                {editingVardiya ? 'Güncelle' : 'Ekle'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Silme Onayı */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Vardiya Sil</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              <strong>{deleteVardiya?.vardiya_adi}</strong> vardiyasını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>İptal</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Sil
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default VardiyaListesi;
