import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  IconButton,
  Chip,
  InputAdornment,
  ButtonGroup,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as OnayIcon,
  Cancel as RedIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Assignment as DokumanIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import FirmaSecimModal from './FirmaSecimModal.jsx';

const OnayModal = ({ open, onClose, onConfirm, talep, type = 'onayla' }) => {
  const [notlar, setNotlar] = useState('');
  const [loading, setLoading] = useState(false);
  const [secilenFirma, setSecilenFirma] = useState(null);
  const [siparisTarihi, setSiparisTarihi] = useState(new Date().toISOString().split('T')[0]);
  const [onayAdedi, setOnayAdedi] = useState(talep?.miktar || '');
  const [firmaSecimModalOpen, setFirmaSecimModalOpen] = useState(false);

  const isOnay = type === 'onayla';
  const isRed = type === 'reddet';

  useEffect(() => {
    // Modal açıldığında talebe bağlı firma varsa ayarla
    if (open && talep?.firma_id) {
      // Varsayılan olarak mevcut firmayı göstermek için
      // Bu bilgi API'den alınabilir
      setSecilenFirma({ id: talep.firma_id, firma_adi: talep.firma_adi || 'Seçili Firma' });
    }
  }, [open, talep]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const onayData = {
        notlar,
        firma_id: secilenFirma?.id || null,
        siparis_tarihi: isOnay ? siparisTarihi : null,
        onay_adedi: isOnay ? onayAdedi : null
      };
      await onConfirm(onayData);
    } finally {
      setLoading(false);
    }
  };

  const handleFirmaSec = (firma) => {
    setSecilenFirma(firma);
  };

  const handleClose = () => {
    setNotlar('');
    setSecilenFirma(null);
    setSiparisTarihi(new Date().toISOString().split('T')[0]);
    setOnayAdedi(talep?.miktar || '');
    onClose();
  };

  const getModalColor = () => {
    if (isOnay) return 'success';
    if (isRed) return 'error';
    return 'primary';
  };

  const getModalIcon = () => {
    if (isOnay) return <OnayIcon />;
    if (isRed) return <RedIcon />;
    return <WarningIcon />;
  };

  const getModalTitle = () => {
    if (isOnay) return 'Talebi Onayı';
    if (isRed) return 'Talebi Reddi';
    return 'İşlem Onayı';
  };

  const getModalDescription = () => {
    if (isOnay) {
      return `Bu tedarik talebini onaylamak istediğinizden emin misiniz? Onaylanan talep sipariş sürecine geçirilecektir.`;
    }
    if (isRed) {
      return `Bu tedarik talebini reddetmek istediğinizden emin misiniz? Reddedilen talep yeniden düzenlenebilir.`;
    }
    return `Bu işlemi gerçekleştirmek istediğinizden emin misiniz?`;
  };

  return (
    <>
      <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2,
                color: getModalColor() + '.main'
              }}
            >
              {getModalIcon()}
            </Box>
            <Typography variant="h6">
              {getModalTitle()}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Talep Bilgileri */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Talep Bilgileri
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={`Kod: ${talep?.talep_kodu || ''}`}
              size="small"
              color="default"
            />
            <Chip
              label={`Toplam: ${new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              }).format(talep?.toplam_tutar || 0)}`}
              size="small"
              color="primary"
            />
            <Chip
              label={`Durum: ${talep?.durum?.replace('_', ' ') || ''}`}
              size="small"
              color={talep?.durum === 'beklemedi' ? 'warning' : 'default'}
            />
          </Box>
        </Box>

        {/* Parça ve Malzeme Bilgileri */}
        {(talep?.parca_kodu || talep?.stok_karti_id || talep?.stokKarti) && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DokumanIcon sx={{ mr: 1 }} />
              Parça ve Malzeme Bilgileri
            </Typography>
            <Grid container spacing={2}>
              {/* Parça Kartı Bilgisi */}
              {talep?.parca_kodu && (
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
                      p: 1.5,
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

              {/* Stok Kartı Bilgisi */}
              {(talep?.stok_karti_id || talep?.stokKarti) && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Stok Kartı
                    </Typography>
                    <Tooltip title="Stok kartı detayını görüntüle">
                      <Button
                        size="small"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(`/stok-kartlari/${talep.stok_karti_id || talep.stokKarti?.id}`, '_blank')}
                        sx={{ ml: 2, minWidth: 'auto' }}
                      >
                        Stok Kartı
                      </Button>
                    </Tooltip>
                  </Box>
                  <Box
                    sx={{
                      cursor: 'pointer',
                      p: 1.5,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      backgroundColor: '#fafafa',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: 'primary.main'
                      }
                    }}
                    onClick={() => window.open(`/stok-kartlari/${talep.stok_karti_id || talep.stokKarti?.id}`, '_blank')}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main', mb: 0.5 }}>
                      {talep.stokKarti?.stok_kodu || talep.stokKarti?.kesit || `Stok Kartı #${talep.stok_karti_id}`}
                      {talep.stokKarti?.boy && ` x ${talep.stokKarti.boy}mm`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Malzeme Adı:</strong> {talep.stokKarti?.malzeme_adi || talep.stokKarti?.malzeme_cinsi || 'Belirtilmemiş'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Malzeme Cinsi:</strong> {talep.stokKarti?.malzeme_cinsi || 'Belirtilmemiş'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Stok:</strong> {talep.stokKarti?.adet || 0} {talep.stokKarti?.birim || 'adet'}
                      {talep.stokKarti?.kritik_stok_miktari && ` (Kritik: ${talep.stokKarti.kritik_stok_miktari})`}
                    </Typography>
                    {talep.stokKarti?.lokasyon && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Konum:</strong> {talep.stokKarti.lokasyon}
                      </Typography>
                    )}
                    {talep.stokKarti?.firma && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Tedarikçi:</strong> {talep.stokKarti.firma}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Uyarı Mesajı */}
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          icon={getModalIcon()}
        >
          <Typography variant="body2">
            {getModalDescription()}
          </Typography>
        </Alert>

        {/* Onay Form Alanları */}
        {isOnay && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {/* Firma Seçimi */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Sipariş Verilen Firma *
              </Typography>

              {/* Seçili Firma Kartı */}
              {secilenFirma ? (
                <Card sx={{ mb: 2, border: '1px solid', borderColor: 'primary.main' }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="h6">{secilenFirma.firma_adi}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {secilenFirma.firma_kodu}
                          </Typography>
                        </Box>
                      </Box>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => setFirmaSecimModalOpen(true)}
                          disabled={loading}
                        >
                          Değiştir
                        </Button>
                      </ButtonGroup>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<BusinessIcon />}
                  onClick={() => setFirmaSecimModalOpen(true)}
                  disabled={loading}
                  sx={{
                    py: 3,
                    borderStyle: 'dashed',
                    '&:hover': {
                      borderStyle: 'solid',
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  Firma Seçmek İçin Tıklayın
                </Button>
              )}
            </Box>

            {/* Sipariş Tarihi */}
            <TextField
              fullWidth
              type="date"
              label="Sipariş Tarihi"
              value={siparisTarihi}
              onChange={(e) => setSiparisTarihi(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Onay Adedi */}
            <TextField
              fullWidth
              type="number"
              label="Onaylanan Adet"
              value={onayAdedi}
              onChange={(e) => setOnayAdedi(e.target.value)}
              placeholder="Adet bilgisini giriniz..."
              InputProps={{
                endAdornment: <InputAdornment position="end">Adet</InputAdornment>,
                inputProps: { min: 1 }
              }}
            />
          </Box>
        )}

        {/* Notlar Alanı */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label={isRed ? 'Red Nedeni' : 'Onay Notları'}
          placeholder={isRed ? 'Reddetme sebebinizi belirtin...' : 'Onay notlarınızı yazabilirsiniz (opsiyonel)...'}
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getModalColor()}
          disabled={loading}
          startIcon={loading ? null : getModalIcon()}
        >
          {loading ? 'İşleniyor...' : (isOnay ? 'Onayla' : 'Reddet')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Firma Seçim Modal */}
    <FirmaSecimModal
      open={firmaSecimModalOpen}
      onClose={() => setFirmaSecimModalOpen(false)}
      onFirmaSec={handleFirmaSec}
      seciliFirmaId={secilenFirma?.id}
    />
    </>
  );
};

export default OnayModal;