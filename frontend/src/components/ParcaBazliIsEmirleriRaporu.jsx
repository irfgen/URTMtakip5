import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BarChartIcon from '@mui/icons-material/BarChart';
import axios from 'axios';
import { parcalarAPI, raporlarAPI } from '../services/api';

const ParcaBazliIsEmirleriRaporu = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parcalar, setParcalar] = useState([]);
  const [selectedParca, setSelectedParca] = useState(null);
  const [durum, setDurum] = useState('tumu');
  const [dateRange, setDateRange] = useState([null, null]);
  const [isEmirleri, setIsEmirleri] = useState([]);
  const [istatistikler, setIstatistikler] = useState(null);

  // Parçaları yükle
  useEffect(() => {
    loadParcalar();
  }, []);

  const loadParcalar = async () => {
    try {
      const response = await parcalarAPI.getAll({ limit: 1000 });
      const parcaData = response.data.parcalar || response.data;
      setParcalar(parcaData.map(p => ({
        value: p.parcaKodu || p.parca_kodu,
        label: `${p.parcaKodu || p.parca_kodu} - ${p.parcaAdi || p.parca_adi}`
      })));
    } catch (error) {
      console.error('Parçalar yüklenirken hata:', error);
      setError('Parçalar yüklenemedi');
    }
  };

  const loadRapor = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {};
      
      if (selectedParca) {
        params.parca_kodu = selectedParca.value;
      }
      
      if (durum !== 'tumu') {
        params.durum = durum;
      }
      
      if (dateRange[0]) {
        params.baslangic = dateRange[0].toISOString().split('T')[0];
      }
      
      if (dateRange[1]) {
        params.bitis = dateRange[1].toISOString().split('T')[0];
      }

      const response = await axios.get('/api/raporlar/parca-is-emirleri', { params });
      
      setIsEmirleri(response.data.is_emirleri || []);
      setIstatistikler(response.data.istatistikler || null);
    } catch (error) {
      console.error('Rapor yüklenirken hata:', error);
      setError('Rapor yüklenemedi: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedParca(null);
    setDurum('tumu');
    setDateRange([null, null]);
    setIsEmirleri([]);
    setIstatistikler(null);
  };

  const getDurumColor = (durum) => {
    switch (durum) {
      case 'tamamlandı': return 'success';
      case 'başlatıldı':
      case 'devam ediyor': return 'primary';
      case 'beklemede': return 'warning';
      case 'hazırlanıyor': return 'info';
      case 'iptal': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const exportToExcel = () => {
    if (isEmirleri.length === 0) {
      alert('İhraç edilecek veri bulunamadı');
      return;
    }

    // CSV formatında veri hazırla
    const headers = [
      'İş Emri No', 'İş Adı', 'Parça Kodu', 'Parça Adı', 'Kategori', 
      'Durum', 'Planlanan Adet', 'Gerçekleşen Adet', 'Hurda Sayısı',
      'Verimlilik %', 'Başlangıç Tarihi', 'Bitiş Tarihi', 'Öncelik'
    ];

    const csvData = [
      headers.join(','),
      ...isEmirleri.map(ie => [
        ie.is_emri_no,
        `"${ie.is_adi}"`,
        ie.parca_kodu,
        `"${ie.parca_adi}"`,
        `"${ie.kategori}"`,
        ie.durum,
        ie.planlanan_adet,
        ie.gerceklesen_adet,
        ie.hurda_sayisi,
        ie.verimlilik || 0,
        formatDate(ie.baslangic_tarihi),
        formatDate(ie.bitis_tarihi),
        ie.oncelik || '-'
      ].join(','))
    ].join('\n');

    // Dosyayı indir
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `parca_bazli_is_emirleri_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AssignmentIcon sx={{ mr: 1 }} /> 
          Parça Bazlı İş Emirleri Raporu
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Autocomplete
              options={parcalar}
              value={selectedParca}
              onChange={(event, newValue) => setSelectedParca(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parça Seçin"
                  placeholder="Parça kodu veya adı ile arayın..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {selectedParca && (
                          <IconButton
                            size="small"
                            onClick={() => setSelectedParca(null)}
                            sx={{ mr: 1 }}
                          >
                            <ClearIcon />
                          </IconButton>
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.value === value?.value}
              noOptionsText="Parça bulunamadı"
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Durum</InputLabel>
              <Select
                value={durum}
                label="Durum"
                onChange={(e) => setDurum(e.target.value)}
              >
                <MenuItem value="tumu">Tümü</MenuItem>
                <MenuItem value="hazırlanıyor">Hazırlanıyor</MenuItem>
                <MenuItem value="başlatıldı">Başlatıldı</MenuItem>
                <MenuItem value="devam ediyor">Devam Ediyor</MenuItem>
                <MenuItem value="beklemede">Beklemede</MenuItem>
                <MenuItem value="tamamlandı">Tamamlandı</MenuItem>
                <MenuItem value="iptal">İptal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={dateRange[0]}
                onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Bitiş Tarihi"
                value={dateRange[1]}
                onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SearchIcon />}
                onClick={loadRapor}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Raporu Oluştur'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
                fullWidth
              >
                Temizle
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* İstatistikler */}
      {istatistikler && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {istatistikler.toplam_is_emri}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam İş Emri
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {istatistikler.tamamlanan}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamamlanan
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {istatistikler.devam_eden}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Devam Eden
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {istatistikler.bekleyen}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bekleyen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {istatistikler.toplam_uretilen}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toplam Üretilen
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {istatistikler.ortalama_verimlilik}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ort. Verimlilik
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* İş Emirleri Tablosu */}
      {isEmirleri.length > 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              İş Emirleri Listesi ({isEmirleri.length} kayıt)
            </Typography>
            <Box>
              <Tooltip title="Yazdır">
                <IconButton onClick={printReport} sx={{ mr: 1 }}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excel'e İndir">
                <IconButton onClick={exportToExcel} color="primary">
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>İş Emri No</TableCell>
                  <TableCell>İş Adı</TableCell>
                  <TableCell>Parça Kodu</TableCell>
                  <TableCell>Parça Adı</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="right">Planlanan</TableCell>
                  <TableCell align="right">Gerçekleşen</TableCell>
                  <TableCell align="right">Hurda</TableCell>
                  <TableCell align="right">Verimlilik</TableCell>
                  <TableCell>Başlangıç</TableCell>
                  <TableCell>Bitiş</TableCell>
                  <TableCell>Öncelik</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isEmirleri.map((ie) => (
                  <TableRow
                    key={ie.is_emri_id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="medium">
                        {ie.is_emri_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {ie.is_adi}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {ie.parca_kodu}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {ie.parca_adi}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ie.durum}
                        color={getDurumColor(ie.durum)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{ie.planlanan_adet}</TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={ie.gerceklesen_adet > 0 ? "success.main" : "text.secondary"}
                        fontWeight={ie.gerceklesen_adet > 0 ? "medium" : "normal"}
                      >
                        {ie.gerceklesen_adet}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={ie.hurda_sayisi > 0 ? "error.main" : "text.secondary"}
                        fontWeight={ie.hurda_sayisi > 0 ? "medium" : "normal"}
                      >
                        {ie.hurda_sayisi}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {ie.verimlilik !== null ? (
                        <Typography 
                          variant="body2" 
                          color={ie.verimlilik >= 80 ? "success.main" : 
                                ie.verimlilik >= 60 ? "warning.main" : "error.main"}
                          fontWeight="medium"
                        >
                          {ie.verimlilik}%
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(ie.baslangic_tarihi)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(ie.bitis_tarihi)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {ie.oncelik && (
                        <Chip
                          label={ie.oncelik}
                          color={ie.oncelik === 'yüksek' ? 'error' : 
                                ie.oncelik === 'orta' ? 'warning' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Boş durum */}
      {!loading && isEmirleri.length === 0 && istatistikler === null && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BarChartIcon sx={{ fontSize: 80, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Parça Bazlı İş Emirleri Raporu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bir parça seçin ve raporu oluşturun. Ayrıca tarih aralığı ve durum filtrelerini kullanabilirsiniz.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ParcaBazliIsEmirleriRaporu;
