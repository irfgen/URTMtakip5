import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Popover,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  IconButton,
  Avatar,
  Button,
  CardMedia,
  Modal
} from '@mui/material';
import ImageWithFallback from './ImageWithFallback';
import { Draggable } from '@hello-pangea/dnd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FactoryIcon from '@mui/icons-material/Factory';
import LinkIcon from '@mui/icons-material/Link';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BuildIcon from '@mui/icons-material/Build';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import api from '../api/axiosConfig';
import { useDispatch } from 'react-redux';
import { isStatusCompleted } from '../utils/statusUtils';
import UretimPlaniEklemeModal from './UretimPlaniEklemeModal';
import { tezgahAPI, tezgahPlanAPI, isEmirleriAPI } from '../services/api';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';

const oncelikRenkleri = {
  dusuk: 'info',
  normal: 'success',
  yuksek: 'warning',
  acil: 'error'
};

const DURUM_IKONLARI = {
  'sipariş verilecek': <LocalShippingIcon fontSize="small" />,
  'sparişte': <LocalShippingIcon fontSize="small" />,
  'beklemede': <HourglassEmptyIcon fontSize="small" />,
  'iptal': <CancelIcon fontSize="small" />,
  'freze': <PrecisionManufacturingIcon fontSize="small" />,
  'torna': <BuildIcon fontSize="small" />,
  '5 metre': <FactoryIcon fontSize="small" />,
  '6 metre': <FactoryIcon fontSize="small" />,
  'kaynak': <BuildIcon fontSize="small" />
};

// Fotoğraf yolu için yardımcı fonksiyon
const getFotoPath = (foto_path) => {
  if (!foto_path) return '';
  if (foto_path.includes('://')) return foto_path; 
  if (foto_path.startsWith('/uploads/')) return foto_path;
  if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
  if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
  return '/uploads/fotograflar/' + foto_path;
};

