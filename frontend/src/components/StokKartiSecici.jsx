import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  InputAdornment,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const StokKartiSecici = ({ 
  open, 
  onClose, 
  onSelect, 
  currentParca = null,
  aramaMetni = ''
}) => {
  const [stokKartlari, setStokKartlari] = useState([]);
  const [arama, setArama] = useState(aramaMetni);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [yeniStokKarti, setYeniStokKarti] = useState({
    kesit: '',
    boy: '',
    malzeme_cinsi: '',
    malzeme_adi: '',
    adet: 0,
    kritik_stok_miktari: 0,
    lokasyon: '',
    firma: '',
    aktif_mi: true
  });
  const [yeniStokKartiModu, setYeniStokKartiModu] = useState(false);
  const [akıllıArama, setAkıllıArama] = useState([]);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  const stokKartlariAra = useCallback(async (aramaTermi = '') => {
    try {
      setYukleniyor(true);
      
      // Normal arama
      const params = new URLSearchParams();
      if (aramaTermi) params.append('aramaMetni', aramaTermi);
      params.append('limit', '20');
      
      const response = await axios.get(`/api/stok-karti?${params}`);
      setStokKartlari(response.data.stokKartlari || []);

      // Akıllı arama (sadece arama metni varsa)
      if (aramaTermi && aramaTermi.length > 2) {
        try {
          const akıllıResponse = await axios.get(`/api/stok-karti/ara/ham-malzeme-olcu?olcu=${encodeURIComponent(aramaTermi)}`);
          setAkıllıArama(akıllıResponse.data.stokKartlari || []);
        } catch (akıllıError) {
          console.log('Akıllı arama hatası:', akıllıError);
          setAkıllıArama([]);
        }
      } else {
        setAkıllıArama([]);
      }
    } catch (error) {
      console.error('Stok kartları arama hatası:', error);
      setStokKartlari([]);
      setAkıllıArama([]);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (open) {
      stokKartlariAra(arama);
    }
  }, [open, stokKartlariAra]);

  // Debounced search on input change
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      stokKartlariAra(arama);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [arama, stokKartlariAra]);

  const handleStokKartiSec = (stokKarti) => {
    onSelect(stokKarti);
    onClose();
  };

  const handleYeniStokKartiOlustur = async () => {
    try {
      setYukleniyor(true);
      
      // Ham malzeme ölçüsünden kesit bilgisini parse et
      if (arama && !yeniStokKarti.kesit) {
        setYeniStokKarti(prev => ({ ...prev, kesit: arama }));
      }

      const response = await axios.post('/api/stok-karti', yeniStokKarti);
      const yeniStok = response.data;
      
      // Yeni stok kartını seç
      handleStokKartiSec(yeniStok);
      
    } catch (error) {
      console.error('Yeni stok kartı oluşturma hatası:', error);
      alert('Stok kartı oluşturulurken hata oluştu!');
    } finally {
      setYukleniyor(false);
    }
  };

  const getMatchTypeColor = (matchType) => {
    switch (matchType) {
      case 'exact': return 'success';
      case 'reverse': return 'warning';
      case 'diameter': return 'info';
      case 'partial': return 'default';
      default: return 'default';
    }
  };

  const getMatchTypeLabel = (matchType) => {
    switch (matchType) {
      case 'exact': return 'Tam Eşleşme';
      case 'reverse': return 'Ters Ölçü';
      case 'diameter': return 'Çap';
      case 'partial': return 'Kısmi';
      default: return '';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Stok Kartı Seç
            {currentParca && (
              <Typography variant="subtitle2" color="text.secondary">
                {currentParca.parcaKodu} - {currentParca.parcaAdi}
              </Typography>
            )}
          </Typography>
          <Box>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={() => setYeniStokKartiModu(!yeniStokKartiModu)}
              sx={{ mr: 1 }}
            >
              Yeni Oluştur
            </Button>
            <Button onClick={onClose} size="small">
              <CloseIcon />
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Stok Kartı Ara (ölçü, malzeme cinsi, vs.)"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Örn: 50x30, Çap25, ST37..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: yukleniyor && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Yeni Stok Kartı Oluşturma Formu */}
        {yeniStokKartiModu && (
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Yeni Stok Kartı Oluştur
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Kesit"
                    value={yeniStokKarti.kesit}
                    onChange={(e) => setYeniStokKarti(prev => ({ ...prev, kesit: e.target.value }))}
                    placeholder="50x30, Çap25, vs."
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Boy (mm)"
                    type="number"
                    value={yeniStokKarti.boy}
                    onChange={(e) => setYeniStokKarti(prev => ({ ...prev, boy: parseFloat(e.target.value) || '' }))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Malzeme Cinsi"
                    value={yeniStokKarti.malzeme_cinsi}
                    onChange={(e) => setYeniStokKarti(prev => ({ ...prev, malzeme_cinsi: e.target.value }))}
                    placeholder="ST37, SICAK CEKME, vs."
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stok Adedi"
                    type="number"
                    value={yeniStokKarti.adet}
                    onChange={(e) => setYeniStokKarti(prev => ({ ...prev, adet: parseInt(e.target.value) || 0 }))}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleYeniStokKartiOlustur}
                  disabled={!yeniStokKarti.kesit || !yeniStokKarti.malzeme_cinsi || yukleniyor}
                  size="small"
                >
                  Oluştur ve Seç
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setYeniStokKartiModu(false)}
                  size="small"
                >
                  İptal
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Akıllı Arama Sonuçları */}
        {akıllıArama.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
              🎯 Akıllı Arama Sonuçları
            </Typography>
            <List dense>
              {akıllıArama.slice(0, 5).map((stokKarti) => (
                <ListItem key={`smart-${stokKarti.id}`} disablePadding>
                  <ListItemButton onClick={() => handleStokKartiSec(stokKarti)}>
                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                            {stokKarti.olculeriFormatted}
                          </Typography>
                          <Chip 
                            label={getMatchTypeLabel(stokKarti.matchType)} 
                            size="small" 
                            color={getMatchTypeColor(stokKarti.matchType)}
                          />
                        </span>
                      }
                      secondary={
                        <Typography variant="caption" component="span" display="block">
                          {stokKarti.malzeme_cinsi} - Stok: {stokKarti.adet} adet
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Normal Arama Sonuçları */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Tüm Stok Kartları ({stokKartlari.length})
          </Typography>
          {stokKartlari.length === 0 && !yukleniyor ? (
            <Alert severity="info">
              Stok kartı bulunamadı. Yeni bir stok kartı oluşturabilirsiniz.
            </Alert>
          ) : (
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {stokKartlari.map((stokKarti) => (
                <ListItem key={stokKarti.id} disablePadding>
                  <ListItemButton onClick={() => handleStokKartiSec(stokKarti)}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                          {stokKarti.olculeriFormatted}
                        </Typography>
                      }
                      secondary={
                        <span>
                          <Typography variant="caption" component="span" display="block">
                            {stokKarti.malzeme_cinsi}
                            {stokKarti.malzeme_adi && ` - ${stokKarti.malzeme_adi}`}
                          </Typography>
                          <Typography variant="caption" component="span" display="block" color="text.secondary">
                            Stok: {stokKarti.adet} adet
                            {stokKarti.kritik_stok_miktari > 0 && ` | Kritik: ${stokKarti.kritik_stok_miktari}`}
                            {stokKarti.lokasyon && ` | ${stokKarti.lokasyon}`}
                          </Typography>
                        </span>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          İptal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StokKartiSecici;
