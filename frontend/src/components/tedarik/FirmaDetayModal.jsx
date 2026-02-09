import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AccountBalance as AccountBalanceIcon,
  Language as LanguageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import tedarikService from '../../services/tedarikService.js';

const FirmaDetayModal = ({ open, onClose, firma, onEdit }) => {
  const [firmaDetay, setFirmaDetay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && firma) {
      loadFirmaDetay();
    }
  }, [open, firma]);

  const loadFirmaDetay = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await tedarikService.getFirma(firma.id);
      setFirmaDetay(response.data);
    } catch (error) {
      console.error('Firma detayı yüklenirken hata:', error);
      setError(error.message || 'Firma detayı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFirmaDetay(null);
    setError('');
    onClose();
  };

  const formatTelefon = (telefon) => {
    if (!telefon) return '';
    const cleaned = telefon.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return telefon;
  };

  const formatIBAN = (iban) => {
    if (!iban) return '';
    const cleaned = iban.replace(/\s/g, '');
    if (cleaned.length === 26 && cleaned.startsWith('TR')) {
      return cleaned.replace(/(.{4})(?!$)/g, '$1 ');
    }
    return iban;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Firma Detayları</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>Yükleniyor...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Firma Detayları</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Kapat</Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!firmaDetay) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">{firmaDetay.firma_adi}</Typography>
              <Typography variant="body2" color="textSecondary">
                Kod: {firmaDetay.firma_kodu}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              Düzenle
            </Button>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Durum Bilgisi */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="subtitle1">Durum:</Typography>
              <Chip
                label={firmaDetay.durum.toUpperCase()}
                color={firmaDetay.durum === 'aktif' ? 'success' : 'default'}
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                Oluşturulma: {new Date(firmaDetay.created_at).toLocaleDateString('tr-TR')}
              </Typography>
            </Box>
          </Grid>

          {/* Firma Bilgileri */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Firma Bilgileri
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Vergi Dairesi
                    </Typography>
                    <Typography variant="body1">
                      {firmaDetay.vergi_dairesi || '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Vergi Numarası
                    </Typography>
                    <Typography variant="body1">
                      {firmaDetay.vergi_no || '-'}
                    </Typography>
                  </Box>
                  {firmaDetay.adres && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                        Adres
                      </Typography>
                      <Typography variant="body1">
                        {firmaDetay.adres}
                      </Typography>
                    </Box>
                  )}
                  {firmaDetay.web_sitesi && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <LanguageIcon fontSize="small" sx={{ mr: 1 }} />
                        Web Sitesi
                      </Typography>
                      <Tooltip title={firmaDetay.web_sitesi}>
                        <Typography
                          variant="body1"
                          component="a"
                          href={firmaDetay.web_sitesi}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {firmaDetay.web_sitesi}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                  {firmaDetay.aciklama && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Açıklama
                      </Typography>
                      <Typography variant="body1">
                        {firmaDetay.aciklama}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* İletişim Bilgileri */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  İletişim Bilgileri
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {firmaDetay.telefon && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                        Telefon
                      </Typography>
                      <Typography variant="body1">
                        {formatTelefon(firmaDetay.telefon)}
                      </Typography>
                    </Box>
                  )}
                  {firmaDetay.email && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                        E-posta
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {firmaDetay.email}
                      </Typography>
                    </Box>
                  )}
                  {firmaDetay.iban && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <AccountBalanceIcon fontSize="small" sx={{ mr: 1 }} />
                        IBAN
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {formatIBAN(firmaDetay.iban)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Yetkili Bilgileri */}
          {(firmaDetay.yetkili_kisi || firmaDetay.yetkili_telefon || firmaDetay.yetkili_email) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Yetkili Bilgileri
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      {firmaDetay.yetkili_kisi && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Yetkili Kişi
                          </Typography>
                          <Typography variant="body1">
                            {firmaDetay.yetkili_kisi}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      {firmaDetay.yetkili_telefon && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Yetkili Telefon
                          </Typography>
                          <Typography variant="body1">
                            {formatTelefon(firmaDetay.yetkili_telefon)}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      {firmaDetay.yetkili_email && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Yetkili E-posta
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                            {firmaDetay.yetkili_email}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* İlişkili Tedarik Talepleri */}
          {firmaDetay.tedarikTalepleri && firmaDetay.tedarikTalepleri.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    İlişkili Tedarik Talepleri ({firmaDetay.tedarikTalepleri.length})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Talep Kodu</TableCell>
                          <TableCell>Tutar</TableCell>
                          <TableCell>Durum</TableCell>
                          <TableCell>Tarih</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {firmaDetay.tedarikTalepleri.map((talep) => (
                          <TableRow key={talep.id} hover>
                            <TableCell>{talep.talep_kodu}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                              }).format(talep.toplam_tutar)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={talep.durum?.replace('_', ' ') || talep.durum}
                                size="small"
                                color={
                                  talep.durum === 'tamamlandi' ? 'success' :
                                  talep.durum === 'sipariste' ? 'warning' :
                                  talep.durum === 'reddedildi' ? 'error' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(talep.created_at).toLocaleDateString('tr-TR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Kapat</Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={onEdit}
        >
          Düzenle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FirmaDetayModal;