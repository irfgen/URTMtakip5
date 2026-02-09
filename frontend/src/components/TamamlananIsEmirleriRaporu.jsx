import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  GetApp as GetAppIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const TamamlananIsEmirleriRaporu = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Filtreleme durumları
  const [filters, setFilters] = useState({
    baslangicTarihi: '',
    bitisTarihi: '',
    tezgahId: '',
    parcaKodu: ''
  });

  // Tablo durumları
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('bitis_tarihi');
  const [sortOrder, setSortOrder] = useState('desc');

  // Veri çekme fonksiyonu
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.baslangicTarihi) {
        params.append('baslangic', filters.baslangicTarihi);
      }
      if (filters.bitisTarihi) {
        params.append('bitis', filters.bitisTarihi);
      }
      if (filters.tezgahId) {
        params.append('tezgah_id', filters.tezgahId);
      }
      if (filters.parcaKodu) {
        params.append('parca_kodu', filters.parcaKodu);
      }

      const response = await fetch(`/api/raporlar/tamamlanan-is-emirleri?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Tamamlanan iş emirleri raporu yüklenirken hata:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchData();
  }, []);

  // Filtreleri temizle
  const clearFilters = () => {
    setFilters({
      baslangicTarihi: '',
      bitisTarihi: '',
      tezgahId: '',
      parcaKodu: ''
    });
  };

  // Sayfa değişimi
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Sayfa boyutu değişimi
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Tarih formatlama
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Süre formatlama
  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  // Verimlilik rengi
  const getVerimlilikColor = (verimlilik) => {
    if (!verimlilik) return 'default';
    if (verimlilik >= 90) return 'success';
    if (verimlilik >= 70) return 'warning';
    return 'error';
  };

  // Tamamlanma oranı rengi
  const getTamamlanmaColor = (oran) => {
    if (oran >= 100) return 'success';
    if (oran >= 80) return 'warning';
    return 'error';
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Rapor yüklenirken hata oluştu: {error}
      </Alert>
    );
  }

  const tamamlananIsler = data?.tamamlanan_isler || [];
  const istatistikler = data?.istatistikler || {};

  // Sıralama ve sayfalama
  const sortedData = [...tamamlananIsler].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box sx={{ p: 2 }}>
        {/* Başlık */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h5" component="h1">
            Tamamlanan İş Emirleri Raporu
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Verileri Yenile">
            <IconButton onClick={fetchData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Filtreler */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Filtreler</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Başlangıç Tarihi"
                  value={filters.baslangicTarihi}
                  onChange={(e) => setFilters(prev => ({ ...prev, baslangicTarihi: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Bitiş Tarihi"
                  value={filters.bitisTarihi}
                  onChange={(e) => setFilters(prev => ({ ...prev, bitisTarihi: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Tezgah ID"
                  value={filters.tezgahId}
                  onChange={(e) => setFilters(prev => ({ ...prev, tezgahId: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Parça Kodu"
                  value={filters.parcaKodu}
                  onChange={(e) => setFilters(prev => ({ ...prev, parcaKodu: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    onClick={fetchData}
                    disabled={loading}
                    fullWidth
                  >
                    Filtrele
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={clearFilters}
                    disabled={loading}
                  >
                    Temizle
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Özet İstatistikler */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Toplam Tamamlanan İş
                    </Typography>
                    <Typography variant="h5">
                      {istatistikler.toplam_tamamlanan_is || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Toplam Üretilen
                    </Typography>
                    <Typography variant="h5">
                      {istatistikler.toplam_uretilen_adet || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Ortalama Verimlilik
                    </Typography>
                    <Typography variant="h5">
                      %{istatistikler.ortalama_verimlilik || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PieChartIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Ortalama Hurda Oranı
                    </Typography>
                    <Typography variant="h5">
                      %{istatistikler.ortalama_hurda_orani || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ana Tablo */}
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Tamamlanan İş Emirleri Detayları
            </Typography>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>İş Emri No</TableCell>
                  <TableCell>İş Adı</TableCell>
                  <TableCell>Parça Kodu</TableCell>
                  <TableCell>Tezgah</TableCell>
                  <TableCell>Başlama</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Süre</TableCell>
                  <TableCell>Adet</TableCell>
                  <TableCell>Tamamlanma</TableCell>
                  <TableCell>Verimlilik</TableCell>
                  <TableCell>Hurda Oranı</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((is) => (
                  <TableRow key={is.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {is.is_emri_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {is.is_adi || 'Belirtilmemiş'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={is.parca_kodu || 'N/A'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {is.tezgah_tanimi || 'Bilinmeyen'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(is.baslama_tarihi)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(is.bitis_tarihi)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(is.aktuel_sure_dakika)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {is.islenen_adet || 0} / {is.toplam_adet || 0}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={is.tamamlanma_orani}
                          sx={{ mt: 0.5, height: 4 }}
                          color={getTamamlanmaColor(is.tamamlanma_orani)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`%${is.tamamlanma_orani}`}
                        size="small"
                        color={getTamamlanmaColor(is.tamamlanma_orani)}
                      />
                    </TableCell>
                    <TableCell>
                      {is.verimlilik ? (
                        <Chip
                          label={`%${is.verimlilik.toFixed(1)}`}
                          size="small"
                          color={getVerimlilikColor(is.verimlilik)}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={parseFloat(is.hurda_orani) > 5 ? 'error.main' : 'text.primary'}>
                        %{is.hurda_orani}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={sortedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına satır:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Paper>

        {/* Tezgah Bazlı Analiz */}
        {Object.keys(istatistikler.tezgah_dagilimi || {}).length > 0 && (
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                Tezgah Bazlı Analiz
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(istatistikler.tezgah_dagilimi).map(([tezgahAdi, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={tezgahAdi}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {tezgahAdi}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          Toplam İş: {data.toplam_is}
                        </Typography>
                        <Typography variant="body2">
                          Toplam Adet: {data.toplam_adet}
                        </Typography>
                        <Typography variant="body2">
                          Ortalama/İş: {data.toplam_is > 0 ? (data.toplam_adet / data.toplam_is).toFixed(1) : 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        )}

        {/* Performans Özetleri */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                En Verimli İşler (Top 5)
              </Typography>
              {tamamlananIsler
                .filter(is => is.verimlilik != null)
                .sort((a, b) => b.verimlilik - a.verimlilik)
                .slice(0, 5)
                .map((is, index) => (
                  <Box key={is.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {index + 1}. {is.is_emri_no} - {is.parca_kodu}
                    </Typography>
                    <Chip
                      label={`%${is.verimlilik.toFixed(1)}`}
                      size="small"
                      color="success"
                    />
                  </Box>
                ))}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                En Yüksek Hurda Oranı (Top 5)
              </Typography>
              {tamamlananIsler
                .filter(is => parseFloat(is.hurda_orani) > 0)
                .sort((a, b) => parseFloat(b.hurda_orani) - parseFloat(a.hurda_orani))
                .slice(0, 5)
                .map((is, index) => (
                  <Box key={is.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      {index + 1}. {is.is_emri_no} - {is.parca_kodu}
                    </Typography>
                    <Chip
                      label={`%${is.hurda_orani}`}
                      size="small"
                      color="error"
                    />
                  </Box>
                ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default TamamlananIsEmirleriRaporu;
