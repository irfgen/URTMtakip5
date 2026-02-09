import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Container,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteUretimPlani } from '../../store/slices/uretimPlaniSlice';
import IsEmriSecimiModalMobile from '../../components/mobile/IsEmriSecimiModalMobile';
import FasonEkleMobile from '../../components/mobile/FasonEkleMobile';
import { SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import axios from 'axios';


import apiClient from '../../utils/apiClient';function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`mobile-tabpanel-${index}`}
      aria-labelledby={`mobile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const UretimPlaniDetayMobile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEmriModalOpen, setIsEmriModalOpen] = useState(false);
  const [fasonIsler, setFasonIsler] = useState([]);
  const [loadingFason, setLoadingFason] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedIsEmri, setSelectedIsEmri] = useState(null);
  const [fasonEkleModalOpen, setFasonEkleModalOpen] = useState(false);

  useEffect(() => {
    loadPlanDetails();
  }, [id]);

  useEffect(() => {
    if (plan && tabValue === 1) {
      loadFasonIsler();
    }
  }, [plan, tabValue]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/uretim-plani/${id}?mobile=true`);
      setPlan(response.data);
    } catch (error) {
      console.error('Plan detayı yüklenirken hata:', error);
      setError('Plan detayı yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/mobile/uretim-plani/duzenle/${id}`);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUretimPlani(id));
      navigate('/mobile/uretim-plani');
    } catch (error) {
      setError('Plan silinirken bir hata oluştu');
    }
    setDeleteDialogOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'tamamlandi':
      case 'tamamlandı':
        return 'success';
      case 'devam ediyor':
      case 'aktif':
        return 'primary';
      case 'beklemede':
        return 'warning';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    // Use environment variable or fallback to default backend URL
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl.replace('/api', '')}/${cleanPath}`;
  };

  const handleImageClick = (imagePath, imageType) => {
    if (!imagePath) return;
    setSelectedImage({
      url: getImageUrl(imagePath),
      type: imageType,
      path: imagePath
    });
    setImageDialogOpen(true);
  };

  const loadFasonIsler = async () => {
    try {
      setLoadingFason(true);
      const response = await axios.get(`/api/uretim-plani/${id}/fason-isler`);
      setFasonIsler(response.data.data || response.data);
    } catch (error) {
      console.error('Fason işler yüklenirken hata:', error);
    } finally {
      setLoadingFason(false);
    }
  };

  const handleIsEmriEkle = (selectedIsEmirleri) => {
    // API call to add selected iş emirleri to plan
    const isEmriIds = Array.isArray(selectedIsEmirleri) 
      ? selectedIsEmirleri.map(ie => ie.id)
      : [selectedIsEmirleri.id];
    
    axios.post(`/api/uretim-plani/${id}/is-emirleri`, { is_emri_ids: isEmriIds })
      .then(() => {
        loadPlanDetails(); // Reload plan data
        setIsEmriModalOpen(false);
      })
      .catch(error => {
        console.error('İş emri eklenirken hata:', error);
        setError('İş emri eklenirken hata oluştu');
      });
  };

  const handleIsEmriSil = async (isEmriId) => {
    try {
      await axios.delete(`/api/uretim-plani/${id}/is-emirleri/${isEmriId}`);
      loadPlanDetails();
      setActionMenuAnchor(null);
      setSelectedIsEmri(null);
    } catch (error) {
      console.error('İş emri silinirken hata:', error);
      setError('İş emri silinirken hata oluştu');
    }
  };

  const handleDurumDegistir = async (isEmriId, yeniDurum) => {
    try {
      await axios.put(`/api/is-emirleri/${isEmriId}/durum`, { durum: yeniDurum });
      loadPlanDetails();
      setActionMenuAnchor(null);
      setSelectedIsEmri(null);
    } catch (error) {
      console.error('Durum değiştirilirken hata:', error);
      setError('Durum değiştirilirken hata oluştu');
    }
  };

  const handleActionMenuOpen = (isEmri, event) => {
    setSelectedIsEmri(isEmri);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedIsEmri(null);
  };

  const speedDialActions = [
    {
      icon: <AddIcon />,
      name: 'İş Emri Ekle',
      onClick: () => setIsEmriModalOpen(true)
    },
    {
      icon: <BusinessIcon />,
      name: 'Fason İş Ekle',
      onClick: () => setFasonEkleModalOpen(true)
    },
    {
      icon: <EditIcon />,
      name: 'Planı Düzenle',
      onClick: handleEdit
    }
  ];

  const handleFasonIsKaydet = async (fasonData) => {
    try {
      await axios.post(`/api/uretim-plani/${id}/fason-isler`, fasonData);
      loadFasonIsler(); // Reload fason işler
      setFasonEkleModalOpen(false);
    } catch (error) {
      console.error('Fason iş kaydedilirken hata:', error);
      setError('Fason iş kaydedilirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!plan) {
    return (
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Alert severity="warning">Plan bulunamadı</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/mobile/uretim-plani')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Plan Detayı
          </Typography>
          <IconButton color="inherit" onClick={handleEdit}>
            <EditIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDeleteDialogOpen(true)}>
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Container maxWidth="sm" sx={{ flex: 1, py: 2 }}>
        {/* Plan Info Card */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                {plan.ozel_liste_adi || `Plan #${plan.id}`}
              </Typography>
              <Chip 
                label={plan.durum || 'Belirtilmemiş'}
                color={getDurumColor(plan.durum)}
                variant="outlined"
              />
            </Box>

            <List disablePadding>
              {plan.makina && (
                <>
                  <ListItem disablePadding>
                    <ListItemIcon>
                      <BuildIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Makina"
                      secondary={`${plan.makina.name} (${plan.makina.model || 'Model belirtilmemiş'})`}
                    />
                  </ListItem>
                  <Divider />
                </>
              )}

              <ListItem disablePadding>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Miktar"
                  secondary={plan.miktar || '-'}
                />
              </ListItem>
              <Divider />

              <ListItem disablePadding>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Teslim Tarihi"
                  secondary={formatDate(plan.teslim_tarihi)}
                />
              </ListItem>
              <Divider />

              <ListItem disablePadding>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Oluşturma Tarihi"
                  secondary={formatDate(plan.olusturma_tarihi)}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Stats Card */}
        {plan.stats && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                İstatistikler
              </Typography>
              <Box display="flex" justifyContent="space-around">
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {plan.stats.toplam_is_emri}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    İş Emri
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h4" color="secondary">
                    {plan.stats.toplam_fason_is_emri}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fason İş
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Chip 
                    label={plan.stats.plan_tipi}
                    color={plan.stats.plan_tipi === 'makina' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Plan Tipi
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Card>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label="İş Emirleri" />
            <Tab label="Fason İşler" />
            <Tab label="Detaylar" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* İş Emri Ekleme Butonu */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setIsEmriModalOpen(true)}
                fullWidth
              >
                İş Emri Ekle
              </Button>
            </Box>

            {plan.is_emirleri && plan.is_emirleri.length > 0 ? (
              <List>
                {plan.is_emirleri.map((isEmri, index) => (
                  <React.Fragment key={isEmri.is_emri_id || isEmri.id}>
                    <ListItem>
                      {isEmri.parca && (isEmri.parca.foto_path || isEmri.parca.teknik_resim_path) && (
                        <ListItemAvatar>
                          <Avatar
                            src={getImageUrl(isEmri.parca.foto_path || isEmri.parca.teknik_resim_path)}
                            onClick={() => handleImageClick(
                              isEmri.parca.foto_path || isEmri.parca.teknik_resim_path,
                              isEmri.parca.foto_path ? 'Parça Fotoğrafı' : 'Teknik Resim'
                            )}
                            sx={{ 
                              cursor: 'pointer',
                              bgcolor: 'grey.300',
                              '&:hover': { bgcolor: 'grey.400' }
                            }}
                          >
                            <ImageIcon />
                          </Avatar>
                        </ListItemAvatar>
                      )}
                      <ListItemText
                        primary={`${isEmri.is_emri_no} - ${isEmri.is_adi}`}
                        secondary={
                          `Durum: ${isEmri.durum} | Adet: ${isEmri.adet}${isEmri.parca ? ` | Parça: ${isEmri.parca.parca_kodu} - ${isEmri.parca.parca_adi}` : ''}`
                        }
                      />
                      <Box display="flex" alignItems="center" gap={1}>
                        {isEmri.parca && (
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            {isEmri.parca.foto_path && (
                              <IconButton
                                size="small"
                                onClick={() => handleImageClick(isEmri.parca.foto_path, 'Parça Fotoğrafı')}
                                sx={{ p: 0.5 }}
                              >
                                <ImageIcon fontSize="small" />
                              </IconButton>
                            )}
                            {isEmri.parca.teknik_resim_path && (
                              <IconButton
                                size="small"
                                onClick={() => handleImageClick(isEmri.parca.teknik_resim_path, 'Teknik Resim')}
                                sx={{ p: 0.5 }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(isEmri, e)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                    {index < plan.is_emirleri.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" sx={{ py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Bu plana ait iş emri bulunmuyor
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsEmriModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  İlk İş Emrini Ekle
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Fason İş Ekleme Butonu */}
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<BusinessIcon />}
                onClick={() => setFasonEkleModalOpen(true)}
                fullWidth
              >
                Fason İş Ekle
              </Button>
            </Box>

            {loadingFason ? (
              <Box display="flex" justifyContent="center" sx={{ py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : fasonIsler && fasonIsler.length > 0 ? (
              <List>
                {fasonIsler.map((fasonIs, index) => (
                  <React.Fragment key={fasonIs.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <BusinessIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={fasonIs.firma_adi || 'Fason Firma'}
                        secondary={
                          `İş Tanımı: ${fasonIs.is_tanimi} | Adet: ${fasonIs.adet} | Durum: ${fasonIs.durum}${fasonIs.teslim_tarihi ? ` | Teslim: ${formatDate(fasonIs.teslim_tarihi)}` : ''}`
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(fasonIs, e)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItem>
                    {index < fasonIsler.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" sx={{ py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Bu plana ait fason iş bulunmuyor
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<BusinessIcon />}
                  onClick={() => setFasonEkleModalOpen(true)}
                  sx={{ mt: 2 }}
                >
                  İlk Fason İşi Ekle
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              <ListItem>
                <ListItemText
                  primary="Plan ID"
                  secondary={plan.id}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Plan Tipi"
                  secondary={plan.stats?.plan_tipi || 'Belirtilmemiş'}
                />
              </ListItem>
              <Divider />
              {plan.aciklama && (
                <>
                  <ListItem>
                    <ListItemText
                      primary="Açıklama"
                      secondary={plan.aciklama}
                    />
                  </ListItem>
                  <Divider />
                </>
              )}
              <ListItem>
                <ListItemText
                  primary="Son Güncelleme"
                  secondary={formatDate(plan.guncelleme_tarihi)}
                />
              </ListItem>
            </List>
          </TabPanel>
        </Card>
      </Container>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Plan işlemleri"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.onClick();
              setSpeedDialOpen(false);
            }}
          />
        ))}
      </SpeedDial>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Planı Sil</DialogTitle>
        <DialogContent>
          <Typography>
            Bu üretim planını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image View Dialog */}
      <Dialog 
        open={imageDialogOpen} 
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedImage?.type || 'Resim'}
            </Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: 300 }}>
              <img
                src={selectedImage.url}
                alt={selectedImage.type}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Box 
                display="none" 
                justifyContent="center" 
                alignItems="center" 
                flexDirection="column"
                sx={{ minHeight: 200, color: 'text.secondary' }}
              >
                <ImageIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography>Resim yüklenemedi</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleDurumDegistir(selectedIsEmri?.id, 'Başlandı')}>
          Başlat
        </MenuItem>
        <MenuItem onClick={() => handleDurumDegistir(selectedIsEmri?.id, 'Tamamlandı')}>
          Tamamla
        </MenuItem>
        <MenuItem onClick={() => handleDurumDegistir(selectedIsEmri?.id, 'Durduruldu')}>
          Durdur
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleIsEmriSil(selectedIsEmri?.id)} 
          sx={{ color: 'error.main' }}
        >
          <RemoveIcon sx={{ mr: 1 }} />
          Plandan Çıkar
        </MenuItem>
      </Menu>

      {/* İş Emri Seçimi Modal */}
      <IsEmriSecimiModalMobile
        open={isEmriModalOpen}
        onClose={() => setIsEmriModalOpen(false)}
        onSelect={handleIsEmriEkle}
        multiSelect={true}
        title="Plan için İş Emri Seç"
      />

      {/* Fason İş Ekleme Modal */}
      <FasonEkleMobile
        open={fasonEkleModalOpen}
        onClose={() => setFasonEkleModalOpen(false)}
        onSave={handleFasonIsKaydet}
        title="Plana Fason İş Ekle"
      />
    </Box>
  );
};

export default UretimPlaniDetayMobile;