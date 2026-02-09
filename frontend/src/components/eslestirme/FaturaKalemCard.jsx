import { Card, CardContent, Box, Typography, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import IrsaliyeKalemMatchCard from './IrsaliyeKalemMatchCard';
import OneriListesi from './OneriListesi';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const FaturaKalemCard = ({
  kalem,
  eslesenIrsaliye,
  oneriler = [],
  onSelectMatch,
  seciliOneriler = [],
  onSecimDegistir
}) => {
  const [kaldirDialogOpen, setKaldirDialogOpen] = useState(false);
  const [nedenInput, setNedenInput] = useState('');

  const getDurumColor = (durum) => {
    return durum === 1 ? 'success' : 'default';
  };

  const getDurumLabel = (durum) => {
    return durum === 1 ? 'Eşleşti' : 'Bekliyor';
  };

  const formatCurrency = (value) => {
    if (value == null) return '-';
    return parseFloat(value).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ₺';
  };

  const formatNumber = (value) => {
    if (value == null) return '-';
    return parseFloat(value).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleKaldirDialogOpen = () => {
    setKaldirDialogOpen(true);
  };

  const handleKaldirDialogClose = () => {
    setKaldirDialogOpen(false);
    setNedenInput('');
  };

  const handleKaldirOnay = () => {
    if (onSelectMatch) {
      onSelectMatch(kalem.id, nedenInput);
    }
    handleKaldirDialogClose();
  };

  // Eşleşen irsaliye için detaylı kart göster
  const renderEslesenIrsaliye = () => {
    if (!eslesenIrsaliye) return null;

    // Eşleşen irsaliye için gerekli bilgileri topla
    const combinedIrsaliye = {
      ...(eslesenIrsaliye.irsaliye || {}),
      irsaliye_no: eslesenIrsaliye.irsaliye?.irsaliye_no || '-'
    };

    const combinedIrsaliyeKalem = {
      id: eslesenIrsaliye.id,
      stok_kodu: eslesenIrsaliye.stok_kodu,
      mal_hizmet_adi: eslesenIrsaliye.mal_hizmet_adi,
      miktar: eslesenIrsaliye.miktar,
      birim: eslesenIrsaliye.birim
    };

    return (
      <IrsaliyeKalemMatchCard
        irsaliyeKalem={combinedIrsaliyeKalem}
        irsaliye={combinedIrsaliye}
        eslesmeTipi="tam"
        miktarFarki={0}
        skor={100}
        stokKoduEslesiyor={kalem.stok_kodu === eslesenIrsaliye.stok_kodu}
        onRemove={handleKaldirDialogOpen}
      />
    );
  };

  return (
    <StyledCard>
      <CardContent>
        {/* Fatura Kalem Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div">
              {kalem.stok_kodu || '-'} - {kalem.mal_hizmet_adi || '-'}
            </Typography>
          </Box>
          <Chip label={getDurumLabel(kalem.eslesme_durumu)} color={getDurumColor(kalem.eslesme_durumu)} size="small" />
        </Box>

        {/* Fatura Kalem Detayları */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Stok Kodu</Typography>
            <Typography variant="body2" fontWeight="medium">{kalem.stok_kodu || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Mal/Hizmet Adı</Typography>
            <Typography variant="body2">{kalem.mal_hizmet_adi || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Miktar</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatNumber(kalem.miktar)} {kalem.birim || 'Adet'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Birim Fiyat</Typography>
            <Typography variant="body2">{formatCurrency(kalem.birim_fiyat)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Toplam Tutar</Typography>
            <Typography variant="body2" fontWeight="medium" color="primary.main">
              {formatCurrency(kalem.toplam_tutar)}
            </Typography>
          </Box>
        </Stack>

        {/* Eşleşen İrsaliye veya Öneriler */}
        {eslesenIrsaliye ? (
          <Box>
            <Typography variant="subtitle2" color="success.main" sx={{ mt: 1, mb: 1, fontWeight: 'medium' }}>
              ✓ Eşleşen İrsaliye
            </Typography>
            {renderEslesenIrsaliye()}
          </Box>
        ) : oneriler && oneriler.length > 0 ? (
          <OneriListesi
            faturaKalemId={kalem.id}
            oneriler={oneriler}
            seciliOneriler={seciliOneriler}
            onSecimDegistir={onSecimDegistir}
          />
        ) : (
          <Box sx={{
            mt: 2,
            p: 2,
            border: '1px dashed',
            borderColor: 'text.disabled',
            borderRadius: 1,
            bgcolor: 'action.hover'
          }}>
            <Typography variant="body2" color="text.secondary" align="center">
              ⚠️ Bu kalem için eşleşen irsaliye bulunmuyor
            </Typography>
          </Box>
        )}

        {/* Eşleşme Kaldır Dialog */}
        <Dialog open={kaldirDialogOpen} onClose={handleKaldirDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Eşleşmeyi Kaldır</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              <strong>{kalem.stok_kodu}</strong> için eşleşmeyi kaldırmak istediğinizden emin misiniz?
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Neden (opsiyonel)"
              value={nedenInput}
              onChange={(e) => setNedenInput(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleKaldirDialogClose}>İptal</Button>
            <Button onClick={handleKaldirOnay} color="error" variant="contained">
              Kaldır
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </StyledCard>
  );
};

export default FaturaKalemCard;
