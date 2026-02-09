import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

const MobilStokKartiSecici = ({ open, onClose, onSelect, aramaMetni = '', currentParca = null }) => {
  const [searchQuery, setSearchQuery] = useState(aramaMetni);
  const [stokKartlari, setStokKartlari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [akilliBulunanlar, setAkilliBulunanlar] = useState([]);

  // Stok kartlarını ara
  const stokKartlariAra = async (query = '') => {
    try {
      setLoading(true);
      setError('');
      
      let url = '/api/stok-karti';
      if (query.trim()) {
        // Akıllı arama kullan
        url = `/api/stok-karti/ara/ham-malzeme-olcu?olcu=${encodeURIComponent(query)}`;
      }
      
      const response = await axios.get(url, {
        params: query.trim() ? {} : { limit: 20 }
      });
      
      if (query.trim() && response.data.akilliBulunanlar) {
        setAkilliBulunanlar(response.data.akilliBulunanlar);
        setStokKartlari(response.data.stokKartlari || []);
      } else {
        setStokKartlari(response.data);
        setAkilliBulunanlar([]);
      }
    } catch (err) {
      console.error('Stok kartı arama hatası:', err);
      setError('Stok kartları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda ve arama metni değiştiğinde ara
  useEffect(() => {
    if (open) {
      stokKartlariAra(searchQuery);
    }
  }, [open]);

  // Arama debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== aramaMetni) {
        stokKartlariAra(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (stokKarti) => {
    onSelect(stokKarti);
    onClose();
  };

  const formatOlculer = (stokKarti) => {
    if (stokKarti.olculeriFormatted) {
      return stokKarti.olculeriFormatted;
    }
    
    let formatted = stokKarti.kesit || '';
    if (stokKarti.boy) {
      formatted += ` x ${stokKarti.boy}mm`;
    }
    return formatted;
  };

  const getMatchTypeText = (matchType) => {
    const types = {
      exact: 'Tam Eşleşme',
      partial: 'Kısmi Eşleşme', 
      similar: 'Benzer',
      contains: 'İçeriyor'
    };
    return types[matchType] || matchType;
  };

  const getMatchTypeColor = (matchType) => {
    const colors = {
      exact: 'success',
      partial: 'primary',
      similar: 'secondary',
      contains: 'default'
    };
    return colors[matchType] || 'default';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen
      PaperProps={{
        sx: { height: '100%' }
      }}
    >
      {/* Mobile AppBar */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Stok Kartı Seç
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Arama Kutusu */}
        <TextField
          fullWidth
          placeholder="Ham malzeme ölçüsü ara (örn: 100x25, Ø20, 30x30x5)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
          size="small"
        />

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Akıllı Bulunanlar */}
        {akilliBulunanlar.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Akıllı Arama Sonuçları
            </Typography>
            <List sx={{ p: 0 }}>
              {akilliBulunanlar.map((item) => (
                <ListItem key={item.stokKarti.id} sx={{ p: 0 }}>
                  <ListItemButton 
                    onClick={() => handleSelect(item.stokKarti)}
                    sx={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: 1, 
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                      <Chip 
                        label={getMatchTypeText(item.matchType)}
                        color={getMatchTypeColor(item.matchType)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {formatOlculer(item.stokKarti)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {item.stokKarti.malzeme_cinsi}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Stok: {item.stokKarti.adet} adet
                      </Typography>
                      {item.stokKarti.kritik_stok_miktari > 0 && (
                        <Typography variant="caption" color="warning.main">
                          Kritik: {item.stokKarti.kritik_stok_miktari}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Tüm Stok Kartları */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {stokKartlari.length > 0 ? (
            <>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {akilliBulunanlar.length > 0 ? 'Diğer Stok Kartları' : 'Stok Kartları'} ({stokKartlari.length})
              </Typography>
              <List sx={{ p: 0 }}>
                {stokKartlari.map((stokKarti) => (
                  <ListItem key={stokKarti.id} sx={{ p: 0 }}>
                    <ListItemButton 
                      onClick={() => handleSelect(stokKarti)}
                      sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1, 
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {formatOlculer(stokKarti)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {stokKarti.malzeme_cinsi}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="caption" color="text.secondary">
                          Stok: {stokKarti.adet} adet
                        </Typography>
                        {stokKarti.kritik_stok_miktari > 0 && (
                          <Typography variant="caption" color="warning.main">
                            Kritik: {stokKarti.kritik_stok_miktari}
                          </Typography>
                        )}
                      </Box>
                      
                      {stokKarti.lokasyon && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {stokKarti.lokasyon}
                        </Typography>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          ) : !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {searchQuery ? 'Aradığınız kriterlere uygun stok kartı bulunamadı' : 'Stok kartı bulunamadı'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Farklı arama terimleri deneyebilirsiniz
              </Typography>
            </Box>
          )}
        </Box>

        {/* Yeni Stok Kartı Bilgisi */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <InfoIcon sx={{ fontSize: 16, mr: 1, color: 'info.main' }} />
            <Typography variant="caption" color="text.secondary">
              Aradığınız stok kartını bulamadınız mı?
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Web versiyonunu kullanarak yeni stok kartı oluşturabilirsiniz.
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
};

export default MobilStokKartiSecici;
