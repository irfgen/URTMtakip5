import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Badge,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  Money as MoneyIcon,
  Timer as TimerIcon,
  Image as ImageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const MakinaGroupPartsList = ({ makinaId, onPartSelect, hesaplamalar }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(false);

  useEffect(() => {
    if (makinaId) {
      fetchMakinaGroupParts();
    }
  }, [makinaId]);

  const fetchMakinaGroupParts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/makina-group-parts/makina/${makinaId}/group-parts`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Veri alınamadı');
      }
    } catch (err) {
      console.error('Makina grup-parça listesi alınırken hata:', err);
      setError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (groupId) => (event, isExpanded) => {
    setExpandedGroup(isExpanded ? groupId : false);
  };

  const getStockStatusColor = (stokAdeti, kritikStok) => {
    if (stokAdeti <= 0) return 'error';
    if (stokAdeti <= kritikStok) return 'warning';
    return 'success';
  };

  const getStockStatusIcon = (stokAdeti, kritikStok) => {
    if (stokAdeti <= 0) return <WarningIcon />;
    if (stokAdeti <= kritikStok) return <WarningIcon />;
    return <CheckCircleIcon />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(amount || 0);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    // Eğer path zaten /uploads/ ile başlıyorsa, tekrar ekleme
    if (path.startsWith('/uploads/')) {
      return path;
    }
    return `/uploads/${path}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography ml={2}>Makina grup-parça listesi yükleniyor...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography>Hata: {error}</Typography>
        <Button onClick={fetchMakinaGroupParts} sx={{ mt: 1 }}>
          Tekrar Dene
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Veri bulunamadı
      </Alert>
    );
  }

  return (
    <Box>
      {/* Makina Bilgileri */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            {data.makina.name}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Model: {data.makina.model}
          </Typography>
          {data.makina.description && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
              {data.makina.description}
            </Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)' }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {data.toplam_grup_sayisi}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Toplam Grup
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)' }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {data.toplam_parca_sayisi}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Toplam Parça
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gruplar ve Parçalar */}
      {data.gruplar.map((grup) => (
        <Accordion
          key={grup.group_id}
          expanded={expandedGroup === grup.group_id}
          onChange={handleAccordionChange(grup.group_id)}
          sx={{ mb: 2, boxShadow: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <CategoryIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold">
                  {grup.group_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {grup.group_path}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Badge badgeContent={grup.parts.length} color="primary">
                  <Chip
                    label={`${grup.parts.length} Parça`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Badge>
                {grup.sub_groups.length > 0 && (
                  <Chip
                    label={`${grup.sub_groups.length} Alt Grup`}
                    color="secondary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {grup.group_description && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">{grup.group_description}</Typography>
              </Alert>
            )}

            {/* Alt Gruplar */}
            {grup.sub_groups.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  Alt Gruplar
                </Typography>
                <Grid container spacing={1}>
                  {grup.sub_groups.map((subGroup) => (
                    <Grid item key={subGroup.sub_group_id}>
                      <Chip
                        label={`${subGroup.sub_group_name} (${subGroup.sub_group_quantity})`}
                        color="secondary"
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            {/* Parçalar */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Parçalar ({grup.parts.length})
            </Typography>
            <List>
              {grup.parts.map((parca, index) => (
                <React.Fragment key={parca.parca_kodu}>
                  <ListItem
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      mb: 1,
                      cursor: onPartSelect ? 'pointer' : 'default',
                      '&:hover': onPartSelect ? {
                        backgroundColor: 'action.hover',
                        boxShadow: 2
                      } : {}
                    }}
                    onClick={() => onPartSelect && onPartSelect(parca)}
                  >
                    <ListItemAvatar>
                      {parca.foto_path ? (
                        <Tooltip
                          title={
                            <Box sx={{ p: 1 }}>
                              <img
                                src={getImageUrl(parca.foto_path)}
                                alt={parca.parca_adi}
                                style={{
                                  maxWidth: '300px',
                                  maxHeight: '300px',
                                  objectFit: 'contain',
                                  borderRadius: '8px'
                                }}
                              />
                              <Typography variant="subtitle2" sx={{ mt: 1, color: 'white', textAlign: 'center' }}>
                                {parca.parca_adi}
                              </Typography>
                            </Box>
                          }
                          placement="right"
                          arrow
                          componentsProps={{
                            tooltip: {
                              sx: {
                                bgcolor: 'rgba(0, 0, 0, 0.9)',
                                maxWidth: 'none',
                                p: 1
                              }
                            }
                          }}
                        >
                          <Avatar
                            src={getImageUrl(parca.foto_path)}
                            alt={parca.parca_adi}
                            sx={{ 
                              width: 150, 
                              height: 150,
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: 3
                              }
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Avatar sx={{ width: 150, height: 150, bgcolor: 'primary.main' }}>
                          <InventoryIcon sx={{ fontSize: 75 }} />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    {/* Custom content without ListItemText to avoid DOM nesting issues */}
                    <Box sx={{ flex: 1, ml: 2 }}>
                      {/* Primary content */}
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {parca.parca_kodu}
                        </Typography>
                        <Chip
                          icon={getStockStatusIcon(parca.stok_adeti, parca.kritik_stok)}
                          label={`Stok: ${parca.stok_adeti}`}
                          color={getStockStatusColor(parca.stok_adeti, parca.kritik_stok)}
                          size="small"
                        />
                        <Chip
                          label={`Adet: ${parca.quantity_in_group}`}
                          color="default"
                          size="small"
                        />
                      </Box>
                      
                      {/* Secondary content */}
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {parca.parca_adi}
                      </Typography>
                      
                      {/* Kategori ve üretim tipi chipları */}
                      {(parca.kategori || parca.imal_mi !== null) && (
                        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {parca.kategori && (
                            <Chip
                              label={parca.kategori}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {parca.imal_mi !== null && (
                            <Chip
                              label={parca.imal_mi ? 'İmal' : 'Satın Al'}
                              size="small"
                              color={parca.imal_mi ? 'primary' : 'secondary'}
                            />
                          )}
                        </Box>
                      )}
                      
                      {/* Teknik bilgiler */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <MoneyIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          Tedarik: {formatCurrency(parca.tedarik_bedeli)}
                        </Typography>
                        {parca.setup_sayisi && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <BuildIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            Setup: {parca.setup_sayisi}
                          </Typography>
                        )}
                        {parca.cnc_isleme_suresi && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimerIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            CNC: {parca.cnc_isleme_suresi} dk
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Üretim hesaplaması */}
                      {hesaplamalar && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          bgcolor: 'primary.light', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'primary.main'
                        }}>
                          <Typography variant="caption" color="primary.contrastText" sx={{ fontWeight: 'bold', display: 'block' }}>
                            Üretim İçin Gerekli Adet
                          </Typography>
                          <Typography variant="body2" color="primary.contrastText" sx={{ fontWeight: 'bold' }}>
                            {(parca.adet * hesaplamalar.planlananAdet).toLocaleString('tr-TR')} adet
                          </Typography>
                          <Typography variant="caption" color="primary.contrastText" sx={{ opacity: 0.8 }}>
                            ({parca.adet} × {hesaplamalar.planlananAdet})
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Ham malzeme bilgisi */}
                      {parca.ham_malzeme_cinsi && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Malzeme: {parca.ham_malzeme_cinsi}
                          {parca.ham_malzeme_olculeri && ` - ${parca.ham_malzeme_olculeri}`}
                        </Typography>
                      )}
                      
                      {/* Grup yolu */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Yol: {parca.part_path}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {parca.teknik_resim_path && (
                        <Tooltip title="Teknik Resim Mevcut">
                          <IconButton size="small" color="primary">
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={`Kritik Stok: ${parca.kritik_stok}`}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  {index < grup.parts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default MakinaGroupPartsList;
