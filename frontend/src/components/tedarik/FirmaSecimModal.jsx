import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  InputAdornment,
  ButtonGroup,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import FirmaEkleModal from './FirmaEkleModal.jsx';

const FirmaSecimModal = ({ open, onClose, onFirmaSec, seciliFirmaId }) => {
  const [firmalar, setFirmalar] = useState([]);
  const [filteredFirmalar, setFilteredFirmalar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [secilenFirma, setSecilenFirma] = useState(null);
  const [firmaEkleModalOpen, setFirmaEkleModalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadFirmalar();
    }
  }, [open]);

  useEffect(() => {
    // Filtreleme
    if (searchTerm) {
      const filtered = firmalar.filter(firma =>
        firma.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firma.firma_kodu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (firma.yetkili_kisi && firma.yetkili_kisi.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (firma.vergi_no && firma.vergi_no.includes(searchTerm))
      );
      setFilteredFirmalar(filtered);
    } else {
      setFilteredFirmalar(firmalar);
    }
  }, [searchTerm, firmalar]);

  useEffect(() => {
    // Önce seçili firmayı ayarla
    if (seciliFirmaId && firmalar.length > 0) {
      const secili = firmalar.find(f => f.id === seciliFirmaId);
      setSecilenFirma(secili || null);
    }
  }, [seciliFirmaId, firmalar]);

  const loadFirmalar = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.get(`${API_BASE_URL}/firmalar?durum=aktif&limit=1000`);
      setFirmalar(response.data.data || response.data);
    } catch (error) {
      console.error('Firmalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFirmaSec = (firma) => {
    setSecilenFirma(firma);
  };

  const handleOnayla = () => {
    if (secilenFirma) {
      onFirmaSec(secilenFirma);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSecilenFirma(null);
    onClose();
  };

  const handleFirmaEkleSuccess = (yeniFirma) => {
    const firmaData = yeniFirma?.data || yeniFirma;
    if (firmaData && firmaData.id) {
      setFirmalar(prev => [...prev, firmaData]);
      setSecilenFirma(firmaData);
      setFirmaEkleModalOpen(false);
    }
  };

  const getFirmaAvatar = (firma) => {
    return firma.firma_adi.charAt(0).toUpperCase();
  };

  const getFirmaColor = (tip) => {
    return tip === 'ic' ? 'success' : 'primary';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: '800px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6">
                Firma Seçimi
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          {/* Arama ve Firma Ekle */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Firma ara... (Ad, kod, yetkili, vergi no)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setFirmaEkleModalOpen(true)}
              sx={{ minWidth: '140px' }}
            >
              Yeni Firma
            </Button>
          </Box>

          {/* Firma Listesi */}
          <Box sx={{ height: 'calc(80vh - 200px)', overflow: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography>Yükleniyor...</Typography>
              </Box>
            ) : filteredFirmalar.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography color="textSecondary">
                  {searchTerm ? 'Arama kriterine uygun firma bulunamadı' : 'Kayıtlı firma bulunamadı'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredFirmalar.map((firma) => (
                  <Grid item xs={12} md={6} lg={4} key={firma.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: secilenFirma?.id === firma.id ? 2 : 1,
                        borderColor: secilenFirma?.id === firma.id ? 'primary.main' : 'grey.300',
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                      onClick={() => handleFirmaSec(firma)}
                    >
                      {secilenFirma?.id === firma.id && (
                        <CheckCircleIcon
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'primary.main',
                            backgroundColor: 'white',
                            borderRadius: '50%'
                          }}
                        />
                      )}

                      <CardContent sx={{ pb: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar
                            sx={{
                              bgcolor: getFirmaColor(firma.tip) + '.main',
                              width: 40,
                              height: 40,
                              mr: 2
                            }}
                          >
                            {getFirmaAvatar(firma)}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6" noWrap>
                              {firma.firma_adi}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {firma.firma_kodu}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Firma Tipi */}
                          <Chip
                            label={firma.tip === 'ic' ? 'İç Firma' : 'Dış Firma'}
                            size="small"
                            color={getFirmaColor(firma.tip)}
                            sx={{ alignSelf: 'flex-start' }}
                          />

                          {/* Yetkili Kişi */}
                          {firma.yetkili_kisi && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="textSecondary">
                                {firma.yetkili_kisi}
                              </Typography>
                            </Box>
                          )}

                          {/* Telefon */}
                          {firma.telefon && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="textSecondary">
                                {firma.telefon}
                              </Typography>
                            </Box>
                          )}

                          {/* E-posta */}
                          {firma.email && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="textSecondary" noWrap>
                                {firma.email}
                              </Typography>
                            </Box>
                          )}

                          {/* Vergi No */}
                          {firma.vergi_no && (
                            <Typography variant="body2" color="textSecondary">
                              VN: {firma.vergi_no}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mr: 'auto' }}>
            {filteredFirmalar.length} firma gösteriliyor
          </Typography>
          <Button onClick={handleClose}>
            İptal
          </Button>
          <Button
            onClick={handleOnayla}
            variant="contained"
            disabled={!secilenFirma}
            startIcon={<BusinessIcon />}
          >
            Seçimi Onayla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Firma Ekle Modal */}
      <FirmaEkleModal
        open={firmaEkleModalOpen}
        onClose={() => setFirmaEkleModalOpen(false)}
        onSuccess={handleFirmaEkleSuccess}
      />
    </>
  );
};

export default FirmaSecimModal;