import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  CheckCircle as OnayIcon,
  Cancel as RedIcon,
  LocalShipping as SiparisIcon,
  DoneAll as TeslimIcon,
  Description as AciklamaIcon,
  Assignment as DokumanIcon,
  Receipt as IrsaliyeIcon,
  Visibility as VisibilityIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import tedarikService from '../../services/tedarikService';
import TedarikTalepForm from './TedarikTalepForm';

const TedarikTalepDetay = ({ open, onClose, talep, onEdit }) => {
  const [loading, setLoading] = useState(false);

  const getDurumColor = (durum) => {
    const colors = {
      'beklemede': 'warning',
      'onaylandi': 'info',
      'reddedildi': 'error',
      'sipariste': 'secondary',
      'teslim_edildi': 'success'
    };
    return colors[durum] || 'default';
  };

  const getDurumIcon = (durum) => {
    const icons = {
      'beklemedi': <EditIcon />,
      'onaylandi': <OnayIcon />,
      'reddedildi': <RedIcon />,
      'sipariste': <SiparisIcon />,
      'teslim_edildi': <TeslimIcon />
    };
    return icons[durum];
  };

  const handleDuzenle = () => {
    onEdit?.(talep);
    onClose();
  };

  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    return new Date(tarih).toLocaleString('tr-TR');
  };

  const formatParaBirimFiyat = (fiyat) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(fiyat || 0);
  };

  if (!talep) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Tedarik Talep Detayı - {talep.talep_kodu}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Temel Bilgiler */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Durum
                    </Typography>
                    <Chip
                      icon={getDurumIcon(talep.durum)}
                      label={talep.durum?.replace('_', ' ').toUpperCase()}
                      color={getDurumColor(talep.durum)}
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Kaynak Tipi
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {talep.kaynak_tipi?.replace('_', ' ').toUpperCase() || 'MANUEL'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Tutar
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 1, color: 'primary.main' }}>
                      {formatParaBirimFiyat(talep.toplam_tutar)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Talep Tarihi
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {formatTarih(talep.talep_tarihi)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Talep Edenen
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {talep.talep_eden_kullanici || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Onaylayan
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {talep.onaylayan_kullanici || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Parça ve Malzeme Bilgileri */}
          {(talep.parca_kodu || talep.stokKarti) && (
            <Grid item xs={12}>
              <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <DokumanIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Parça ve Malzeme Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    {talep.parca_kodu && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Parça Kodu
                          </Typography>
                          <Tooltip title="Parça kartı detayını görüntüle">
                            <Button
                              size="small"
                              startIcon={<OpenInNewIcon />}
                              onClick={() => window.open(`/parcalar/${talep.parca_kodu}`, '_blank')}
                              sx={{ ml: 2, minWidth: 'auto' }}
                            >
                              Parça Kartı
                            </Button>
                          </Tooltip>
                        </Box>
                        <Box
                          sx={{
                            cursor: 'pointer',
                            p: 1,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                              borderColor: 'primary.main'
                            }
                          }}
                          onClick={() => window.open(`/parcalar/${talep.parca_kodu}`, '_blank')}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {talep.parca_kodu}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {talep.stokKarti && (
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Stok Kartı
                          </Typography>
                          <Tooltip title="Stok kartı detayını görüntüle">
                            <Button
                              size="small"
                              startIcon={<OpenInNewIcon />}
                              onClick={() => window.open(`/stok-kartlari/${talep.stokKarti.id}`, '_blank')}
                              sx={{ ml: 2, minWidth: 'auto' }}
                            >
                              Stok Kartı
                            </Button>
                          </Tooltip>
                        </Box>
                        <Box
                          sx={{
                            cursor: 'pointer',
                            p: 1,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                              borderColor: 'primary.main'
                            }
                          }}
                          onClick={() => window.open(`/stok-kartlari/${talep.stokKarti.id}`, '_blank')}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {talep.stokKarti.stok_kodu || talep.stokKarti.kesit}
                            {talep.stokKarti.boy && ` x ${talep.stokKarti.boy}mm`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Malzeme Adı: {talep.stokKarti.malzeme_adi || talep.stokKarti.malzeme_cinsi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Malzeme Cinsi: {talep.stokKarti.malzeme_cinsi}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stok: {talep.stokKarti.adet} {talep.stokKarti.birim || 'adet'}
                            {talep.stokKarti.kritik_stok_miktari && ` (Kritik: ${talep.stokKarti.kritik_stok_miktari})`}
                          </Typography>
                          {talep.stokKarti.lokasyon && (
                            <Typography variant="body2" color="text.secondary">
                              Konum: {talep.stokKarti.lokasyon}
                            </Typography>
                          )}
                          {talep.stokKarti.firma && (
                            <Typography variant="body2" color="text.secondary">
                              Tedarikçi: {talep.stokKarti.firma}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Malzeme Detayları */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Malzeme Detayları
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Malzeme Adı</TableCell>
                        <TableCell>Kodu</TableCell>
                        <TableCell>Tip</TableCell>
                        <TableCell>Miktar</TableCell>
                        <TableCell>Birim</TableCell>
                        <TableCell>Birim Fiyat</TableCell>
                        <TableCell>Toplam</TableCell>
                        <TableCell>İşlem</TableCell>
                        <TableCell>Termin</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {talep.detaylar?.map((detay, index) => {
                        // Malzeme tipini belirle - malzeme_kodu varsa parça, yoksa ham malzeme
                        const isParca = detay.malzeme_kodu && detay.malzeme_kodu !== '';
                        const malzemeTipi = isParca ? 'Parça' : 'Ham Malzeme';

                        // Stok kartı bilgisini kontrol et
                        const hasStokKarti = detay.stok_karti_id && detay.stokKarti;

                        return (
                          <TableRow key={index}>
                            <TableCell>{detay.malzeme_adi}</TableCell>
                            <TableCell>
                              {detay.malzeme_kodu ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {detay.malzeme_kodu}
                                  </Typography>
                                  <Typography variant="caption" color="primary.main">
                                    Parça Kodu
                                  </Typography>
                                </Box>
                              ) : hasStokKarti ? (
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {detay.stokKarti.kesit}
                                    {detay.stokKarti.boy && ` x ${detay.stokKarti.boy}mm`}
                                  </Typography>
                                  <Typography variant="caption" color="secondary.main">
                                    Stok Kartı #{detay.stokKarti.id}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box>
                                  <Typography variant="body2">
                                    Ham Malzeme
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Kod Yok
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={malzemeTipi}
                                size="small"
                                color={isParca ? 'primary' : hasStokKarti ? 'info' : 'secondary'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {parseFloat(detay.miktar).toLocaleString('tr-TR')} {detay.birim}
                            </TableCell>
                            <TableCell>{detay.birim}</TableCell>
                            <TableCell>
                              {formatParaBirimFiyat(detay.birim_fiyat)}
                            </TableCell>
                            <TableCell>
                              {formatParaBirimFiyat(
                                (parseFloat(detay.miktar) || 0) * (parseFloat(detay.birim_fiyat) || 0)
                              )}
                            </TableCell>
                            <TableCell>
                              {isParca ? (
                                <Tooltip title="Parça kartı detayını görüntüle">
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => window.open(`/parcalar/${detay.malzeme_kodu}`, '_blank')}
                                    variant="outlined"
                                  >
                                    Parça Kartı
                                  </Button>
                                </Tooltip>
                              ) : hasStokKarti ? (
                                <Tooltip title="Stok kartı detayını görüntüle">
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => window.open(`/stok-kartlari/${detay.stokKarti.id}`, '_blank')}
                                    variant="outlined"
                                    color="info"
                                  >
                                    Stok Kartı
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Ham malzeme - stok kartı tanımlı değil">
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    variant="outlined"
                                    color="secondary"
                                    disabled
                                  >
                                    Ham Malzeme
                                  </Button>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell>
                              {detay.termin_tarihi
                                ? new Date(detay.termin_tarihi).toLocaleDateString('tr-TR')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Açıklama ve Notlar */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AciklamaIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Açıklama ve Notlar
                </Typography>
                {talep.aciklama && (
                  <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="body1">
                      {talep.aciklama}
                    </Typography>
                  </Paper>
                )}
                {talep.notlar && (
                  <Paper sx={{ p: 2, backgroundColor: '#fafafa' }}>
                    <Typography variant="body2" color="text.secondary">
                      Notlar:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {talep.notlar}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Zaman Çizelgesi */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Zaman Çizelgesi
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Onay Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(talep.onay_tarihi)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Tedarik Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(talep.tedarik_tarihi)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      İrsaliye Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(talep.irsaliye_tarihi)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Teslim Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {formatTarih(talep.teslim_tarihi)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* İrsaliye Bilgileri */}
                {talep.irsaliye_no && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">
                          <IrsaliyeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                          İrsaliye No
                        </Typography>
                        <Typography variant="body1">
                          {talep.irsaliye_no}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        {talep.durum === 'beklemede' || talep.durum === 'reddedildi' ? (
          <Button
            onClick={handleDuzenle}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Düzenle
          </Button>
        ) : null}
        <Button onClick={onClose} variant="outlined">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TedarikTalepDetay;