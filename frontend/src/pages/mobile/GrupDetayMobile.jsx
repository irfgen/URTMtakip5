import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { getFotoPath, getTeknikResimPath, getFileType } from '../../utils/imageUtils';
import ImageWithFallback from '../../components/ImageWithFallback';
import ParcaKartiMobilGrup from '../../components/parcakarti_mobilgurup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Fab,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  CardActionArea
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Inventory as InventoryIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  DesignServices as DesignServicesIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Tab Panel bileşeni
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`grup-tabpanel-${index}`}
      aria-labelledby={`grup-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 1 }}>
          {children}
        </Box>
      )}
    </div>
  );
}


function GrupDetayMobile() {
  // Parça görseli modalı için state
  const [openImage, setOpenImage] = useState(false);
  const [openImageUrl, setOpenImageUrl] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State tanımlamaları
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [partDetails, setPartDetails] = useState({});

  // Sayfa yüklendiğinde BOM detayını getir
  useEffect(() => {
    if (id) {
      fetchBomDetail();
    }
  }, [id]);

  // BOM detayını API'den getir
  const fetchBomDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/boms/${id}`);
      setBom(response.data);
      setError(null);
      
      // Parça detaylarını getir
      if (response.data.items) {
        await fetchPartDetails(response.data.items);
      }
    } catch (err) {
      console.error('BOM detayı yüklenirken hata:', err);
      setError('Grup detayları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Parça detaylarını getir
  const fetchPartDetails = async (items) => {
    console.log("🔍 fetchPartDetails called with items:", items);
    
    // Based on API analysis, BOM items have structure: {type: "PARCA", name: "PART_CODE", quantity: 1}
    // So we filter for PARCA type items and use the name field as part code
    const partItems = items.filter(item => item.type === 'PARCA');
    console.log("🔍 Filtered PARCA items:", partItems);
    
    const details = {};
    
    for (const item of partItems) {
      try {
        console.log("🔍 Processing PARCA item:", item);
        
        // Extract part code from the name field (confirmed by API testing)
        const partCode = item.name;
        console.log(`🔍 Part code from item.name: ${partCode}`);
        
        if (!partCode) {
          console.log("❌ Skipping item - no part code in name field");
          continue;
        }
        
        try {
          console.log(`🌐 Fetching part details for code: ${partCode}`);
          const response = await axios.get(`/api/parcalar/${encodeURIComponent(partCode)}`);
          console.log(`✅ Part details received:`, response.data);
          
          // Store part details using the part code as key
          details[partCode] = response.data;
          console.log(`✅ Stored part details for key: ${partCode}`);
          
        } catch (err) {
          console.log(`❌ Failed to fetch part details for ${partCode}:`, err.message);
        }
        
      } catch (err) {
        console.error(`❌ Error processing item:`, item, err);
      }
    }
    
    console.log("🔍 Final partDetails object:", details);
    setPartDetails(details);
  };

  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Geri dön
  const handleGoBack = () => {
    navigate('/mobile/gruplar');
  };

  // Düzenlemeye git
  const handleEdit = () => {
    navigate(`/mobile/gruplar/duzenle/${id}`);
  };

  // Grup silme
  const handleDelete = async () => {
    if (window.confirm(`"${bom.name}" grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      try {
        await axios.delete(`/api/boms/${id}`);
        navigate('/mobile/gruplar');
      } catch (err) {
        console.error('BOM silinirken hata:', err);
        setError('Grup silinirken bir hata oluştu.');
      }
    }
  };

  // Parça detayına git
  const handlePartDetail = (partId, partCode, item) => {
    // Based on the BOM API structure, we should use item.name as the part code
    const actualPartCode = item?.name || partCode;
    
    if (!actualPartCode) {
      console.log("No valid part code found, cannot navigate");
      return;
    }
    
    // Navigate using the part code
    navigate(`/mobile/parcalar/${encodeURIComponent(actualPartCode)}`);
  };

  // Alt grup detayına git
  const handleSubBomDetail = (bomId) => {
    navigate(`/mobile/gruplar/${bomId}`);
  };

  // Loading durumu
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error durumu
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <IconButton onClick={handleGoBack}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  // BOM bulunamadı
  if (!bom) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Grup bulunamadı.
        </Alert>
        <IconButton onClick={handleGoBack}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  // Sadece type: 'PARCA' olanlar parça
  const partItems = bom.items?.filter(item => item.type === 'PARCA') || [];
  // Alt gruplar için ileride gerekirse benzer şekilde filtre eklenebilir
  const bomItems = [];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Üst AppBar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleGoBack}
            aria-label="geri"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            {bom.name}
          </Typography>
          <IconButton color="inherit" onClick={handleEdit}>
            <EditIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Error Message */}
      {error && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Grup Bilgileri Kartı */}
      <Card sx={{ m: 2, mb: 1 }} elevation={2}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {bom.name}
          </Typography>
          
          {bom.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {bom.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              icon={<CategoryIcon />}
              label={`${partItems.length} parça`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip 
              icon={<FolderIcon />}
              label={`${bomItems.length} alt grup`}
              color="info"
              variant="outlined"
              size="small"
            />
            <Chip 
              label={`Toplam ${bom.items?.length || 0} öğe`}
              color="primary"
              size="small"
            />
          </Box>

          <Divider sx={{ my: 2 }} />
          

          
          {bom.updated_at && bom.updated_at !== bom.created_at && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Son güncelleme: {new Date(bom.updated_at).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Sekmeler */}
      <Paper square sx={{ mx: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={`Parçalar (${partItems.length})`} 
            icon={<CategoryIcon />}
            iconPosition="start"
          />
          <Tab 
            label={`Alt Gruplar (${bomItems.length})`} 
            icon={<FolderIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Bilgiler" 
            icon={<InfoIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Parçalar Sekmesi */}
      <TabPanel value={activeTab} index={0}>
        <Card>
          <CardContent sx={{ p: 1 }}>
            {partItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CategoryIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Bu grupta henüz parça bulunmuyor
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {partItems.map((item, index) => {
                  // Based on BOM API structure: {type: "PARCA", name: "PART_CODE", quantity: 1}
                  const partCode = item.name; // Part code is in the name field
                  const partDetail = partDetails[partCode]; // Look up using part code
                  
                  return (
                    <ParcaKartiMobilGrup
                      key={partCode + '-' + index}
                      partCode={partCode}
                      partName={partCode} // Display the part code as name for now
                      quantity={item.quantity}
                      partDetail={partDetail}
                      onClick={() => handlePartDetail(null, partCode, item)}
                    />
                  );
                })}
              </Box>
            )}
            
            {/* Thumbnail modalı */}
            <Dialog open={openImage} onClose={() => setOpenImage(false)} maxWidth="md">
              <DialogTitle>
                Parça Görseli
                <IconButton
                  aria-label="close"
                  onClick={() => setOpenImage(false)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {openImageUrl && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src={openImageUrl}
                      alt="Parça"
                      style={{ maxWidth: '90vw', maxHeight: '70vh', borderRadius: 8 }}
                      onError={(e) => {
                        console.error("Image failed to load:", openImageUrl);
                        e.target.src = 'https://via.placeholder.com/400x400?text=Görsel+Bulunamadı';
                      }}
                    />
                  </Box>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Alt Gruplar Sekmesi */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent sx={{ p: 1 }}>
            {bomItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <FolderIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Bu grupta alt grup bulunmuyor
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {bomItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem
                      button
                      onClick={() => handleSubBomDetail(item.id)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <FolderIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {item.name || item.id}
                          </Typography>
                        }
                        secondary={`Miktar: ${item.quantity || 1} adet`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleSubBomDetail(item.id)}>
                          <ChevronRightIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < bomItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Bilgiler Sekmesi */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Grup Bilgileri
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Grup ID
              </Typography>
              <Typography variant="body1">
                {bom.bom_id}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Grup Adı
              </Typography>
              <Typography variant="body1">
                {bom.name}
              </Typography>
            </Box>

            {bom.description && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Açıklama
                </Typography>
                <Typography variant="body1">
                  {bom.description}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Toplam Öğe Sayısı
              </Typography>
              <Typography variant="body1">
                {bom.items?.length || 0}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Parça Sayısı
              </Typography>
              <Typography variant="body1">
                {partItems.length}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Alt Grup Sayısı
              </Typography>
              <Typography variant="body1">
                {bomItems.length}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />



            {bom.updated_at && bom.updated_at !== bom.created_at && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Son Güncelleme
                </Typography>
                <Typography variant="body1">
                  {new Date(bom.updated_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Floating Action Button - Sil */}
      <Fab
        color="error"
        aria-label="delete"
        onClick={handleDelete}
        sx={{
          position: 'fixed',
          bottom: 80, // Bottom navigation için margin
          right: 20,
          zIndex: 1000
        }}
      >
        <DeleteIcon />
      </Fab>
    </Box>
  );
}

export default GrupDetayMobile;
