import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe locale ayarla
dayjs.locale('tr');

const HAFTANIN_GUNLERI = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

const DURUM_RENKLERI = {
  'planlanan': '#2196f3',
  'aktif': '#4caf50',
  'tamamlandi': '#9e9e9e',
  'iptal': '#f44336'
};

const DURUM_ETIKETLERI = {
  'planlanan': 'Planlanan',
  'aktif': 'Aktif',
  'tamamlandi': 'Tamamlandı',
  'iptal': 'İptal'
};

function VardiyaTakvimi({ onMessage, setLoading }) {
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week'));
  const [atamalar, setAtamalar] = useState({});
  const [personeller, setPersoneller] = useState([]);
  const [vardiyalar, setVardiyalar] = useState([]);
  const [atamaFormOpen, setAtamaFormOpen] = useState(false);
  const [topluAtamaFormOpen, setTopluAtamaFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    personel_id: '',
    vardiya_id: '',
    tarih: null,
    notlar: ''
  });
  const [topluFormData, setTopluFormData] = useState({
    personel_ids: [],
    vardiya_id: '',
    baslangic_tarihi: null,
    bitis_tarihi: null
  });

  useEffect(() => {
    fetchData();
  }, [currentWeek]);

  const fetchData = async () => {
    await Promise.all([
      fetchAtamalar(),
      fetchPersoneller(),
      fetchVardiyalar()
    ]);
  };

  const fetchAtamalar = async () => {
    try {
      setLoading(true);
      const baslangic = currentWeek.format('YYYY-MM-DD');
      const bitis = currentWeek.add(6, 'day').format('YYYY-MM-DD');
      
      const response = await fetch(`/api/vardiya-atamalari/takvim?baslangic_tarihi=${baslangic}&bitis_tarihi=${bitis}`);
      if (!response.ok) throw new Error('Atamalar getirilemedi');
      
      const data = await response.json();
      setAtamalar(data);
    } catch (error) {
      console.error('Atamalar getirilirken hata:', error);
      onMessage('Atamalar getirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersoneller = async () => {
    try {
      const response = await fetch('/api/personel?aktif=true');
      if (!response.ok) throw new Error('Personeller getirilemedi');
      const data = await response.json();
      setPersoneller(data);
    } catch (error) {
      console.error('Personeller getirilirken hata:', error);
    }
  };

  const fetchVardiyalar = async () => {
    try {
      const response = await fetch('/api/vardiyalar?aktif=true');
      if (!response.ok) throw new Error('Vardiyalar getirilemedi');
      const data = await response.json();
      setVardiyalar(data);
    } catch (error) {
      console.error('Vardiyalar getirilirken hata:', error);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(currentWeek.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek.add(1, 'week'));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(dayjs().startOf('week'));
  };

  const handleAtamaFormOpen = (tarih = null) => {
    setSelectedDate(tarih);
    setFormData({
      personel_id: '',
      vardiya_id: '',
      tarih: tarih || dayjs(),
      notlar: ''
    });
    setAtamaFormOpen(true);
  };

  const handleAtamaFormClose = () => {
    setAtamaFormOpen(false);
    setSelectedDate(null);
  };

  const handleTopluAtamaFormOpen = () => {
    setTopluFormData({
      personel_ids: [],
      vardiya_id: '',
      baslangic_tarihi: currentWeek,
      bitis_tarihi: currentWeek.add(6, 'day')
    });
    setTopluAtamaFormOpen(true);
  };

  const handleTopluAtamaFormClose = () => {
    setTopluAtamaFormOpen(false);
  };

  const handleAtamaSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.personel_id || !formData.vardiya_id || !formData.tarih) {
      onMessage('Lütfen tüm gerekli alanları doldurun', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        personel_id: formData.personel_id,
        vardiya_id: formData.vardiya_id,
        tarih: formData.tarih.format('YYYY-MM-DD'),
        notlar: formData.notlar
      };

      const response = await fetch('/api/vardiya-atamalari', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Atama oluşturulamadı');
      }

      onMessage('Vardiya ataması oluşturuldu', 'success');
      handleAtamaFormClose();
      fetchAtamalar();
    } catch (error) {
      console.error('Atama oluşturulurken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTopluAtamaSubmit = async (e) => {
    e.preventDefault();
    
    if (!topluFormData.personel_ids.length || !topluFormData.vardiya_id || !topluFormData.baslangic_tarihi || !topluFormData.bitis_tarihi) {
      onMessage('Lütfen tüm gerekli alanları doldurun', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        personel_ids: topluFormData.personel_ids,
        vardiya_id: topluFormData.vardiya_id,
        baslangic_tarihi: topluFormData.baslangic_tarihi.format('YYYY-MM-DD'),
        bitis_tarihi: topluFormData.bitis_tarihi.format('YYYY-MM-DD')
      };

      const response = await fetch('/api/vardiya-atamalari/toplu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Toplu atama oluşturulamadı');
      }

      const result = await response.json();
      onMessage(result.message, 'success');
      handleTopluAtamaFormClose();
      fetchAtamalar();
    } catch (error) {
      console.error('Toplu atama oluşturulurken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAtamaStatusChange = async (atamaId, newStatus) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/vardiya-atamalari/${atamaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ durum: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Durum güncellenemedi');
      }

      onMessage('Vardiya durumu güncellendi', 'success');
      fetchAtamalar();
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAtamaDelete = async (atamaId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/vardiya-atamalari/${atamaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Atama silinemedi');
      }

      onMessage('Vardiya ataması silindi', 'success');
      fetchAtamalar();
    } catch (error) {
      console.error('Atama silinirken hata:', error);
      onMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(currentWeek.add(i, 'day'));
    }
    return days;
  };

  const getDayAtamalar = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return atamalar[dateStr] || [];
  };

  const renderAtamaCard = (atama) => {
    const vardiya = atama.vardiya;
    const personel = atama.personel;
    
    return (
      <Card 
        key={atama.id} 
        sx={{ 
          mb: 1, 
          borderLeft: `4px solid ${vardiya.renk}`,
          '&:hover': { elevation: 4 }
        }}
      >
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: vardiya.renk }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {personel.personel_adi}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {vardiya.vardiya_adi}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={DURUM_ETIKETLERI[atama.durum]}
                size="small"
                sx={{
                  bgcolor: DURUM_RENKLERI[atama.durum],
                  color: 'white',
                  fontSize: '0.65rem'
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {atama.durum === 'planlanan' && (
                  <Tooltip title="Başlat">
                    <IconButton 
                      size="small" 
                      onClick={() => handleAtamaStatusChange(atama.id, 'aktif')}
                      sx={{ p: 0.25 }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {atama.durum === 'aktif' && (
                  <Tooltip title="Bitir">
                    <IconButton 
                      size="small" 
                      onClick={() => handleAtamaStatusChange(atama.id, 'tamamlandi')}
                      sx={{ p: 0.25 }}
                    >
                      <StopIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Sil">
                  <IconButton 
                    size="small" 
                    onClick={() => handleAtamaDelete(atama.id)}
                    sx={{ p: 0.25 }}
                    color="error"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const weekDays = getWeekDays();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Vardiya Takvimi</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleAtamaFormOpen()}
            >
              Atama Ekle
            </Button>
            <Button
              variant="outlined"
              onClick={handleTopluAtamaFormOpen}
            >
              Toplu Atama
            </Button>
          </Box>
        </Box>

        {/* Week Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <IconButton onClick={handlePreviousWeek}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {currentWeek.format('DD MMM YYYY')} - {currentWeek.add(6, 'day').format('DD MMM YYYY')}
          </Typography>
          <IconButton onClick={handleNextWeek}>
            <ChevronRightIcon />
          </IconButton>
          <Button onClick={handleCurrentWeek} sx={{ ml: 2 }}>
            Bu Hafta
          </Button>
        </Box>

        {/* Calendar Grid */}
        <Grid container spacing={1}>
          {weekDays.map((day, index) => (
            <Grid item xs={12} md={12/7} key={index}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 1, 
                  minHeight: 200,
                  bgcolor: day.isSame(dayjs(), 'day') ? 'primary.50' : 'inherit',
                  borderTop: day.isSame(dayjs(), 'day') ? '2px solid' : 'none',
                  borderColor: 'primary.main'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {HAFTANIN_GUNLERI[day.day()]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {day.format('DD.MM')}
                  </Typography>
                </Box>
                <Box>
                  {getDayAtamalar(day).map(atama => renderAtamaCard(atama))}
                  <Button
                    fullWidth
                    variant="text"
                    size="small"
                    onClick={() => handleAtamaFormOpen(day)}
                    sx={{ 
                      mt: 1, 
                      color: 'text.secondary',
                      fontSize: '0.75rem'
                    }}
                  >
                    + Atama Ekle
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Atama Formu */}
        <Dialog open={atamaFormOpen} onClose={handleAtamaFormClose} maxWidth="sm" fullWidth>
          <form onSubmit={handleAtamaSubmit}>
            <DialogTitle>Vardiya Ataması Ekle</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Tarih"
                      value={formData.tarih}
                      onChange={(newValue) => setFormData({...formData, tarih: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Personel</InputLabel>
                      <Select
                        value={formData.personel_id}
                        onChange={(e) => setFormData({...formData, personel_id: e.target.value})}
                      >
                        {personeller.map((personel) => (
                          <MenuItem key={personel.id} value={personel.id}>
                            {personel.personel_adi} {personel.sicil_no && `(${personel.sicil_no})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Vardiya</InputLabel>
                      <Select
                        value={formData.vardiya_id}
                        onChange={(e) => setFormData({...formData, vardiya_id: e.target.value})}
                      >
                        {vardiyalar.map((vardiya) => (
                          <MenuItem key={vardiya.id} value={vardiya.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: vardiya.renk,
                                  borderRadius: '50%'
                                }}
                              />
                              {vardiya.vardiya_adi}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notlar"
                      multiline
                      rows={3}
                      value={formData.notlar}
                      onChange={(e) => setFormData({...formData, notlar: e.target.value})}
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAtamaFormClose}>İptal</Button>
              <Button type="submit" variant="contained">
                Ekle
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Toplu Atama Formu */}
        <Dialog open={topluAtamaFormOpen} onClose={handleTopluAtamaFormClose} maxWidth="sm" fullWidth>
          <form onSubmit={handleTopluAtamaSubmit}>
            <DialogTitle>Toplu Vardiya Ataması</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Başlangıç Tarihi"
                      value={topluFormData.baslangic_tarihi}
                      onChange={(newValue) => setTopluFormData({...topluFormData, baslangic_tarihi: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Bitiş Tarihi"
                      value={topluFormData.bitis_tarihi}
                      onChange={(newValue) => setTopluFormData({...topluFormData, bitis_tarihi: newValue})}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Personeller</InputLabel>
                      <Select
                        multiple
                        value={topluFormData.personel_ids}
                        onChange={(e) => setTopluFormData({...topluFormData, personel_ids: e.target.value})}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const personel = personeller.find(p => p.id === value);
                              return (
                                <Chip
                                  key={value}
                                  label={personel?.personel_adi || value}
                                  size="small"
                                />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {personeller.map((personel) => (
                          <MenuItem key={personel.id} value={personel.id}>
                            {personel.personel_adi} {personel.sicil_no && `(${personel.sicil_no})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Vardiya</InputLabel>
                      <Select
                        value={topluFormData.vardiya_id}
                        onChange={(e) => setTopluFormData({...topluFormData, vardiya_id: e.target.value})}
                      >
                        {vardiyalar.map((vardiya) => (
                          <MenuItem key={vardiya.id} value={vardiya.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: vardiya.renk,
                                  borderRadius: '50%'
                                }}
                              />
                              {vardiya.vardiya_adi}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Belirtilen tarih aralığındaki her gün için seçilen personellere vardiya ataması yapılacaktır.
                  Mevcut atamalar etkilenmeyecektir.
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleTopluAtamaFormClose}>İptal</Button>
              <Button type="submit" variant="contained">
                Toplu Atama Yap
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default VardiyaTakvimi;
