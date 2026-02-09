import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, CardActionArea, Chip, Grid,
  CircularProgress, TextField, InputAdornment, FormControlLabel, Switch,
  Badge, IconButton, AppBar, Toolbar, Divider, Avatar, Paper,
  Menu, MenuItem, ListItemIcon, ListItemText, Popover, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { parcalarAPI } from '../../services/api';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckIcon from '@mui/icons-material/Check';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import { Scanner } from '@yudiel/react-qr-scanner';
import ImageWithFallback from '../../components/ImageWithFallback';
import TeknikResimCameraModal from '../../components/TeknikResimCameraModal';
import { useNavigate } from 'react-router-dom';
import { getFotoPath, getTeknikResimPath, getFileType } from '../../utils/imageUtils';
import parcaTakipListeleriService from '../../services/parcaTakipListeleriService';

function ParcalarMobile() {
  const [parcalar, setParcalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Gerçek arama terimi (API'ye gönderilecek)
  const [searchInput, setSearchInput] = useState(''); // Kullanıcının girdiği metin
  const [imalMiFiltre, setImalMiFiltre] = useState(false);
  const [kritikStokFiltre, setKritikStokFiltre] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();
  const lastElementRef = useRef(null);
  const observer = useRef(null);
  const searchTimeoutRef = useRef(null); // Debounce için timeout ref'i
  
  // Parça Takip Listesi filtreleme state'leri
  const [takipListeleri, setTakipListeleri] = useState([]);
  const [seciliTakipListesiId, setSeciliTakipListesiId] = useState('');
  const [listMenuAnchor, setListMenuAnchor] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  
  // Teknik resim kamera modal için state
  const [teknikResimModalOpen, setTeknikResimModalOpen] = useState(false);

  // QR kod okuyucu modal için state
  const [qrScannerModalOpen, setQrScannerModalOpen] = useState(false);
  
  // Stok durumuna göre renk ve etiket belirleme
  const getStokDurumu = (miktar, kritikStok) => {
    if (miktar === 0) return { color: 'error', label: 'Stokta Yok' };
    if (miktar <= kritikStok) return { color: 'warning', label: 'Az Stok' };
    return { color: 'success', label: 'Stokta Var' };
  };

  // Teknik resim modal callback'leri
  const handlePartFound = (partData) => {
    console.log('Parça bulundu:', partData);
    // Modal zaten navigate edecek, ek işlem gerekmiyor
  };

  const handlePartCreate = (formData, imageData) => {
    console.log('Yeni parça oluşturuluyor:', formData);
    // Mobile'de yeni parça sayfasına yönlendir
    navigate('/mobile/parcalar/yeni');
  };

  // QR kod okunduğunda çalışacak fonksiyon
  const handleQRCodeScan = (result) => {
    try {
      console.log('QR kod okundu:', result);

      // QR kod içeriğini parse et
      let qrData;
      if (typeof result === 'string') {
        qrData = JSON.parse(result);
      } else {
        qrData = result;
      }

      // Parça kodunu al
      const parcaKodu = qrData.parcaKodu;

      if (parcaKodu) {
        // QR okuyucu modal'ını kapat
        setQrScannerModalOpen(false);

        // Parça detay sayfasına yönlendir
        navigate(`/mobile/parcalar/${parcaKodu}`);
      } else {
        console.error('QR kodunda parça kodu bulunamadı');
        // Hata mesajı gösterilebilir
      }
    } catch (error) {
      console.error('QR kod parse hatası:', error);
      // Hata mesajı gösterilebilir
    }
  };
  
  // We've moved the image path utility functions to a common module

  // Parçaları getir - Sayfalama ve lazy loading ile
  const fetchParcalar = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params = {
        page: pageNum,
        limit: 20, // Her sayfada 20 parça yükle
        sortBy: sortBy,
        sortOrder: sortOrder
      };
      
      if (searchTerm) params.aramaMetni = searchTerm;
      if (imalMiFiltre !== false) params.imalMi = imalMiFiltre;
      if (kritikStokFiltre !== false) params.kritikStok = true;
      if (seciliTakipListesiId) params.parca_takip_listesi_id = seciliTakipListesiId;
      
      const response = await parcalarAPI.getAll(params);
      
      let yeniParcalar = [];
      let totalCount = 0;
      let currentPage = 1;
      let totalPages = 1;
      
      if (Array.isArray(response.data)) {
        yeniParcalar = response.data;
        totalCount = response.data.length;
      } else if (response.data && typeof response.data === 'object') {
        yeniParcalar = response.data.parcalar || [];
        totalCount = response.data.toplam || 0;
        currentPage = response.data.sayfa || 1;
        totalPages = response.data.sayfaSayisi || 1;
      }
      
      if (reset || pageNum === 1) {
        setParcalar(yeniParcalar);
      } else {
        setParcalar(prev => [...prev, ...yeniParcalar]);
      }
      
      // Daha fazla sayfa var mı kontrol et
      setHasMore(currentPage < totalPages);
      
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      console.error('Parça bilgileri alınamadı:', err);
      setError('Parçalar yüklenirken bir hata oluştu.');
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Daha fazla parça yükle (infinite scroll için)
  const loadMoreParcalar = async () => {
    if (!hasMore || loadingMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchParcalar(nextPage, false);
  };
  
  // Intersection Observer callback
  const lastElementRefCallback = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreParcalar();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadingMore]);
  
  // Debounce effect - searchInput değiştiğinde 800ms bekle, sonra searchTerm'i güncelle
  useEffect(() => {
    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Yeni timeout ayarla
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 800); // 800ms debounce süresi
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);
  
  // İlk yükleme ve filtre değişikliklerinde çağrılır
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchParcalar(1, true);
  }, [searchTerm, imalMiFiltre, kritikStokFiltre, seciliTakipListesiId, sortBy, sortOrder]);

  // Parça Takip Listesi menüsü işlemleri
  const handleOpenListMenu = async (event) => {
    setListMenuAnchor(event.currentTarget);
    if (!takipListeleri || takipListeleri.length === 0) {
      try {
        setListLoading(true);
        const data = await parcaTakipListeleriService.list();
        setTakipListeleri(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Takip listeleri yüklenemedi:', e);
        setTakipListeleri([]);
      } finally {
        setListLoading(false);
      }
    }
  };
  const handleCloseListMenu = () => setListMenuAnchor(null);
  const handleSelectList = (id) => {
    setSeciliTakipListesiId(id);
    handleCloseListMenu();
  };
  
  
  // Parça detayına gitme
  const handleParcaClick = (parcaKodu) => {
    navigate(`/mobile/parcalar/${encodeURIComponent(parcaKodu)}`);
  };
  
  // Sıralama menüsü işlemleri
  const handleOpenSortMenu = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleCloseSortMenu = () => {
    setSortMenuAnchor(null);
  };

  // Sıralama seçeneği değiştiğinde
  const handleSortChange = (field) => {
    // Eğer aynı alana göre sıralama yapılıyorsa sıralama yönünü değiştir
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Yeni bir alan seçildiğinde varsayılan olarak artan sıralama
      setSortBy(field);
      setSortOrder('asc');
    }
    handleCloseSortMenu();
  };

  // Sıralama seçenekleri için etiketler
  const getSortLabel = (field) => {
    switch (field) {
      case 'parcaKodu': return 'Parça Kodu';
      case 'parcaAdi': return 'Parça Adı';
      case 'stokAdeti': return 'Stok Miktarı';
      case 'tedarikBedeli': return 'Tedarik Bedeli';
      case 'createdAt': return 'Oluşturulma Tarihi';
      default: return field;
    }
  };
  
  // Hata gösterme
  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  // Yükleme gösterme
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ pb: 10 }}>
      {/* Sticky Header with Search and Filters */}
      <AppBar position="sticky" color="default" elevation={1} sx={{ mb: 2 }}>
        <Toolbar sx={{ flexDirection: 'column', p: 1 }}>
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Parçalar
            </Typography>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setQrScannerModalOpen(true)}
              sx={{ mr: 1 }}
              aria-label="QR Kod Tara"
            >
              <QrCodeScannerIcon />
            </IconButton>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setTeknikResimModalOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Teknik resim çek"
            >
              <CameraAltIcon />
            </IconButton>
            <IconButton 
              size="small" 
              color="primary" 
              onClick={() => navigate('/mobile/parcalar/yeni')}
              sx={{ mr: 1 }}
              aria-label="Yeni parça ekle"
            >
              <Badge color="secondary" variant="dot">
                <Box component="span" sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>+</Box>
              </Badge>
            </IconButton>
            <IconButton 
              size="small" 
              color={seciliTakipListesiId ? 'secondary' : 'primary'}
              onClick={handleOpenListMenu}
              aria-label="Parça takip listesi filtresi"
              sx={{ mr: 1, position: 'relative' }}
            >
              <ListAltIcon />
              {seciliTakipListesiId && (
                <Box 
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'secondary.main',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: 4,
                    right: 4
                  }}
                />
              )}
            </IconButton>
            <IconButton 
              size="small" 
              color="primary"
              onClick={handleOpenSortMenu}
              aria-label="Sıralama seçenekleri"
              sx={{
                position: 'relative',
                ...(sortBy !== 'createdAt' || sortOrder !== 'desc' ? { 
                  bgcolor: 'rgba(25, 118, 210, 0.08)' 
                } : {})
              }}
            >
              <SortIcon />
              {(sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                <Box 
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: 4,
                    right: 4
                  }}
                />
              )}
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Parça kodu veya adı ara..."
            value={searchInput} // searchInput kullan
            onChange={(e) => setSearchInput(e.target.value)} // searchInput'u güncelle
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            variant="outlined"
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={imalMiFiltre}
                  onChange={(e) => setImalMiFiltre(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Sadece İmal</Typography>}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={kritikStokFiltre}
                  onChange={(e) => setKritikStokFiltre(e.target.checked)}
                  color="error"
                  size="small"
                />
              }
              label={<Typography variant="body2">Kritik Stok</Typography>}
            />
          </Box>
          {seciliTakipListesiId && (
            <Box sx={{ width: '100%', mt: 1 }}>
              {(() => {
                const secili = (takipListeleri || []).find(l => String(l.id) === String(seciliTakipListesiId));
                return (
                  <Chip 
                    label={`Liste: ${secili?.ad || seciliTakipListesiId}`}
                    onDelete={() => setSeciliTakipListesiId('')}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                );
              })()}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      {/* Parça Takip Listesi Seçim Menüsü */}
      <Menu
        anchorEl={listMenuAnchor}
        open={Boolean(listMenuAnchor)}
        onClose={handleCloseListMenu}
        PaperProps={{ elevation: 1, sx: { width: 260, borderRadius: 1, mt: 1 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <ListAltIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Takip Listesi Filtresi
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Listeden parça filtrele
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleSelectList('')}>
          <ListItemText primary="Tümü (filtre yok)" />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        {listLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {!listLoading && (takipListeleri || []).map((liste) => (
          <MenuItem key={liste.id} onClick={() => handleSelectList(liste.id)} sx={{ justifyContent: 'space-between' }}>
            <ListItemText primary={liste.ad} secondary={Array.isArray(liste.kalemler) ? `${liste.kalemler.length} kalem` : ''} />
            {String(seciliTakipListesiId) === String(liste.id) && (
              <CheckIcon fontSize="small" color="primary" />
            )}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Sıralama Menüsü - Yeni Tasarım */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleCloseSortMenu}
        PaperProps={{
          elevation: 1,
          sx: { 
            width: 220, 
            borderRadius: 1,
            mt: 1,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            },
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <SortIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Sıralama Seçenekleri
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Varsayılan: En son eklenenler başta
          </Typography>
        </Box>
        
        <Divider sx={{ my: 0.5 }} />
        
        {/* Sıralama seçenekleri */}
        {['createdAt', 'parcaKodu', 'parcaAdi', 'stokAdeti', 'tedarikBedeli'].map((field) => (
          <MenuItem 
            key={field} 
            onClick={() => handleSortChange(field)}
            sx={{ 
              justifyContent: 'space-between',
              ...(sortBy === field && { fontWeight: 'medium' })
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {sortBy === field && (
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon fontSize="small" color="primary" />
                </ListItemIcon>
              )}
              <ListItemText 
                primary={getSortLabel(field)}
                primaryTypographyProps={{
                  ...(sortBy === field && { color: 'primary.main' })
                }}
              />
            </Box>
            
            {/* Sıralama yönü simgesi */}
            {sortBy === field && (
              <Box component="span">
                {sortOrder === 'asc' ? (
                  <ArrowUpwardIcon fontSize="small" color="primary" />
                ) : (
                  <ArrowDownwardIcon fontSize="small" color="primary" />
                )}
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
      
      {/* Parçalar Listesi - Yeni Tasarım */}
      <Box sx={{ px: 1 }}>
        {parcalar.map((parca, index) => {
          const stokDurumu = getStokDurumu(parca.stokAdeti || parca.stok_adeti, parca.kritik_stok);
          const parcaKodu = parca.parcaKodu || parca.parca_kodu;
          const resimYolu = getFotoPath(parca.foto_path);
          const teknikResimYolu = getTeknikResimPath(parca.teknik_resim_path);
          const isLastElement = index === parcalar.length - 1;
          
          return (
            <Card 
              key={parcaKodu || parca.id} 
              ref={isLastElement ? lastElementRefCallback : null}
              sx={{ 
                mb: 2, 
                overflow: 'hidden',
                position: 'relative',
                ...(stokDurumu.color === 'error' && { 
                  borderLeft: '4px solid #f44336' 
                })
              }}
            >
              <CardActionArea onClick={() => handleParcaClick(parcaKodu || parca.id)}>
                <Box sx={{ p: 1.5 }}>
                  {/* Üst kısım - Parça bilgileri */}
                  <Box sx={{ mb: 2 }}>
                    {/* Parça kodu ve stok durumu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold', 
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {parcaKodu || "Kod Belirtilmemiş"}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mt: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {parca.parcaAdi || parca.parca_adi || ""}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={stokDurumu.label} 
                        color={stokDurumu.color}
                        size="small"
                        sx={{ 
                          height: 24,
                          flexShrink: 0
                        }}
                      />
                    </Box>
                    
                    {/* Stok bilgileri */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                      <InventoryIcon fontSize="small" color="action" sx={{ mr: 0.5, flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight="medium" sx={{ flexShrink: 0 }}>
                        {parca.stokAdeti || parca.stok_adeti || 0} adet
                      </Typography>
                      
                      {((parca.stokAdeti <= parca.kritik_stok && parca.kritik_stok > 0) ||
                        (parca.stok_adeti <= parca.kritik_stok && parca.kritik_stok > 0)) && (
                        <Typography 
                          variant="caption" 
                          color="error.main" 
                          sx={{ 
                            ml: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          (Kritik: {parca.kritik_stok})
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Özellik etiketleri */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 0.5, 
                      mt: 1
                    }}>
                      {(parca.imalMi || parca.imal_mi) && (
                        <Chip 
                          label="İmal" 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                        />
                      )}
                      
                      {parca.hamMalzemeCinsi && (
                        <Chip 
                          label={parca.hamMalzemeCinsi} 
                          size="small" 
                          variant="outlined"
                          sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Alt kısım - Resimler */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 150,
                        height: 150,
                        position: 'relative'
                      }}
                    >
                      {resimYolu ? (
                        <ImageWithFallback
                          src={resimYolu}
                          alt={parca.parcaAdi || parca.parca_adi}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            background: '#f5f5f5',
                            border: '1px solid #eaeaea'
                          }}
                        />
                      ) : (
                        <Box 
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            bgcolor: '#f5f5f5', 
                            borderRadius: '8px',
                            border: '1px solid #eaeaea'
                          }}
                        >
                          <BuildIcon sx={{ color: '#bdbdbd', fontSize: '3rem' }} />
                        </Box>
                      )}
                      
                      {/* Teknik resim ikonu (varsa) */}
                      {teknikResimYolu && (
                        <Paper
                          elevation={2}
                          sx={{
                            position: 'absolute',
                            bottom: -8,
                            right: -8,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.paper'
                          }}
                        >
                          {(() => {
                            const fileType = getFileType(parca.teknik_resim_path);
                            switch (fileType) {
                              case 'pdf':
                                return <PictureAsPdfIcon color="primary" sx={{ fontSize: 20 }} />;
                              case 'image':
                                return <ImageIcon color="secondary" sx={{ fontSize: 20 }} />;
                              case 'cad':
                              case 'unknown':
                              default:
                                return <DesignServicesIcon color="info" sx={{ fontSize: 20 }} />;
                            }
                          })()}
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          );
        })}
        
        {/* Yükleniyor göstergesi - Daha fazla parça yüklenirken */}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {/* Daha fazla veri yok mesajı */}
        {!hasMore && parcalar.length > 0 && !loading && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Tüm parçalar yüklendi
            </Typography>
          </Box>
        )}
        
        {/* Sonuç bulunamadı mesajı */}
        {parcalar.length === 0 && !loading && (
          <Box sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Typography color="text.secondary">
              Aranan kriterlere uygun parça bulunamadı.
            </Typography>
          </Box>
        )}
        
        {/* İlk yüklenme göstergesi */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>

      {/* QR Kod Okuyucu Modal */}
      <Dialog
        open={qrScannerModalOpen}
        onClose={() => setQrScannerModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            m: 1,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" component="div">
            QR Kod Tara
          </Typography>
          <IconButton onClick={() => setQrScannerModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <Box sx={{
            width: '100%',
            height: '300px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1
          }}>
            <Scanner
              onScan={handleQRCodeScan}
              onError={(error) => console.error('QR Scanner Error:', error)}
              components={{
                audio: false,
                finder: true,
              }}
              styles={{
                container: {
                  width: '100%',
                  height: '100%',
                },
                video: {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }
              }}
            />
          </Box>

          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Parça QR kodunu kameraya gösterin
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Parça detay sayfasına yönlendirilmek için QR kodu taratın
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setQrScannerModalOpen(false)}
            variant="outlined"
          >
            İptal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teknik Resim Kamera Modal */}
      <TeknikResimCameraModal
        open={teknikResimModalOpen}
        onClose={() => setTeknikResimModalOpen(false)}
        onPartFound={handlePartFound}
        onPartCreate={handlePartCreate}
      />
    </Box>
  );
}

export default ParcalarMobile;