// Teknik resim yolu için yardımcı fonksiyon
const getTeknikResimPath = (teknik_resim_path) => {
  if (!teknik_resim_path) return '';
  if (teknik_resim_path.includes('://')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/uploads/')) return teknik_resim_path;
  if (teknik_resim_path.startsWith('/teknik_resimler/')) return '/uploads' + teknik_resim_path;
  if (teknik_resim_path.includes('/')) return '/uploads/teknik_resimler/' + teknik_resim_path.split('/').pop();
  return '/uploads/teknik_resimler/' + teknik_resim_path;
};

const IsEmriKarti = ({ isEmri, index, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const [contextMenu, setContextMenu] = useState(null);
  const [istasyonMenu, setIstasyonMenu] = useState(null);
  const [tezgahlar, setTezgahlar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [parcaBilgileri, setParcaBilgileri] = useState(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [uretimPlaniModalOpen, setUretimPlaniModalOpen] = useState(false);
  const cardRef = useRef(null);

  const handleContextMenu = (event) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleIstasyonTanimla = async (event) => {
    event.stopPropagation();
    setLoading(true);
    try {
      const response = await tezgahAPI.getAll();
      console.log('Tezgahlar API yanıtı:', response.data);
      // API yanıtı bir dizi değilse veya data.data içindeyse düzelt
      const tezgahData = response.data?.data || response.data;
      setTezgahlar(Array.isArray(tezgahData) ? tezgahData : []);
      setIstasyonMenu(cardRef.current);
      if (!cardRef.current) {
        console.error('Popover anchor (cardRef.current) null!');
      }
      if (!tezgahData || tezgahData.length === 0) {
        console.warn('Tezgah listesi boş!');
      }
    } catch (error) {
      console.error('Tezgah listesi alınamadı:', error);
      setSnackbar({
        open: true,
        message: 'Tezgah listesi alınamadı',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Tezgahı planlanan işlere ekle
  const handleTezgahSec = async (tezgah) => {
    try {
      setLoading(true);
      const isEmriId = isEmri.is_emri_id || isEmri.id;
      await tezgahPlanAPI.addPlanlananIs(tezgah.tezgah_id, isEmriId);
      setSnackbar({
        open: true,
        message: `İş emri başarıyla ${tezgah.tezgah_tanimi} tezgahının planlanan işlerine eklendi`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Planlanan iş eklenemedi',
        severity: 'error'
      });
    } finally {
      setIstasyonMenu(null);
      handleCloseContextMenu();
      setLoading(false);
    }
  };

  const handleCloseIstasyonMenu = () => {
    setIstasyonMenu(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleParcaIliskilendir = () => {
    console.log('Parça ilişkilendirme işlemi');
    handleCloseContextMenu();
  };

  // İş emrini tamamlandı olarak işaretle
  const handleIsiTamamla = async () => {
    try {
      setLoading(true);
      
      // İş emrinin durumunu doğrudan 'tamamlandı' olarak güncelle
      await isEmirleriAPI.update(isEmri.is_emri_id, {
        ...isEmri,
        durum: 'tamamlandı'
      });
      
      // Redux store'u güncelle
      await dispatch(fetchIsEmirleri()).unwrap();
      
      setSnackbar({
        open: true,
        message: `İş emri #${isEmri.is_emri_no} başarıyla tamamlandı olarak işaretlendi`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('İş tamamlama hatası:', error);
      setSnackbar({
        open: true,
        message: 'İş tamamlama işlemi başarısız oldu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      handleCloseContextMenu();
    }
  };
  
  // Parça bilgilerini yükle
  useEffect(() => {
    if (isEmri && (isEmri.parca_kodu || isEmri.is_adi)) {
      const fetchParcaBilgileri = async () => {
        try {
          // Önce parca_kodu varsa onu kullan, yoksa is_adi ile aramayı dene
          const searchTerm = isEmri.parca_kodu || isEmri.is_adi;
          console.log(`Parça bilgileri aranıyor: ${searchTerm}`);
          
          const response = await api.get(`/parcalar?aramaMetni=${searchTerm}`);
          let parcaData = [];
          // Handle different API response formats (paginated or direct array)
          if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
            parcaData = response.data.parcalar;
          } else if (Array.isArray(response.data)) {
            parcaData = response.data;
          }
          
          if (parcaData.length > 0) {
            // Birebir eşleşen parçayı bul veya listedeki ilk parçayı al
            const matchedParca = isEmri.parca_kodu 
              ? parcaData.find(p => p.parcaKodu === isEmri.parca_kodu)
              : parcaData[0];
              
            console.log('Bulunan parça:', matchedParca);
            setParcaBilgileri(matchedParca);
          } else {
            console.log('Eşleşen parça bulunamadı.');
          }
        } catch (error) {
          console.error('Parça bilgileri alınamadı:', error);
        }
      };
      
      fetchParcaBilgileri();
    }
  }, [isEmri]);

  // İkon varsa o noktaya getir
  const renderDosyaIkonlari = () => {
    if (!parcaBilgileri) return null;
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
        {/* Hide photo icon since we're showing the image directly on the card */}
        {parcaBilgileri.teknik_resim_path && (
          <Tooltip
            title={
              parcaBilgileri.teknik_resim_path.endsWith('.pdf') ? (
                "PDF dosyasını açmak için tıklayın"
              ) : (
                <Box sx={{ p: 0 }}>
                  <ImageWithFallback
                    src={getTeknikResimPath(parcaBilgileri.teknik_resim_path)}
                    alt="Teknik Resim"
                    imgStyle={{ 
                      maxWidth: '300px', 
                      maxHeight: '300px', 
                      objectFit: 'contain',
                      transform: 'scale(1.2)', // Büyütülmüş görüntü
                    }}
                    fallbackText="Teknik resim yüklenemedi"
                  />
                </Box>
              )
            }
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'white',
                  '& .MuiTooltip-arrow': {
                    color: 'white',
                  },
                  maxWidth: 'none !important',
                  boxShadow: 3,
                  p: 1
                }
              }
            }}
            arrow
            placement="right"
            enterDelay={1000}
          >
            <IconButton size="small" onClick={() => window.open(getTeknikResimPath(parcaBilgileri.teknik_resim_path), '_blank')}>
              {parcaBilgileri.teknik_resim_path.endsWith('.pdf') ? (
                <PictureAsPdfIcon fontSize="small" color="error" />
              ) : (
                <DescriptionIcon fontSize="small" color="info" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  // Sipariş dokümanını görüntüleme işlevi
  const handleViewSiparisDocument = (documentPath) => {
    if (!documentPath) {
      setSnackbar({
        open: true,
        message: 'Sipariş dokümanı bulunamadı',
        severity: 'warning'
      });
      return;
    }

    // Doküman yolunu tam URL'ye dönüştür
    const fullUrl = documentPath.startsWith('http') 
      ? documentPath 
      : `${window.location.origin}${documentPath}`;
    
    // Modal'da göstermek için doküman bilgilerini ayarla
    setCurrentDocument({
      url: fullUrl,
      path: documentPath,
      type: getSiparisDocumentType(documentPath)
    });
    setDocumentModalOpen(true);
  };

  // Modal'ı kapatma işlevi
  const handleCloseDocumentModal = () => {
    setDocumentModalOpen(false);
    setCurrentDocument(null);
  };

  const handleUretimPlaniModalOpen = () => {
    setUretimPlaniModalOpen(true);
    setContextMenu(null);
  };

  const handleUretimPlaniModalClose = () => {
    setUretimPlaniModalOpen(false);
  };

  // Genel doküman görüntüleme işlevi (malzeme sipariş belgeleri için)
  const handleViewDocument = () => {
    try {
      // İş emri belgeleri listesi endpoint'ini çağır
      const documentsUrl = `${window.location.origin}/uploads/is_emri_${isEmri.is_emri_id}`;
      window.open(documentsUrl, '_blank');
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Belgeler görüntülenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  // Sipariş dokümanının dosya tipini belirleme işlevi
  const getSiparisDocumentType = (documentPath) => {
    if (documentPath) {
      const extension = documentPath.toLowerCase().split('.').pop();
      if (['pdf'].includes(extension)) return 'application/pdf';
      if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    }
    return 'unknown';
  };

  // Sipariş dokümanının ikonu
  const getSiparisDocumentIcon = (documentPath) => {
    const type = getSiparisDocumentType(documentPath);
    if (type === 'application/pdf') return <PictureAsPdfIcon sx={{ fontSize: '16px' }} />;
    if (type === 'image') return <ImageIcon sx={{ fontSize: '16px' }} />;
    return <VisibilityIcon sx={{ fontSize: '16px' }} />;
  };

  return (
    <Draggable draggableId={isEmri.is_emri_id.toString()} index={index}>
      {(provided) => (
        <>
          <Card
            ref={el => { provided.innerRef(el); cardRef.current = el; }}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            sx={{
              mb: 2,
              cursor: 'grab',
              '&:hover': {
                boxShadow: 6,
              },
            }}
            onContextMenu={handleContextMenu}
          >
            <CardContent sx={{ position: 'relative', pb: '8px !important' }}>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" component="div">
                    #{isEmri.is_emri_no}
                  </Typography>
                  <Chip
                    label={isEmri.oncelik.toUpperCase()}
                    color={oncelikRenkleri[isEmri.oncelik]}
                    size="small"
                  />
                </Box>
                <Typography variant="body1">{isEmri.is_adi}</Typography>
                
                {/* Yazı bilgileri */}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Üretim Planı: {isEmri.uretim_plani_aciklama || isEmri.plan_liste_no || (isEmri.uretim_plani_id ? `Plan #${isEmri.uretim_plani_id}` : 'Plan Dışı')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Adet: {isEmri.adet}
                  </Typography>
                  {isEmri.setup_sayisi !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Setup Sayısı: {isEmri.setup_sayisi}
                    </Typography>
                  )}
                  {isEmri.cnc_suresi !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      CNC Süresi: {isEmri.cnc_suresi} dk
                    </Typography>
                  )}
                  {isEmri.parca_kodu && (
                    <Typography variant="body2" color="text.secondary">
                      Parça Kodu: {isEmri.parca_kodu}
                    </Typography>
                  )}
                  
                  {/* Malzeme sipariş bilgileri kaldırıldı */}
                  
                  {/* Sipariş dokümanları - malzeme sipariş durumundan bağımsız olarak göster */}
                  {isEmri.siparis_dokumani_dosya_yolu && (
                    <>
                      {console.log(`İş Emri ${isEmri.is_emri_no}: Sipariş dokümanı bulundu:`, isEmri.siparis_dokumani_dosya_yolu)}
                      <Box sx={{ mt: 0.5 }}>
                        <Card 
                          sx={{ 
                            width: 120, 
                            height: 120, 
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 }
                          }}
                          onClick={() => handleViewSiparisDocument(isEmri.siparis_dokumani_dosya_yolu)}
                        >
                          <CardMedia
                            sx={{ 
                              height: 80, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5'
                            }}
                          >
                            {getSiparisDocumentType(isEmri.siparis_dokumani_dosya_yolu) === 'image' ? (
                              <img
                                src={`${window.location.origin}${isEmri.siparis_dokumani_dosya_yolu}`}
                                alt="Sipariş dokümanı"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {getSiparisDocumentIcon(isEmri.siparis_dokumani_dosya_yolu)}
                              </Box>
                            )}
                            <Box 
                              sx={{ 
                                display: 'none', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%' 
                              }}
                            >
                              {getSiparisDocumentIcon(isEmri.siparis_dokumani_dosya_yolu)}
                            </Box>
                          </CardMedia>
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" noWrap>
                              Sipariş Dokümanı
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    </>
                  )}
                  
                  {/* Malzeme bilgileri ve belge görüntüleme bölümü */}
                  {isEmri.malzemeVar && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Malzeme Sipariş Bilgileri
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={handleViewDocument}
                        sx={{ 
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1
                        }}
                      >
                        Belgeleri Görüntüle
                      </Button>
                    </Box>
                  )}
                  
                  {renderDosyaIkonlari()}
                </Box>
                
                {/* Parça görseli ayrı satırda, sola dayalı */}
                {parcaBilgileri && parcaBilgileri.foto_path && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>                      <Tooltip
                      title={
                        <Box sx={{ p: 0 }}>
                          <ImageWithFallback
                            src={getFotoPath(parcaBilgileri.foto_path)}
                            alt={isEmri.is_adi}
                            imgStyle={{ 
                              maxWidth: '900px', 
                              maxHeight: '900px', 
                              objectFit: 'contain',
                              transform: 'scale(1.2)', // Büyütülmüş görüntü
                            }}
                            fallbackText="Parça görseli yüklenemedi"
                          />
                        </Box>
                      }
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'white',
                            '& .MuiTooltip-arrow': {
                              color: 'white',
                            },
                            maxWidth: 'none !important',
                            boxShadow: 5,
                            p: 2,
                            borderRadius: 2
                          }
                        }
                      }}
                      arrow
                      placement="right-start"
                      enterDelay={100}
                    >
                      <Box 
                        sx={{ 
                          width: 220, 
                          height: 220, 
                          cursor: 'pointer',
                          boxShadow: 1,
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 2,
                          '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => window.open(getFotoPath(parcaBilgileri.foto_path), '_blank')}
                      >
                        <img
                          src={getFotoPath(parcaBilgileri.foto_path)}
                          alt={isEmri.is_adi}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.4)', // Büyütme faktörü
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain' // Resmin tamamını göster
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Menu
            open={Boolean(contextMenu)}
            onClose={handleCloseContextMenu}
            anchorReference="anchorPosition"
            anchorPosition={contextMenu !== null ? { top: contextMenu.y, left: contextMenu.x } : undefined}
          >
            <MenuItem onClick={handleIstasyonTanimla}>
              <ListItemIcon>
                <FactoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Tezgah Tanımla</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleIsiTamamla} disabled={isStatusCompleted(isEmri.durum)}>
              <ListItemIcon>
                <AssignmentTurnedInIcon fontSize="small" color={isStatusCompleted(isEmri.durum) ? 'disabled' : 'success'} />
              </ListItemIcon>
              <ListItemText>İşi Tamamlandı Yap</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleUretimPlaniModalOpen}>
              <ListItemIcon>
                <CalendarTodayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Üretim Planına Ekle</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { onEdit(isEmri); handleCloseContextMenu(); }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Kartı Düzenle</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onDelete(isEmri.is_emri_id); handleCloseContextMenu(); }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Kartı Sil</ListItemText>
            </MenuItem>
          </Menu>

          <Popover
            open={Boolean(istasyonMenu)}
            anchorEl={istasyonMenu}
            onClose={handleCloseIstasyonMenu}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            {loading ? (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List sx={{ width: 250 }}>
                {(tezgahlar || []).map((tezgah) => (
                  <ListItem
                    key={tezgah.tezgah_id}
                    button
                    onClick={() => handleTezgahSec(tezgah)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <PrecisionManufacturingIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={tezgah.tezgah_tanimi} />
                  </ListItem>
                ))}
              </List>
            )}
          </Popover>
          
          {/* Snackbar for notifications */}
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Doküman görüntüleme modal'ı */}
          <Modal
            open={documentModalOpen}
            onClose={handleCloseDocumentModal}
            aria-labelledby="document-modal-title"
            aria-describedby="document-modal-description"
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                height: '90vh',
                bgcolor: 'background.paper',
                border: '2px solid #000',
                boxShadow: 24,
                p: 2,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography id="document-modal-title" variant="h6" component="h2">
                  Sipariş Dokümanı
                </Typography>
                <IconButton onClick={handleCloseDocumentModal}>
                  <CloseIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {currentDocument && (
                  <>
                    {currentDocument.type === 'image' ? (
                      <img
                        src={currentDocument.url}
                        alt="Sipariş dokümanı"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    ) : currentDocument.type === 'application/pdf' ? (
                      <iframe
                        src={currentDocument.url}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none'
                        }}
                        title="Sipariş dokümanı"
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%',
                          gap: 2
                        }}
                      >
                        {getSiparisDocumentIcon(currentDocument.path)}
                        <Typography>
                          Bu dosya türü görüntülenemiyor
                        </Typography>
                        <Button 
                          variant="contained" 
                          onClick={() => window.open(currentDocument.url, '_blank')}
                        >
                          Yeni Sekmede Aç
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Modal>

          <UretimPlaniEklemeModal
            open={uretimPlaniModalOpen}
            onClose={handleUretimPlaniModalClose}
            isEmriId={isEmri.is_emri_id}
            isEmriAdi={isEmri.is_adi}
            onSuccess={(message) => {
              setSnackbar({
                open: true,
                message: message,
                severity: 'success'
              });
            }}
            onError={(message) => {
              setSnackbar({
                open: true,
                message: message,
                severity: 'error'
              });
            }}
          />
        </>
      )}
    </Draggable>
  );
};

export default IsEmriKarti;