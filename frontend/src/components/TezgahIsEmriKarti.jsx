// Tezgah işlemleri için özelleştirilmiş iş emri kartı
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ImageWithFallback from './ImageWithFallback';
import { Draggable } from '@hello-pangea/dnd';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import api from '../api/axiosConfig';

const oncelikRenkleri = {
  dusuk: 'info',
  normal: 'success',
  yuksek: 'warning',
  acil: 'error'
};

const DURUM_IKONLARI = {
  'Beklemede': <HourglassEmptyIcon fontSize="small" />,
  'Imalatta': <FactoryIcon fontSize="small" />,
  'Tamamlandi': <CheckCircleIcon fontSize="small" />,
  'Iptal': <CancelIcon fontSize="small" />
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

const TezgahIsEmriKarti = ({ planIs, index, isDragDisabled = false, onClick, onMoveUp, onMoveDown, onRemove, onAssignToOtherWorkstation, isFirst, isLast }) => {
  const [parcaBilgileri, setParcaBilgileri] = useState(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const cardRef = useRef(null);

  // İkon varsa o noktaya getir
  const renderDosyaIkonlari = () => {
    if (!parcaBilgileri) return null;
    
    return (
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
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
  
  // Context menu handlers
  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleContextMenuClose = () => {
    setContextMenuAnchor(null);
  };

  const handleMoveUp = () => {
    handleContextMenuClose();
    if (onMoveUp && !isFirst) {
      const isEmriId = planIs.is_emri_id || planIs.id;
      onMoveUp(isEmriId, index);
    }
  };

  const handleMoveDown = () => {
    handleContextMenuClose();
    if (onMoveDown && !isLast) {
      const isEmriId = planIs.is_emri_id || planIs.id;
      onMoveDown(isEmriId, index);
    }
  };

  const handleRemove = () => {
    handleContextMenuClose();
    if (onRemove) {
      // İş emri ID'sini doğru alan adından al
      const isEmriId = planIs.is_emri_id || planIs.id;
      console.log('İş emri planlanan listeden kaldırılıyor:', isEmriId, 'planIs:', planIs);
      onRemove(isEmriId);
    }
  };

  const handleAssignToOther = () => {
    handleContextMenuClose();
    if (onAssignToOtherWorkstation) {
      const isEmriId = planIs.is_emri_id || planIs.id;
      onAssignToOtherWorkstation(isEmriId);
    }
  };
  
  // Parça bilgilerini yükle
  useEffect(() => {
    if (planIs && (planIs.parca_kodu || planIs.is_adi)) {
      const fetchParcaBilgileri = async () => {
        try {
          // Önce parca_kodu varsa onu kullan, yoksa is_adi ile aramayı dene
          const searchTerm = planIs.parca_kodu || planIs.is_adi;
          
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
            const matchedParca = planIs.parca_kodu 
              ? parcaData.find(p => p.parcaKodu === planIs.parca_kodu)
              : parcaData[0];
              
            setParcaBilgileri(matchedParca);
          }
        } catch (error) {
          console.error('Parça bilgileri alınamadı:', error);
        }
      };
      
      fetchParcaBilgileri();
    }
  }, [planIs]);

  return (
    <>
      <Draggable 
      draggableId={`draggable-${String(planIs.is_emri_id || planIs.id || index)}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <Card
          ref={el => { provided.innerRef(el); cardRef.current = el; }}
          {...provided.draggableProps}
          onContextMenu={handleContextMenu}
          sx={{
            mb: 1,
            cursor: isDragDisabled ? 'default' : 'grab',
            '&:hover': {
              boxShadow: 6,
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            backgroundColor: snapshot.isDragging ? 'primary.50' : 'background.paper',
            boxShadow: snapshot.isDragging ? 3 : 1,
            border: '1px solid #f0f0f0',
            borderRadius: 1
          }}
          onClick={onClick}
        >
          <CardContent sx={{ position: 'relative', pb: '8px !important' }}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center">
                  <Box 
                    {...provided.dragHandleProps}
                    sx={{ 
                      mr: 1,
                      cursor: isDragDisabled ? 'default' : 'grab', 
                      display: 'flex',
                      alignItems: 'center',
                      visibility: isDragDisabled ? 'hidden' : 'visible'
                    }}
                  >
                    <DragIndicatorIcon 
                      sx={{ 
                        color: snapshot.isDragging ? 'primary.main' : 'text.disabled',
                        opacity: snapshot.isDragging ? 1 : 0.5
                      }}
                    />
                  </Box>
                  
                  <Typography variant="h6" component="div" fontWeight={index === 0 ? 'bold' : 'normal'}>
                    #{planIs.is_emri_no || planIs.is_emri_id}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  {planIs.oncelik && (
                    <Chip
                      label={planIs.oncelik.toUpperCase()}
                      color={oncelikRenkleri[planIs.oncelik]}
                      size="small"
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={handleContextMenu}
                    sx={{ p: 0.5 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body1">{planIs.is_adi || ''}</Typography>
              
              {/* İş emri bilgileri */}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Üretim Planı: {planIs.uretim_plani_id ? `Plan #${planIs.uretim_plani_id}` : (planIs.plan_liste_no || '-')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adet: {planIs.adet || '0'}
                </Typography>
                {planIs.setup_sayisi !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Setup Sayısı: {planIs.setup_sayisi}
                  </Typography>
                )}
                {planIs.cnc_suresi !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    CNC Süresi: {planIs.cnc_suresi} dk
                  </Typography>
                )}
              </Box>
              
              {/* Parça kodu ve görseli alt kısımda */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Parça: {planIs.parca_kodu || 'Belirtilmemiş'}
                </Typography>
                {renderDosyaIkonlari()}
                
                {/* Parça görseli parça kodunun altında sola hizalı */}
                {parcaBilgileri && parcaBilgileri.foto_path && (
                  <Tooltip
                    title={
                      <Box sx={{ p: 0 }}>
                        <ImageWithFallback
                          src={getFotoPath(parcaBilgileri.foto_path)}
                          alt={planIs.is_adi}
                          imgStyle={{ 
                            maxWidth: '900px', 
                            maxHeight: '900px', 
                            objectFit: 'contain',
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
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-start', 
                      alignItems: 'center',
                      mt: 1
                    }}>
                      <Avatar 
                        variant="rounded"
                        sx={{ 
                          width: 220, 
                          height: 220, 
                          cursor: 'pointer',
                          boxShadow: 1,
                          '&:hover': { opacity: 0.8 },
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getFotoPath(parcaBilgileri.foto_path), '_blank');
                        }}
                        alt={planIs.is_adi}
                      >
                        <img
                          src={getFotoPath(parcaBilgileri.foto_path)}
                          alt={planIs.is_adi}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%) scale(1.5)', // Daha büyük ölçekte görüntü
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Avatar>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Draggable>
    
    {/* Context Menu */}
    <Menu
      anchorEl={contextMenuAnchor}
      open={Boolean(contextMenuAnchor)}
      onClose={handleContextMenuClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <MenuItem onClick={handleMoveUp} disabled={isFirst}>
        <ListItemIcon>
          <KeyboardArrowUpIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Yukarı Taşı" />
      </MenuItem>
      
      <MenuItem onClick={handleMoveDown} disabled={isLast}>
        <ListItemIcon>
          <KeyboardArrowDownIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Aşağı Taşı" />
      </MenuItem>
      
      <MenuItem onClick={handleRemove}>
        <ListItemIcon>
          <RemoveCircleOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Listeden Çıkar" />
      </MenuItem>
      
      <MenuItem onClick={handleAssignToOther}>
        <ListItemIcon>
          <SwapHorizIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Başka Tezgaha Ata" />
      </MenuItem>
    </Menu>
    </>
  );
};

export default TezgahIsEmriKarti;
