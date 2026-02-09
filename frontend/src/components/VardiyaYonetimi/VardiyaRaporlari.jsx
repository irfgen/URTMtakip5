import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe locale ayarla
dayjs.locale('tr');

function VardiyaRaporlari({ onMessage, setLoading }) {
  const [vardiyalar, setVardiyalar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [istatistikler, setIstatistikler] = useState(null);
  const [detayliRapor, setDetayliRapor] = useState([]);
  const [filters, setFilters] = useState({
    baslangic_tarihi: dayjs().subtract(30, 'day'),
    bitis_tarihi: dayjs(),
    vardiya_id: '',
    personel_id: ''
  });

  useEffect(() => {
    fetchVardiyalar();
    fetchPersoneller();
  }, []);

  useEffect(() => {
    fetchRaporlar();
  }, [filters]);

  const fetchVardiyalar = async () => {
    try {
      const response = await fetch('/api/vardiyalar');
      if (!response.ok) throw new Error('Vardiyalar getirilemedi');
      const data = await response.json();
      setVardiyalar(data);
    } catch (error) {
      console.error('Vardiyalar getirilirken hata:', error);
    }
  };

  const fetchPersoneller = async () => {
    try {
      const response = await fetch('/api/personel');
      if (!response.ok) throw new Error('Personeller getirilemedi');
      const data = await response.json();
      setPersoneller(data);
    } catch (error) {
      console.error('Personeller getirilirken hata:', error);
    }
  };

  const fetchRaporlar = async () => {
    try {
      setLoading(true);
      
      // Genel istatistikler
      const istatistikResponse = await fetch('/api/vardiya-atamalari?' + new URLSearchParams({
        baslangic_tarihi: filters.baslangic_tarihi.format('YYYY-MM-DD'),
        bitis_tarihi: filters.bitis_tarihi.format('YYYY-MM-DD'),
        ...(filters.vardiya_id && { vardiya_id: filters.vardiya_id }),
        ...(filters.personel_id && { personel_id: filters.personel_id })
      }));
      
      if (!istatistikResponse.ok) throw new Error('İstatistikler getirilemedi');
      const istatistikData = await istatistikResponse.json();
      
      // İstatistikleri hesapla
      const toplamAtama = istatistikData.length;
      const tamamlananAtama = istatistikData.filter(a => a.durum === 'tamamlandi').length;
      const aktifAtama = istatistikData.filter(a => a.durum === 'aktif').length;
      const iptalAtama = istatistikData.filter(a => a.durum === 'iptal').length;
      const planlanananAtama = istatistikData.filter(a => a.durum === 'planlanan').length;
      
      setIstatistikler({
        toplamAtama,
        tamamlananAtama,
        aktifAtama,
        iptalAtama,
        planlanananAtama,
        tamamlanmaOrani: toplamAtama > 0 ? ((tamamlananAtama / toplamAtama) * 100).toFixed(1) : 0
      });
      
      setDetayliRapor(istatistikData);
    } catch (error) {
      console.error('Raporlar getirilirken hata:', error);
      onMessage('Raporlar getirilemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const diff = end.diff(start, 'minute');
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours}s ${minutes}dk`;
  };

  const getDurumColor = (durum) => {
    switch (durum) {
      case 'tamamlandi': return 'success';
      case 'aktif': return 'primary';
      case 'iptal': return 'error';
      default: return 'default';
    }
  };

  const getDurumLabel = (durum) => {
    switch (durum) {
      case 'tamamlandi': return 'Tamamlandı';
      case 'aktif': return 'Aktif';
      case 'iptal': return 'İptal';
      case 'planlanan': return 'Planlanan';
      default: return durum;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vardiya Raporları
        </Typography>

        {/* Filtreler */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Filtreler
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={filters.baslangic_tarihi}
                onChange={(newValue) => handleFilterChange('baslangic_tarihi', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Bitiş Tarihi"
                value={filters.bitis_tarihi}
                onChange={(newValue) => handleFilterChange('bitis_tarihi', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vardiya</InputLabel>
                <Select
                  value={filters.vardiya_id}
                  onChange={(e) => handleFilterChange('vardiya_id', e.target.value)}
                >
                  <MenuItem value="">Tüm Vardiyalar</MenuItem>
                  {vardiyalar.map((vardiya) => (
                    <MenuItem key={vardiya.id} value={vardiya.id}>
                      {vardiya.vardiya_adi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Personel</InputLabel>
                <Select
                  value={filters.personel_id}
                  onChange={(e) => handleFilterChange('personel_id', e.target.value)}
                >
                  <MenuItem value="">Tüm Personeller</MenuItem>
                  {personeller.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {personel.personel_adi}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* İstatistik Kartları */}
        {istatistikler && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon color="primary" />
                    <Box>
                      <Typography variant="h6">
                        {istatistikler.toplamAtama}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Toplam Atama
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Box>
                      <Typography variant="h6">
                        {istatistikler.tamamlananAtama}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tamamlanan
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon color="primary" />
                    <Box>
                      <Typography variant="h6">
                        {istatistikler.aktifAtama}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aktif
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon color="info" />
                    <Box>
                      <Typography variant="h6">
                        {istatistikler.planlanananAtama}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Planlanan
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelIcon color="error" />
                    <Box>
                      <Typography variant="h6">
                        {istatistikler.iptalAtama}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        İptal
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Box>
                      <Typography variant="h6">
                        %{istatistikler.tamamlanmaOrani}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tamamlanma Oranı
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Detaylı Rapor Tablosu */}
        <Paper>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Detaylı Vardiya Raporu
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Personel</TableCell>
                  <TableCell>Vardiya</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Planlanan Saat</TableCell>
                  <TableCell>Fiili Saat</TableCell>
                  <TableCell>Çalışma Süresi</TableCell>
                  <TableCell>Notlar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detayliRapor.map((atama) => (
                  <TableRow key={atama.id}>
                    <TableCell>
                      {dayjs(atama.tarih).format('DD.MM.YYYY')}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {atama.personel.personel_adi}
                        </Typography>
                        {atama.personel.sicil_no && (
                          <Typography variant="caption" color="text.secondary">
                            {atama.personel.sicil_no}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: atama.vardiya.renk,
                            borderRadius: '50%'
                          }}
                        />
                        {atama.vardiya.vardiya_adi}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDurumLabel(atama.durum)}
                        color={getDurumColor(atama.durum)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {atama.baslangic_saati || atama.vardiya.baslangic_saati} - {atama.bitis_saati || atama.vardiya.bitis_saati}
                    </TableCell>
                    <TableCell>
                      {atama.fiili_baslangic && atama.fiili_bitis ? (
                        `${dayjs(atama.fiili_baslangic).format('HH:mm')} - ${dayjs(atama.fiili_bitis).format('HH:mm')}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDuration(atama.fiili_baslangic, atama.fiili_bitis)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {atama.notlar || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}

export default VardiyaRaporlari;
