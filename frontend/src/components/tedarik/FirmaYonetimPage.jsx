import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import tedarikService from '../../services/tedarikService.js';
import FirmaEkleModal from './FirmaEkleModal.jsx';
import FirmaDetayModal from './FirmaDetayModal.jsx';

const FirmaYonetimPage = () => {
  const [firmalar, setFirmalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalFirmalar, setTotalFirmalar] = useState(0);
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [firmaEkleModalOpen, setFirmaEkleModalOpen] = useState(false);
  const [firmaDetayModalOpen, setFirmaDetayModalOpen] = useState(false);
  const [selectedFirma, setSelectedFirma] = useState(null);
  const [istatistikler, setIstatistikler] = useState(null);
  const [error, setError] = useState('');

  // Firmaları yükle
  const loadFirmalar = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(arama && { arama }),
        ...(durumFiltre && { durum: durumFiltre })
      };

      const response = await tedarikService.getFirmalar(params);
      setFirmalar(response.data || []);
      setTotalFirmalar(response.pagination?.total || 0);
      setError('');
    } catch (error) {
      console.error('Firmalar yüklenirken hata:', error);
      setError(error.message || 'Firmalar yüklenirken bir hata oluştu');
      setFirmalar([]);
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri yükle
  const loadIstatistikler = async () => {
    try {
      const response = await tedarikService.getFirmaIstatistikler();
      setIstatistikler(response.data);
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    loadFirmalar();
  }, [page, rowsPerPage, arama, durumFiltre]);

  useEffect(() => {
    loadIstatistikler();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleArama = (event) => {
    setArama(event.target.value);
    setPage(0);
  };

  const handleFirmaEkle = () => {
    setSelectedFirma(null);
    setFirmaEkleModalOpen(true);
  };

  const handleFirmaDuzenle = (firma) => {
    setSelectedFirma(firma);
    setFirmaEkleModalOpen(true);
  };

  const handleFirmaDetay = (firma) => {
    setSelectedFirma(firma);
    setFirmaDetayModalOpen(true);
  };

  const handleFirmaSil = async (firma) => {
    if (window.confirm(`"${firma.firma_adi}" firmasını silmek istediğinizden emin misiniz?`)) {
      try {
        await tedarikService.deleteFirma(firma.id);
        loadFirmalar();
        loadIstatistikler();
      } catch (error) {
        alert(error.message || 'Firma silinirken bir hata oluştu');
      }
    }
  };

  const handleFirmaDurumDegistir = async (firma) => {
    try {
      const yeniDurum = firma.durum === 'aktif' ? 'pasif' : 'aktif';
      await tedarikService.changeFirmaDurum(firma.id, yeniDurum);
      loadFirmalar();
      loadIstatistikler();
    } catch (error) {
      alert(error.message || 'Firma durumu değiştirilirken bir hata oluştu');
    }
  };

  const handleModalClose = () => {
    setFirmaEkleModalOpen(false);
    setSelectedFirma(null);
    loadFirmalar();
    loadIstatistikler();
  };

  const handleAramaEnter = (e) => {
    if (e.key === 'Enter') {
      loadFirmalar();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Firma Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleFirmaEkle}
          disabled={loading}
        >
          Yeni Firma Ekle
        </Button>
      </Box>

      {/* İstatistikler */}
      {istatistikler && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Toplam Firma
                </Typography>
                <Typography variant="h4" color="primary">
                  {istatistikler.toplam}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Aktif Firmalar
                </Typography>
                <Typography variant="h4" color="success.main">
                  {istatistikler.aktif}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  Pasif Firmalar
                </Typography>
                <Typography variant="h4" color="error.main">
                  {istatistikler.pasif}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtreler */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Firma adı, kodu, vergi no veya yetkili kişi ara..."
                value={arama}
                onChange={handleArama}
                onKeyPress={handleAramaEnter}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  value={durumFiltre}
                  onChange={(e) => setDurumFiltre(e.target.value)}
                  label="Durum"
                  disabled={loading}
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="aktif">Aktif</MenuItem>
                  <MenuItem value="pasif">Pasif</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setArama('');
                  setDurumFiltre('');
                  setPage(0);
                }}
                disabled={loading}
              >
                Filtreleri Temizle
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Hata Mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Firma Tablosu */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Firma Bilgileri</TableCell>
                  <TableCell>İletişim</TableCell>
                  <TableCell>Yetkili</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell align="center">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>Yükleniyor...</Typography>
                    </TableCell>
                  </TableRow>
                ) : firmalar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary">
                        {arama || durumFiltre ? 'Filtrelere uygun firma bulunamadı' : 'Kayıtlı firma bulunamadı'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  firmalar.map((firma) => (
                    <TableRow key={firma.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {firma.firma_adi}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Kod: {firma.firma_kodu}
                          </Typography>
                          {firma.vergi_no && (
                            <Typography variant="body2" color="textSecondary">
                              V.No: {firma.vergi_no}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {firma.telefon && (
                            <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                              <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {firma.telefon_formatli || firma.telefon}
                              </Typography>
                            </Box>
                          )}
                          {firma.email && (
                            <Box display="flex" alignItems="center">
                              <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                {firma.email}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {firma.yetkili_kisi ? (
                          <Box>
                            <Typography variant="body2">
                              {firma.yetkili_kisi}
                            </Typography>
                            {firma.yetkili_telefon && (
                              <Typography variant="body2" color="textSecondary">
                                {firma.yetkili_telefon_formatli || firma.yetkili_telefon}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={firma.durum.toUpperCase()}
                          color={firma.durum === 'aktif' ? 'success' : 'default'}
                          size="small"
                          clickable
                          onClick={() => handleFirmaDurumDegistir(firma)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Detay">
                            <IconButton
                              size="small"
                              onClick={() => handleFirmaDetay(firma)}
                              disabled={loading}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              onClick={() => handleFirmaDuzenle(firma)}
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleFirmaSil(firma)}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Sayfalama */}
          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={totalFirmalar}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Sayfa başına"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </CardContent>
      </Card>

      {/* Firma Ekle/Düzenle Modal */}
      <FirmaEkleModal
        open={firmaEkleModalOpen}
        onClose={handleModalClose}
        onSuccess={() => {
          handleModalClose();
        }}
        firma={selectedFirma}
      />

      {/* Firma Detay Modal */}
      <FirmaDetayModal
        open={firmaDetayModalOpen}
        onClose={() => {
          setFirmaDetayModalOpen(false);
          setSelectedFirma(null);
        }}
        firma={selectedFirma}
        onEdit={() => {
          setFirmaDetayModalOpen(false);
          handleFirmaDuzenle(selectedFirma);
        }}
      />
    </Box>
  );
};

export default FirmaYonetimPage;