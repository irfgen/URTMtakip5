import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Fab,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Palette as PaletteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';

import * as notlarService from '../../services/notlarService';

const KategoriYonetimi = ({ acik, onKapat, onKategoriDegisti, kategoriler = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [yeniKategori, setYeniKategori] = useState({ kategori_adi: '', renk_kodu: '#2196F3' });
  const [editData, setEditData] = useState({});
  const [colorPickerAcik, setColorPickerAcik] = useState(null);
  const [yeniKategoriFormAcik, setYeniKategoriFormAcik] = useState(false);
  const [localKategoriler, setLocalKategoriler] = useState([]);

  // Dialog açıldığında kategorileri yükle
  useEffect(() => {
    if (acik) {
      loadKategoriler();
    }
  }, [acik]);

  // Props'tan gelen kategorileri local state'e aktar
  useEffect(() => {
    setLocalKategoriler(kategoriler);
  }, [kategoriler]);

  // Kategorileri yükle
  const loadKategoriler = async () => {
    try {
      setLoading(true);
      const response = await notlarService.getKategoriler({ not_sayilari: 'true' });
      if (response.success) {
        setLocalKategoriler(response.data);
      }
    } catch (error) {
      console.error('Kategoriler yükleme hatası:', error);
      setError('Kategoriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Yeni kategori ekleme
  const handleYeniKategoriEkle = async () => {
    if (!yeniKategori.kategori_adi.trim()) {
      setError('Kategori adı boş olamaz');
      return;
    }

    try {
      setLoading(true);
      const response = await notlarService.createKategori(yeniKategori);
      
      if (response.success) {
        setSuccess('Kategori başarıyla eklendi');
        setYeniKategori({ kategori_adi: '', renk_kodu: '#2196F3' });
        setYeniKategoriFormAcik(false);
        await loadKategoriler();
        
        // Parent component'i bilgilendir
        if (onKategoriDegisti) {
          onKategoriDegisti();
        }
      }
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
      setError(error.message || 'Kategori eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kategori düzenlemeye başla
  const handleEditBasla = (kategori) => {
    setEditingId(kategori.id);
    setEditData({
      kategori_adi: kategori.kategori_adi,
      renk_kodu: kategori.renk_kodu
    });
  };

  // Kategori düzenlemeyi iptal et
  const handleEditIptal = () => {
    setEditingId(null);
    setEditData({});
    setColorPickerAcik(null);
  };

  // Kategori güncelle
  const handleKategoriGuncelle = async (id) => {
    if (!editData.kategori_adi?.trim()) {
      setError('Kategori adı boş olamaz');
      return;
    }

    try {
      setLoading(true);
      const response = await notlarService.updateKategori(id, editData);
      
      if (response.success) {
        setSuccess('Kategori başarıyla güncellendi');
        setEditingId(null);
        setEditData({});
        setColorPickerAcik(null);
        await loadKategoriler();
        
        // Parent component'i bilgilendir
        if (onKategoriDegisti) {
          onKategoriDegisti();
        }
      }
    } catch (error) {
      console.error('Kategori güncelleme hatası:', error);
      setError(error.message || 'Kategori güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kategori sil
  const handleKategoriSil = async (kategori) => {
    const mesaj = kategori.not_sayisi > 0 
      ? `"${kategori.kategori_adi}" kategorisinde ${kategori.not_sayisi} adet not bulunuyor. Kategori silinirse bu notlar kategorisiz hale gelecek. Devam etmek istediğinizden emin misiniz?`
      : `"${kategori.kategori_adi}" kategorisini silmek istediğinizden emin misiniz?`;

    if (!window.confirm(mesaj)) {
      return;
    }

    try {
      setLoading(true);
      const response = await notlarService.deleteKategori(kategori.id);
      
      if (response.success) {
        setSuccess('Kategori başarıyla silindi');
        await loadKategoriler();
        
        // Parent component'i bilgilendir
        if (onKategoriDegisti) {
          onKategoriDegisti();
        }
      }
    } catch (error) {
      console.error('Kategori silme hatası:', error);
      setError(error.message || 'Kategori silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Renk değiştirme
  const handleRenkDegistir = (renk) => {
    if (editingId) {
      setEditData({ ...editData, renk_kodu: renk });
    } else {
      setYeniKategori({ ...yeniKategori, renk_kodu: renk });
    }
  };

  // Dialog kapatma
  const handleKapat = () => {
    setEditingId(null);
    setEditData({});
    setColorPickerAcik(null);
    setYeniKategoriFormAcik(false);
    setError(null);
    setSuccess(null);
    onKapat();
  };

  return (
    <Dialog
      open={acik}
      onClose={handleKapat}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '60vh'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h6" component="span">
          Kategori Yönetimi
        </Typography>
        <IconButton onClick={handleKapat} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: isMobile ? 2 : 3, py: 2 }}>
        {/* Error & Success Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Yeni Kategori Ekleme Formu */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Yeni Kategori Ekle
            </Typography>
            <IconButton
              size="small"
              onClick={() => setYeniKategoriFormAcik(!yeniKategoriFormAcik)}
            >
              {yeniKategoriFormAcik ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={yeniKategoriFormAcik}>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Kategori Adı"
                value={yeniKategori.kategori_adi}
                onChange={(e) => setYeniKategori({ ...yeniKategori, kategori_adi: e.target.value })}
                sx={{ mb: 2 }}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleYeniKategoriEkle();
                  }
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2">Renk:</Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: yeniKategori.renk_kodu,
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setColorPickerAcik('yeni')}
                />
                <Typography variant="body2" color="text.secondary">
                  {yeniKategori.renk_kodu}
                </Typography>
              </Box>

              {colorPickerAcik === 'yeni' && (
                <Box sx={{ mb: 2 }}>
                  <HexColorPicker
                    color={yeniKategori.renk_kodu}
                    onChange={handleRenkDegistir}
                  />
                  <Button
                    size="small"
                    onClick={() => setColorPickerAcik(null)}
                    sx={{ mt: 1 }}
                  >
                    Kapat
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleYeniKategoriEkle}
                  disabled={loading || !yeniKategori.kategori_adi.trim()}
                  startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                >
                  Ekle
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setYeniKategori({ kategori_adi: '', renk_kodu: '#2196F3' });
                    setYeniKategoriFormAcik(false);
                  }}
                  disabled={loading}
                >
                  İptal
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Paper>

        {/* Mevcut Kategoriler Listesi */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Mevcut Kategoriler ({localKategoriler.length})
        </Typography>

        {loading && localKategoriler.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : localKategoriler.length === 0 ? (
          <Alert severity="info">
            Henüz kategori bulunmuyor. İlk kategoriyi ekleyin.
          </Alert>
        ) : (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            {localKategoriler.map((kategori, index) => (
              <React.Fragment key={kategori.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {editingId === kategori.id ? (
                    // Düzenleme modu
                    <Box sx={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        value={editData.kategori_adi}
                        onChange={(e) => setEditData({ ...editData, kategori_adi: e.target.value })}
                        size="small"
                        sx={{ mb: 2 }}
                        disabled={loading}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="body2">Renk:</Typography>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: editData.renk_kodu,
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setColorPickerAcik(editingId)}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {editData.renk_kodu}
                        </Typography>
                      </Box>

                      {colorPickerAcik === editingId && (
                        <Box sx={{ mb: 2 }}>
                          <HexColorPicker
                            color={editData.renk_kodu}
                            onChange={handleRenkDegistir}
                          />
                          <Button
                            size="small"
                            onClick={() => setColorPickerAcik(null)}
                            sx={{ mt: 1 }}
                          >
                            Kapat
                          </Button>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleKategoriGuncelle(kategori.id)}
                          disabled={loading}
                          startIcon={<SaveIcon />}
                        >
                          Kaydet
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleEditIptal}
                          disabled={loading}
                          startIcon={<CancelIcon />}
                        >
                          İptal
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    // Normal görünüm
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: kategori.renk_kodu,
                            mr: 2,
                            flexShrink: 0
                          }}
                        />
                        <ListItemText
                          primary={kategori.kategori_adi}
                          secondary={`${notlarService.formatTarih(kategori.olusturma_tarihi, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}`}
                        />
                        {kategori.not_sayisi !== undefined && (
                          <Chip
                            label={`${kategori.not_sayisi} not`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                        )}
                      </Box>
                      
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="düzenle"
                          onClick={() => handleEditBasla(kategori)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="sil"
                          onClick={() => handleKategoriSil(kategori)}
                          disabled={loading}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
                {index < localKategoriler.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, py: 2 }}>
        <Button onClick={handleKapat} disabled={loading}>
          Kapat
        </Button>
      </DialogActions>

      {/* Floating Action Button - Yeni Kategori */}
      {!yeniKategoriFormAcik && (
        <Fab
          color="primary"
          size="medium"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16
          }}
          onClick={() => setYeniKategoriFormAcik(true)}
        >
          <AddIcon />
        </Fab>
      )}
    </Dialog>
  );
};

export default KategoriYonetimi;
