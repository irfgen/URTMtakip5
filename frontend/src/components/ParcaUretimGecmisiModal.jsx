import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BuildIcon from '@mui/icons-material/Build';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import InventoryIcon from '@mui/icons-material/Inventory';
import axios from 'axios';

const ParcaUretimGecmisiModal = ({ open, onClose, parcaKodu, parcaAdi }) => {
  const [uretimGecmisi, setUretimGecmisi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && parcaKodu) {
      fetchUretimGecmisi();
    }
  }, [open, parcaKodu]);

  const fetchUretimGecmisi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/tamamlanan-isler/parca/${encodeURIComponent(parcaKodu)}`);
      setUretimGecmisi(response.data);
    } catch (err) {
      console.error('Parça üretim geçmişi yüklenirken hata:', err);
      setError('Üretim geçmişi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatTarih = (tarih) => {
    if (!tarih) return 'Belirtilmemiş';
    const date = new Date(tarih);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSure = (sure) => {
    if (!sure) return 'Hesaplanmamış';
    return sure;
  };

  const handleClose = () => {
    setUretimGecmisi([]);
    setError(null);
    onClose();
  };

  // Mobil görünüm için kart bazlı tasarım
  const isMobile = window.innerWidth <= 768;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '70vh',
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <InventoryIcon color="primary" />
            <Box>
              <Typography variant="h6">Parça Üretim Geçmişi</Typography>
              <Typography variant="body2" color="text.secondary">
                {parcaKodu} - {parcaAdi}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && uretimGecmisi.length === 0 && (
          <Box textAlign="center" py={4}>
            <BuildIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Bu parçaya ait üretim geçmişi bulunamadı
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Henüz tamamlanmış iş emri bulunmuyor
            </Typography>
          </Box>
        )}

        {!loading && !error && uretimGecmisi.length > 0 && (
          <>
            {/* Özet bilgiler */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Özet Bilgiler
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip 
                  icon={<BuildIcon />}
                  label={`Toplam ${uretimGecmisi.length} iş emri`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={<InventoryIcon />}
                  label={`Toplam ${uretimGecmisi.reduce((sum, is) => sum + (is.islenen_adet || 0), 0)} adet üretildi`}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Mobil görünüm - Kart bazlı */}
            {isMobile ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {uretimGecmisi.map((is, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {is.is_emri_no}
                        </Typography>
                        <Chip 
                          label={`${is.islenen_adet || 0} adet`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatTarih(is.bitis_tarihi)}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatSure(is.toplam_sure)}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <PrecisionManufacturingIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {is.tezgah_adi || 'Bilinmeyen Tezgah'}
                          </Typography>
                        </Box>
                      </Box>

                      {is.notlar && (
                        <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
                          <Typography variant="caption" color="text.secondary">
                            Notlar: {is.notlar}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              /* Desktop görünüm - Tablo bazlı */
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>İş Emri No</TableCell>
                      <TableCell>Bitiş Tarihi</TableCell>
                      <TableCell align="center">İşlenen Adet</TableCell>
                      <TableCell align="center">Toplam Süre</TableCell>
                      <TableCell>Tezgah</TableCell>
                      <TableCell>Notlar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uretimGecmisi.map((is, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {is.is_emri_no}
                          </Typography>
                          {is.is_adi && (
                            <Typography variant="caption" color="text.secondary">
                              {is.is_adi}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatTarih(is.bitis_tarihi)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={is.islenen_adet || 0}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="primary">
                            {formatSure(is.toplam_sure)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PrecisionManufacturingIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {is.tezgah_adi || 'Bilinmeyen Tezgah'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {is.notlar ? (
                            <Typography variant="body2" color="text.secondary">
                              {is.notlar}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParcaUretimGecmisiModal;
