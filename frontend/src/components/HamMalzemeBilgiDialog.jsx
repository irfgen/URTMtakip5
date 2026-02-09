import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';

const HamMalzemeBilgiDialog = ({ open, onClose, fasonIsEmri }) => {
  if (!fasonIsEmri) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Belirtilmedi';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Ham Malzeme Bilgileri
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Typography variant="h6" gutterBottom>
            {fasonIsEmri.parca?.parcaAdi || 'Bilinmiyor'} ({fasonIsEmri.parca_kodu})
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Fason Adet: {fasonIsEmri.fason_adet}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ham Malzeme Durumu
            </Typography>
            <Chip
              label={
                fasonIsEmri.ham_malzeme_durumu === 'gonderildi' ? 'Gönderildi' :
                fasonIsEmri.ham_malzeme_durumu === 'teslim_edildi' ? 'Teslim Edildi' :
                'Gönderilmedi'
              }
              color={
                fasonIsEmri.ham_malzeme_durumu === 'gonderildi' ? 'primary' :
                fasonIsEmri.ham_malzeme_durumu === 'teslim_edildi' ? 'success' :
                'default'
              }
              size="small"
            />
          </Box>

          {fasonIsEmri.ham_malzeme_gonderim_tarihi && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Gönderim Bilgileri
              </Typography>
              <Typography variant="body2">
                <strong>Tarih:</strong> {formatDateTime(fasonIsEmri.ham_malzeme_gonderim_tarihi)}
              </Typography>
              {fasonIsEmri.ham_malzeme_miktari && (
                <Typography variant="body2">
                  <strong>Miktar:</strong> {fasonIsEmri.ham_malzeme_miktari}
                </Typography>
              )}
              {fasonIsEmri.gonderim_irsaliye_no && (
                <Typography variant="body2">
                  <strong>İrsaliye No:</strong> {fasonIsEmri.gonderim_irsaliye_no}
                </Typography>
              )}
              {fasonIsEmri.gonderen_kisi && (
                <Typography variant="body2">
                  <strong>Gönderen:</strong> {fasonIsEmri.gonderen_kisi}
                </Typography>
              )}
            </Box>
          )}

          {fasonIsEmri.ham_malzeme_teslim_tarihi && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Teslim Bilgileri
              </Typography>
              <Typography variant="body2">
                <strong>Teslim Tarihi:</strong> {formatDateTime(fasonIsEmri.ham_malzeme_teslim_tarihi)}
              </Typography>
              {fasonIsEmri.ham_malzeme_teslim_sorumlusu && (
                <Typography variant="body2">
                  <strong>Teslim Sorumlusu:</strong> {fasonIsEmri.ham_malzeme_teslim_sorumlusu}
                </Typography>
              )}
            </Box>
          )}

          {fasonIsEmri.ham_malzeme_notlar && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Notlar
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {fasonIsEmri.ham_malzeme_notlar}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HamMalzemeBilgiDialog;
