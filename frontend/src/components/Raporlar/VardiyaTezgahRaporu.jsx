import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Assessment as ReportIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import apiClient from '../../utils/apiClient';

const VardiyaTezgahRaporu = () => {
  // State yönetimi
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [raporData, setRaporData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Component mount edildiğinde raporu yükle
  useEffect(() => {
    fetchRaporData();
  }, [selectedDate]);

  /**
   * Rapor verilerini getir
   */
  const fetchRaporData = async () => {
    try {
      setLoading(true);
      setError('');

      // API call - tek tarih parametresi
      const data = await apiClient.get('raporlar/vardiya-tezgah', {
        tarih: selectedDate
      });

      setRaporData(data);
      setSuccess('Rapor başarıyla yüklendi');

      // Success mesajını 3 saniye sonra temizle
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Rapor getirilirken hata:', error);
      setError('Rapor yüklenemedi: ' + error.message);
      setRaporData(null);
    } finally {
      setLoading(false);
    }
  };


  /**
   * Tarih değişikliği
   */
  const handleDateChange = (value) => {
    setSelectedDate(value);
  };

  /**
   * Raporu yenile
   */
  const handleRefresh = () => {
    fetchRaporData();
  };

  /**
   * Vardiya kartı render fonksiyonu
   */
  const renderVardiyaKartlari = (tezgah) => {
    return (
      <Grid container spacing={1} key={tezgah.tezgah_id}>
        {tezgah.vardiyalar.map((vardiya) => (
          <Grid item xs={12} sm={6} md={4} key={vardiya.vardiya_id}>
            <Card
              sx={{
                border: `2px solid ${vardiya.aktif_mi ? '#4caf50' : '#e0e0e0'}`,
                bgcolor: vardiya.aktif_mi ? '#f1f8e9' : '#fafafa'
              }}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: vardiya.renk,
                      borderRadius: '50%',
                      mr: 1
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                    {vardiya.vardiya_adi}
                  </Typography>
                  <Chip
                    label={vardiya.aktif_mi ? 'Aktif' : 'Pasif'}
                    size="small"
                    color={vardiya.aktif_mi ? 'success' : 'default'}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                  {vardiya.baslangic_saati} - {vardiya.bitis_saati}
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Çalışma:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vardiya.calisma_suresi} dk
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Duruş:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="error">
                      {vardiya.durus_suresi} dk
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Verimlilik:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      %{vardiya.verimlilik_orani}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      İşlem:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {vardiya.islem_sayisi}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ReportIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Günlük Tezgah Çalışma Raporu
        </Typography>
      </Box>

      {/* Mesajlar */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filtreler */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rapor Filtreleri
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tarih Seç"
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Yenile
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Özet Kartları */}
      {raporData && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Rapor Tarihi
                </Typography>
                <Typography variant="h6" component="div">
                  {raporData.tarih}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Toplam Tezgah
                </Typography>
                <Typography variant="h4" component="div" color="primary">
                  {raporData.ozet?.toplam_tezgah || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Aktif Tezgah
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {raporData.ozet?.aktif_tezgah || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Ortalama Verimlilik
                </Typography>
                <Typography variant="h4" component="div">
                  <Chip
                    label={`%${raporData.ozet?.ortalama_verimlilik || 0}`}
                    color={
                      (raporData.ozet?.ortalama_verimlilik || 0) > 80 ? 'success' :
                      (raporData.ozet?.ortalama_verimlilik || 0) > 60 ? 'warning' : 'error'
                    }
                  />
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Rapor yükleniyor...</Typography>
        </Box>
      )}

      {/* Tezgah Listesi - Accordion */}
      {raporData && !loading && raporData.tezgahlar && raporData.tezgahlar.length > 0 && (
        <Grid container spacing={2}>
          {raporData.tezgahlar.map((tezgah) => (
            <Grid item xs={12} key={tezgah.tezgah_id}>
              <Accordion defaultExpanded={raporData.tezgahlar.length === 1}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {tezgah.tezgah_tanimi}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({tezgah.vardiyalar.filter(v => v.aktif_mi).length}/{tezgah.vardiyalar.length} aktif vardiya)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 2 }}>
                    {renderVardiyaKartlari(tezgah)}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Veri yok mesajı */}
      {!loading && !raporData && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Rapor yükleniyor...
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && raporData && raporData.tezgahlar && raporData.tezgahlar.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Seçilen tarihte veri bulunamadı
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Farklı bir tarih seçmeyi deneyin
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VardiyaTezgahRaporu;