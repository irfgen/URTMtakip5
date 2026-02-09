import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  Chip,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  ViewList as ViewListIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ZoomOutMap as ZoomOutMapIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import isoWeek from 'dayjs/plugin/isoWeek';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

dayjs.extend(isoWeek);
dayjs.locale('tr');

// Vardiya tanımları
const VARDIYALAR = [
  { id: 'gunduz', name: 'Gündüz', basZaman: '08:00', bitisZaman: '20:00', color: '#E3F2FD' },
  { id: 'gece', name: 'Gece', basZaman: '20:00', bitisZaman: '08:00', color: '#F3E5F5' }
];

// Zaman çizelgesi hesaplamaları
const generateTimelineData = (baslangicTarihi, gunSayisi = 28) => {
  const timeline = [];
  const baslangic = dayjs(baslangicTarihi);
  
  for (let gun = 0; gun < gunSayisi; gun++) {
    const tarih = baslangic.add(gun, 'day');
    VARDIYALAR.forEach(vardiya => {
      timeline.push({
        id: `${tarih.format('YYYY-MM-DD')}_${vardiya.id}`,
        tarih: tarih,
        vardiya: vardiya,
        gunIndex: gun,
        vardiyaIndex: VARDIYALAR.findIndex(v => v.id === vardiya.id),
        absoluteIndex: gun * 2 + VARDIYALAR.findIndex(v => v.id === vardiya.id),
        label: `${tarih.format('DD/MM')} ${vardiya.name}`,
        shortLabel: `${tarih.format('DD')}${vardiya.name.charAt(0)}`
      });
    });
  }
  
  return timeline;
};

// İş emri pozisyon hesaplama
const calculateWorkOrderPosition = (isEmri, baslangicTarihi, timeline) => {
  // Eğer iş emrinin başlangıç tarihi yoksa veya timeline yoksa başlangıç pozisyonu
  if (!isEmri.baslangic_tarihi || !timeline || timeline.length === 0) {
    return 0;
  }
  
  const isEmriTarihi = dayjs(isEmri.baslangic_tarihi);
  const baslangic = dayjs(baslangicTarihi);
  
  // İş emrinin timeline başlangıcından kaç gün sonra olduğunu hesapla
  const gunFarki = isEmriTarihi.diff(baslangic, 'day');
  
  // Negatif veya çok büyük değerler için sınırlama
  if (gunFarki < 0) return 0;
  if (gunFarki >= timeline.length / 2) return timeline.length / 2 - 1;
  
  // Varsayılan olarak gündüz vardiyası (0)
  let vardiyaIndex = 0;

  // Saat bilgisi varsa vardiyayı belirle
  const saat = isEmriTarihi.hour();
  if (saat >= 20 || saat < 8) vardiyaIndex = 1; // Gece vardiyası (20:00-08:00)

  // Pozisyon hesapla (gün * 2 vardiya + vardiya indexi)
  return gunFarki * 2 + vardiyaIndex;
};

// Çakışma kontrolü ve çözümü
const resolveCollisions = (isEmirleri, baslangicTarihi, timeline, gridSize = 1) => {
  if (!isEmirleri || isEmirleri.length === 0) return [];
  
  // İş emirlerini pozisyonlarıyla birlikte hesapla
  const workOrdersWithPositions = isEmirleri.map(isEmri => ({
    ...isEmri,
    position: snapToGrid(calculateWorkOrderPosition(isEmri, baslangicTarihi, timeline), gridSize),
    duration: isEmri.tahmini_isleme_suresi || 1
  }));
  
  // Pozisyona göre sırala
  workOrdersWithPositions.sort((a, b) => a.position - b.position);
  
  // Çakışma çözümü
  for (let i = 1; i < workOrdersWithPositions.length; i++) {
    const current = workOrdersWithPositions[i];
    const previous = workOrdersWithPositions[i - 1];
    
    // Önceki iş emrinin bitiş pozisyonu
    const previousEnd = previous.position + previous.duration;
    
    // Çakışma kontrolü
    if (current.position < previousEnd) {
      // Çakışan iş emrini bir sonraki uygun pozisyona taşı ve grid'e snap yap
      current.position = snapToGrid(previousEnd, gridSize);
    }
  }
  
  return workOrdersWithPositions;
};

// Grid snap özelliği
const snapToGrid = (position, gridSize = 1) => {
  return Math.round(position / gridSize) * gridSize;
};

// Grid snap ile pozisyon hesaplama
const calculateSnappedPosition = (isEmri, baslangicTarihi, timeline, gridSize = 1) => {
  const rawPosition = calculateWorkOrderPosition(isEmri, baslangicTarihi, timeline);
  return snapToGrid(rawPosition, gridSize);
};

// Timeline Header Komponenti - Optimized with React.memo
const TimelineHeader = React.memo(({ baslangicTarihi, gunSayisi, columnWidth = 120, zoomLevel = 1, panOffset = 0, isDragging = false, onWheel, onMouseDown, onMouseMove, onMouseUp, onTouchStart, onTouchMove, onTouchEnd }) => {
  const timeline = generateTimelineData(baslangicTarihi, gunSayisi);
  const scaledColumnWidth = columnWidth * zoomLevel;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      borderBottom: '1px solid #ddd',
      backgroundColor: '#f5f5f5',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* İstasyon başlık alanı */}
      <Box sx={{ 
        minWidth: 150, 
        padding: 1,
        borderRight: '1px solid #ddd',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
      }}>
        İstasyonlar
      </Box>
      
      {/* Timeline sütunları */}
      <Box 
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          transform: `translateX(${panOffset}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {timeline.map(item => (
          <Box
            key={item.id}
            sx={{
              minWidth: scaledColumnWidth,
              width: scaledColumnWidth,
              padding: 1,
              borderRight: '1px solid #ddd',
              backgroundColor: item.vardiya.color,
              textAlign: 'center',
              fontSize: '0.75rem',
              flexShrink: 0
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {item.tarih.format('DD/MM')}
            </Typography>
            <br />
            <Typography variant="caption">
              {item.vardiya.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

// İstasyon renkleri ve tanımları
const ISTASYONLAR = {
  'BEKLEMEDE': 'Beklemede',
  'TORNALAR': 'Tornalar', 
  'FREZELER': 'Frezeler',
  '3_METRE': '3 Metre',
  '5_METRE': '5 Metre',
  '6_METRE': '6 Metre',
  '8_METRE': '8 Metre'
};

const ISTASYON_RENKLERI = {
  'BEKLEMEDE': '#FFF3CD',
  'TORNALAR': '#D4E6F1',  
  'FREZELER': '#D5F4E6',
  '3_METRE': '#F8D7DA',
  '5_METRE': '#F8D7DA',
  '6_METRE': '#F8D7DA',
  '8_METRE': '#F8D7DA'
};

// İş Emri Kartı Komponenti (Timeline için güncellenmiş)
const IsEmriKarti = React.memo(({ isEmri, onClick, onContextMenu, timelineMode = false, position = 0, columnWidth = 120, index = 0, isDragDisabled = false, getParcaBilgileriWithCache }) => {
  const [parcaBilgileri, setParcaBilgileri] = useState(null);

  // Fotoğraf yolu için yardımcı fonksiyon
  const getFotoPath = (foto_path) => {
    if (!foto_path) return '';
    if (foto_path.includes('://')) return foto_path;
    if (foto_path.startsWith('/uploads/')) return foto_path;
    if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
    if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
    return '/uploads/fotograflar/' + foto_path;
  };

  // Parça bilgilerini cache ile yükle
  useEffect(() => {
    if (isEmri && (isEmri.parca_kodu || isEmri.is_adi) && getParcaBilgileriWithCache) {
      const searchTerm = isEmri.parca_kodu || isEmri.is_adi;

      getParcaBilgileriWithCache(searchTerm).then(result => {
        setParcaBilgileri(result);
      });
    }
  }, [isEmri, getParcaBilgileriWithCache]);

  // Dinamik genişlik hesaplama
  let kartGenisligi;
  
  if (timelineMode) {
    // Timeline modunda tahmini süreye göre vardiya sayısı kadar genişlik
    kartGenisligi = columnWidth * (isEmri.tahmini_isleme_suresi || 1);
  } else {
    // Normal modda temel genişlik + ekstra
    kartGenisligi = 120 + (isEmri.tahmini_isleme_suresi - 1) * 40;
  }

  const kartStyle = {
    width: `${kartGenisligi}px`,
    minHeight: timelineMode ? 80 : 100, // Timeline'da 80px, liste görünümünde 100px
    p: 1,
    cursor: 'pointer',
    bgcolor: ISTASYON_RENKLERI[isEmri.istasyon] || '#FFFFFF',
    border: '1px solid #ddd',
    borderRadius: 2,
    '&:hover': {
      boxShadow: 3,
      transform: 'scale(1.02)',
      transition: 'all 0.2s ease-in-out'
    }
  };

  // Timeline modunda pozisyon ekleme
  if (timelineMode && position > 0) {
    kartStyle.marginLeft = `${position * columnWidth}px`;
  }

  if (!timelineMode) {
    kartStyle.m = 0.5;
  }

  return (
    <Draggable 
      draggableId={`work-order-${isEmri.id}`} 
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <Paper 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            ...kartStyle,
            opacity: snapshot.isDragging ? 0.8 : 1,
            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
            zIndex: snapshot.isDragging ? 1000 : 1,
          }} 
          onClick={() => onClick && onClick(isEmri)}
          onContextMenu={(e) => onContextMenu && onContextMenu(e, isEmri)}
        >
          <Box sx={{ display: 'flex', height: '100%', gap: 1 }}>
            {/* Sol taraf - Parça fotoğrafı */}
            {parcaBilgileri && parcaBilgileri.foto_path && (
              <Box sx={{
                width: timelineMode ? 50 : 60,
                height: timelineMode ? 50 : 60,
                flexShrink: 0,
                alignSelf: 'center'
              }}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      opacity: 0.8,
                      boxShadow: 1
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(getFotoPath(parcaBilgileri.foto_path), '_blank');
                  }}
                >
                  <img
                    src={getFotoPath(parcaBilgileri.foto_path)}
                    alt={isEmri.is_adi}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="color: #999; font-size: 0.7rem; text-align: center;">Resim<br/>yok</div>';
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Sağ taraf - İş emri bilgileri */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0 // Bu önemli - flex child'da text overflow için gerekli
            }}>
              {/* İş Emri Numarası */}
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                #{isEmri.is_emri_no}
              </Typography>

              {/* İş Adı */}
              <Typography variant="caption" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                lineHeight: 1.2
              }}>
                {isEmri.is_adi}
              </Typography>

              {/* Parça Kodu */}
              {isEmri.parca_kodu && (
                <Typography variant="caption" sx={{
                  fontSize: '0.6rem',
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.1
                }}>
                  {isEmri.parca_kodu}
                </Typography>
              )}

              {/* Alt Bilgiler */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 'auto' // Bu alt bilgileri alta yapıştırır
              }}>
                <Chip
                  label={`${isEmri.adet} adet`}
                  size="small"
                  sx={{ fontSize: '0.6rem', height: 16 }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                  {isEmri.tahmini_isleme_suresi}v
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </Draggable>
  );
});

// Timeline İstasyon Satırı Komponenti
const TimelineIstasyonSatiri = ({ istasyonKey, istasyonAdi, isEmirleri, onIsEmriClick, onContextMenu, baslangicTarihi, gunSayisi, columnWidth = 120, zoomLevel = 1, panOffset = 0, getParcaBilgileriWithCache }) => {
  const timeline = generateTimelineData(baslangicTarihi, gunSayisi);
  const scaledColumnWidth = columnWidth * zoomLevel;

  return (
    <Box sx={{ 
      display: 'flex', 
      borderBottom: '1px solid #ddd',
      minHeight: 80,
      '&:hover': { backgroundColor: '#f9f9f9' }
    }}>
      {/* İstasyon Başlığı */}
      <Box sx={{ 
        minWidth: 150, 
        borderRight: '1px solid #ddd',
        bgcolor: ISTASYON_RENKLERI[istasyonKey],
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1
      }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {istasyonAdi}
        </Typography>
        <Typography variant="caption">
          {isEmirleri.length} iş
        </Typography>
      </Box>
      
      {/* Timeline İçerik Alanı */}
      <Box sx={{ 
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minHeight: 80,
        overflowX: 'auto'
      }}>
        {/* Vardiya Grid Lines */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex',
          transform: `translateX(${panOffset}px)`
        }}>
          {timeline.map(item => (
            <Box
              key={item.id}
              sx={{
                minWidth: scaledColumnWidth,
                width: scaledColumnWidth,
                height: '100%',
                borderRight: '1px solid #eee',
                backgroundColor: item.vardiya.color,
                opacity: 0.3,
                flexShrink: 0
              }}
            />
          ))}
        </Box>
        
        {/* İş Emri Kartları */}
        <Droppable droppableId={`station-${istasyonKey}`} direction="horizontal">
          {(provided, snapshot) => (
            <Box 
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                minHeight: 60, 
                p: 1,
                backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.1)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
            >
              {isEmirleri.length > 0 ? (
                (() => {
                  // Çakışma çözümlü iş emirlerini hesapla
                  const resolvedWorkOrders = resolveCollisions(isEmirleri, baslangicTarihi, timeline);
                  
                  return resolvedWorkOrders.map((isEmri, index) => (
                    <IsEmriKarti
                      key={isEmri.id}
                      isEmri={isEmri}
                      onClick={onIsEmriClick}
                      onContextMenu={onContextMenu}
                      timelineMode={true}
                      position={isEmri.position}
                      columnWidth={columnWidth}
                      index={index}
                      getParcaBilgileriWithCache={getParcaBilgileriWithCache}
                    />
                  ));
                })()
              ) : (
                <Box sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }}>
                  Bu istasyonda iş emri bulunmuyor
                </Box>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Box>
  );
};

// İstasyon Satırı Komponenti (Normal Mod)
const IstasyonSatiri = ({ istasyonKey, istasyonAdi, isEmirleri, onIsEmriClick, onContextMenu, getParcaBilgileriWithCache }) => {
  return (
    <Paper sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* İstasyon Başlığı */}
        <Box sx={{ 
          minWidth: 150, 
          mr: 2,
          bgcolor: ISTASYON_RENKLERI[istasyonKey],
          p: 1,
          borderRadius: 1,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {istasyonAdi}
          </Typography>
          <Typography variant="caption">
            ({isEmirleri.length} iş emri)
          </Typography>
        </Box>
        
        {/* İş Emri Kartları */}
        <Droppable droppableId={`station-${istasyonKey}`}>
          {(provided, snapshot) => (
            <Box 
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ 
                flex: 1,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                minHeight: 80,
                border: `2px dashed ${snapshot.isDraggingOver ? '#1976d2' : '#ddd'}`,
                borderRadius: 1,
                p: 1,
                backgroundColor: snapshot.isDraggingOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {isEmirleri.length > 0 ? (
                isEmirleri.map((isEmri, index) => (
                  <IsEmriKarti
                    key={isEmri.id}
                    isEmri={isEmri}
                    onClick={onIsEmriClick}
                    onContextMenu={onContextMenu}
                    index={index}
                    getParcaBilgileriWithCache={getParcaBilgileriWithCache}
                  />
                ))
              ) : (
                <Box sx={{ 
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: 60,
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2">Bu istasyonda iş emri bulunmuyor</Typography>
                </Box>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    </Paper>
  );
};

// Ana Tezgah İş Planı Komponenti
const TezgahIsPlanı = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [istasyonData, setIstasyonData] = useState({});
  const [filtreMetni, setFiltreMetni] = useState('');
  const [durumFiltresi, setDurumFiltresi] = useState('');
  const [tarihFiltresi, setTarihFiltresi] = useState(null);

  // Parça bilgileri cache - API isteklerini azaltmak için
  const [parcaCache, setParcaCache] = useState({});
  const [parcaLoading, setParcaLoading] = useState({});
  
  // Timeline modu state'i
  const [timelineMode, setTimelineMode] = useState(true);
  const [baslangicTarihi, setBaslangicTarihi] = useState(dayjs());
  const [gunSayisi, setGunSayisi] = useState(28);
  const [columnWidth, setColumnWidth] = useState(120);
  
  // Zoom/Pan state'i
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  
  // Timeline reference for position calculation
  const timelineRef = useRef(null);
  
  // Drag position tracking
  const [dragPosition, setDragPosition] = useState(null);
  
  // Context menu state'i
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  
  // Modal state'i
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newDuration, setNewDuration] = useState(1);

  // Debounced parça bilgileri fetch fonksiyonu
  const debouncedParcaFetch = useCallback(
    (() => {
      const cache = new Map();
      const pending = new Map();

      return async (searchTerm) => {
        if (!searchTerm) return null;

        // Cache'te varsa direkt döndür
        if (cache.has(searchTerm)) {
          return cache.get(searchTerm);
        }

        // Zaten yükleniyor ise bekleyenleri ortaklaştır
        if (pending.has(searchTerm)) {
          return pending.get(searchTerm);
        }

        // Yeni bir promise oluştur ve pending'e ekle
        const promise = (async () => {
          try {
            // API çağrısı - limit parametresi ile sonuçları sınırla
            const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(searchTerm)}&limit=5`);
            let parcaData = [];

            if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
              parcaData = response.data.parcalar;
            } else if (Array.isArray(response.data)) {
              parcaData = response.data;
            }

            let result = null;
            if (parcaData.length > 0) {
              result = parcaData[0]; // İlk eşleşen parçayı al
            }

            // Cache'e ekle
            cache.set(searchTerm, result);

            // State cache'ini de güncelle (UI için)
            setParcaCache(prev => ({ ...prev, [searchTerm]: result }));

            // Pending'den kaldır
            pending.delete(searchTerm);
            setParcaLoading(prev => {
              const newLoading = { ...prev };
              delete newLoading[searchTerm];
              return newLoading;
            });

            return result;
          } catch (error) {
            console.error('Parça bilgileri alınamadı:', error);

            // Pending'den kaldır
            pending.delete(searchTerm);
            setParcaLoading(prev => {
              const newLoading = { ...prev };
              delete newLoading[searchTerm];
              return newLoading;
            });

            return null;
          }
        })();

        // Pending'e ekle
        pending.set(searchTerm, promise);
        setParcaLoading(prev => ({ ...prev, [searchTerm]: promise }));

        return promise;
      };
    })(),
    []
  );

  // Parça bilgilerini cache ile getiren fonksiyon (legacy wrapper)
  const getParcaBilgileriWithCache = useCallback(async (searchTerm) => {
    return debouncedParcaFetch(searchTerm);
  }, [debouncedParcaFetch]);

  // Cache temizleme fonksiyonu - bellek şişmesini önlemek için
  const clearParcaCache = useCallback(() => {
    setParcaCache({});
    setParcaLoading({});
    console.log('Parça cache temizlendi');
  }, []);

  // Periyodik cache temizleme (her 5 dakikada bir)
  useEffect(() => {
    const interval = setInterval(() => {
      // Cache'i tamamen temizle yerine çok büyükse temizle
      const cacheSize = Object.keys(parcaCache).length;
      if (cacheSize > 100) {
        clearParcaCache();
      }
    }, 5 * 60 * 1000); // 5 dakika

    return () => clearInterval(interval);
  }, [parcaCache, clearParcaCache]);

  // Veri yükleme - useCallback ile optimize
  const loadTezgahIsPlanimi = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Yeni veri yüklenirken parça cache'ini temizle
    setParcaCache({});
    setParcaLoading({});
    
    try {
      const params = {};
      if (filtreMetni) params.search = filtreMetni;
      if (durumFiltresi) params.durum = durumFiltresi;
      if (tarihFiltresi) params.baslangic_tarihi = tarihFiltresi.format('YYYY-MM-DD');

      const response = await axios.get('/api/tezgah-is-plani', { params });
      
      if (response.data && response.data.success) {
        setIstasyonData(response.data.data);
      } else {
        throw new Error('Beklenmedik API yanıtı');
      }
    } catch (err) {
      console.error('Tezgah iş planı yüklenirken hata:', err);
      setError(err.response?.data?.error || err.message || 'Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since no external dependencies

  // Sayfa yüklendiğinde veri çek
  useEffect(() => {
    loadTezgahIsPlanimi();
  }, [loadTezgahIsPlanimi]);

  // İş emri kartına tıklama
  const handleIsEmriClick = (isEmri) => {
    console.log('İş emri tıklandı:', isEmri);
    // TODO: İş emri detay modalı aç
  };
  
  // Filtrelenmiş ve optimize edilmiş istasyon verisi
  const filteredIstasyonData = useMemo(() => {
    if (!istasyonData) return {};
    
    // Eğer filtre yoksa original veriyi döndür
    if (!filtreMetni && !durumFiltresi && !tarihFiltresi) {
      return istasyonData;
    }
    
    // Filtreleme işlemi
    const filtered = {};
    
    Object.entries(istasyonData).forEach(([istasyonKey, isEmirleri]) => {
      const filteredIsEmirleri = isEmirleri.filter(isEmri => {
        // Metin filtresi
        if (filtreMetni) {
          const searchText = filtreMetni.toLowerCase();
          const matchesText = 
            isEmri.is_emri_no.toLowerCase().includes(searchText) ||
            isEmri.is_adi?.toLowerCase().includes(searchText) ||
            isEmri.parca_kodu?.toLowerCase().includes(searchText);
          if (!matchesText) return false;
        }
        
        // Durum filtresi
        if (durumFiltresi && isEmri.durum !== durumFiltresi) {
          return false;
        }
        
        // Tarih filtresi
        if (tarihFiltresi) {
          const isEmriTarihi = dayjs(isEmri.teslim_tarihi);
          if (!isEmriTarihi.isSame(tarihFiltresi, 'day')) {
            return false;
          }
        }
        
        return true;
      });
      
      filtered[istasyonKey] = filteredIsEmirleri;
    });
    
    return filtered;
  }, [istasyonData, filtreMetni, durumFiltresi, tarihFiltresi]);

  // Context menu açma
  const handleContextMenu = (event, isEmri) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedWorkOrder(isEmri);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  };
  
  // Context menu kapatma
  const handleContextMenuClose = () => {
    setContextMenu(null);
    setSelectedWorkOrder(null);
  };
  
  // Tahmini süre düzenleme modalını aç
  const handleEditDuration = () => {
    if (selectedWorkOrder) {
      setNewDuration(selectedWorkOrder.tahmini_isleme_suresi || 1);
      setEditModalOpen(true);
    }
    handleContextMenuClose();
  };
  
  // Modal kapatma
  const handleModalClose = () => {
    setEditModalOpen(false);
    setNewDuration(1);
  };
  
  // Tahmini süre güncelleme
  const handleDurationUpdate = async () => {
    if (!selectedWorkOrder) return;

    try {
      console.log('Tahmini süre güncelleniyor:', { id: selectedWorkOrder.id, newDuration });

      const response = await axios.put(`/api/is-emirleri/${selectedWorkOrder.id}`, {
        tahmini_isleme_suresi: newDuration
      });

      console.log('API yanıtı:', response.data);

      // Backend'den gelen doğrudan veriyi kontrol et
      // Backend doğrudan güncellenmiş iş emri nesnesini döndürür
      if (response.data && response.data.tahmini_isleme_suresi === newDuration) {
        console.log('Tahmini süre başarıyla güncellendi');
        loadTezgahIsPlanimi(); // Veriyi yenile
        handleModalClose();
      } else {
        // Başka response formatı kontrolü
        console.warn('Beklenen yanıt formatı farklı, güncelleme kontrolü yapılıyor...');
        console.log('Beklenen:', newDuration);
        console.log('Gelen:', response.data?.tahmini_isleme_suresi);

        // API başarılı ise güncelleme yapıldı kabul et
        if (response.status === 200) {
          console.log('API başarılı, veri yenileniyor...');
          loadTezgahIsPlanimi();
          handleModalClose();
        } else {
          throw new Error(`API hatası: Status ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Tahmini süre güncellenirken hata:', error);

      // Daha kullanıcı dostu hata mesajı
      const errorMessage = error.response?.data?.error || error.message || 'Bilinmeyen hata';
      alert('Tahmini süre güncellenirken hata: ' + errorMessage);
    }
  };

  // Zoom/Pan işlemleri
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3)); // Max zoom 3x
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5)); // Min zoom 0.5x
  };
  
  const handleZoomReset = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };
  
  // Pan işlemleri
  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle click or Ctrl+Left click
      setIsDragging(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - lastPanPosition.x;
      setPanOffset(prev => prev + deltaX);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch gesture support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setIsDragging(true);
      setLastPanPosition({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    } else if (e.touches.length === 2) {
      // Multi-touch - zoom gesture preparation
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setLastPanPosition({ 
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance: distance
      });
    }
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      // Single touch - pan
      const deltaX = e.touches[0].clientX - lastPanPosition.x;
      setPanOffset(prev => prev + deltaX);
      setLastPanPosition({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
    } else if (e.touches.length === 2) {
      // Multi-touch - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastPanPosition.distance) {
        const scale = distance / lastPanPosition.distance;
        const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
        setZoomLevel(newZoom);
        
        setLastPanPosition(prev => ({ 
          ...prev, 
          distance: distance 
        }));
      }
    }
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    if (e.touches.length < 2) {
      setLastPanPosition(prev => ({ ...prev, distance: null }));
    }
  };
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    // Sadece timeline mode'da keyboard navigation aktif
    if (!timelineMode) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setPanOffset(prev => prev + 50); // Sola pan
        break;
      case 'ArrowRight':
        e.preventDefault();
        setPanOffset(prev => prev - 50); // Sağa pan
        break;
      case 'ArrowUp':
        e.preventDefault();
        setZoomLevel(prev => Math.min(3, prev * 1.1)); // Zoom in
        break;
      case 'ArrowDown':
        e.preventDefault();
        setZoomLevel(prev => Math.max(0.5, prev / 1.1)); // Zoom out
        break;
      case 'Home':
        e.preventDefault();
        setPanOffset(0); // Pan'i sıfırla
        break;
      case 'End':
        e.preventDefault();
        setZoomLevel(1); // Zoom'u sıfırla
        break;
      case 'Escape':
        e.preventDefault();
        setPanOffset(0);
        setZoomLevel(1); // Her şeyi sıfırla
        break;
      default:
        break;
    }
  }, [timelineMode]);

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      // Sadece input/textarea gibi elementlerde değilse keyboard navigation çalıştır
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        handleKeyDown(e);
      }
    };

    document.addEventListener('keydown', handleKeyDownGlobal);
    return () => document.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleKeyDown]);
  
  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  // Filtreleme
  const handleFiltreClear = () => {
    setFiltreMetni('');
    setDurumFiltresi('');
    setTarihFiltresi(null);
  };

  // Utility fonksiyonları - Horizontal pozisyon hesaplama
  const calculateHorizontalPosition = (mouseX, timelineRef) => {
    if (!timelineRef.current) return null;
    
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const relativeX = mouseX - timelineRect.left + panOffset;
    const scaledColumnWidth = 120 * zoomLevel;
    
    // Her bir vardiya sütununun genişliği
    const shiftWidth = scaledColumnWidth / 2; // 2 vardiya per day

    // Hangi vardiyaya denk geldiğini hesapla
    const shiftIndex = Math.floor(relativeX / shiftWidth);
    const dayIndex = Math.floor(shiftIndex / 2);
    const shiftInDay = shiftIndex % 2;

    // Başlangıç tarihinden itibaren hedef tarihi hesapla
    const targetDate = dayjs(baslangicTarihi).add(dayIndex, 'day');
    const shiftNames = ['Gündüz', 'Gece'];
    
    return {
      date: targetDate.format('YYYY-MM-DD'),
      shift: shiftNames[shiftInDay],
      dayIndex,
      shiftIndex: shiftInDay,
      absoluteShiftIndex: shiftIndex
    };
  };

  // Vardiya snap mekanizması
  const snapToShift = (position) => {
    const scaledColumnWidth = 120 * zoomLevel;
    const shiftWidth = scaledColumnWidth / 2;

    // En yakın vardiya pozisyonuna snap et
    const snappedShiftIndex = Math.round(position / shiftWidth);
    return snappedShiftIndex * shiftWidth;
  };

  // Çakışma kontrolü
  const checkCollision = (workOrderId, targetStation, targetDate, targetShift) => {
    if (!istasyonData[targetStation]) return false;
    
    return istasyonData[targetStation].some(wo => 
      wo.id !== parseInt(workOrderId) && 
      wo.baslangic_tarihi === targetDate && 
      wo.vardiya === targetShift
    );
  };

  // Drag event handlers
  const handleDragStart = () => {
    setDragPosition(null);
  };

  const handleDragUpdate = (result) => {
    // Mouse position tracking here if needed
    // Note: @hello-pangea/dnd doesn't provide mouse coords directly
  };

  // Drag & Drop handler with horizontal positioning
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    console.log('Drag end:', result);
    
    // Eğer drop destination yok ise hiçbir şey yapma
    if (!destination) {
      return;
    }
    
    // İş emri ID'sini extract et
    const workOrderId = draggableId.replace('work-order-', '');
    
    // Yeni ve eski istasyon key'lerini extract et
    const newStationKey = destination.droppableId.replace('station-', '');
    const oldStationKey = source.droppableId.replace('station-', '');
    
    let updateData = {
      yeni_istasyon: newStationKey,
      eski_istasyon: oldStationKey
    };

    // Şimdilik sadece istasyon değişikliği - horizontal drag için daha gelişmiş bir sistem gerekiyor
    console.log(`İş emri ${workOrderId}: ${oldStationKey} -> ${newStationKey} (istasyon değişikliği)`);
    
    // Aynı konuma drop edildiyse ve horizontal değişiklik yoksa hiçbir şey yapma
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index &&
      !updateData.baslangic_tarihi
    ) {
      return;
    }
    
    try {
      // Kapsamlı drag validation
      const validation = validateDrag(workOrderId, oldStationKey, newStationKey);
      if (!validation.valid) {
        console.warn('Drag validation failed:', validation.reason);
        alert(validation.reason); // Kullanıcıya hata mesajı göster
        return;
      }
      
      // Optimistic update - UI'ı hemen güncelle (sadece istasyon değişikliği için)
      if (oldStationKey !== newStationKey) {
        updateLocalWorkOrderStation(workOrderId, oldStationKey, newStationKey);
      }
      
      // API çağrısı
      const response = await axios.put(`/api/tezgah-is-plani/${workOrderId}`, updateData);
      
      if (response.data.success) {
        console.log('İş emri başarıyla güncellendi');
        // Veriyi yenile (horizontal değişiklik varsa mutlaka yenile)
        loadTezgahIsPlanimi();
      } else {
        throw new Error('API güncellemesi başarısız');
      }
    } catch (error) {
      console.error('İş emri güncellenirken hata:', error);
      // Hata durumunda original duruma dön
      loadTezgahIsPlanimi();
    }
  };
  
  // Drag validation kuralları
  const validateStationChange = (fromStation, toStation, workOrder = null) => {
    // Aynı istasyon ise her zaman izin ver
    if (fromStation === toStation) {
      return { valid: true, reason: null };
    }

    // BEKLEMEDE'den her yere geçiş izinli
    if (fromStation === 'BEKLEMEDE') {
      return { valid: true, reason: null };
    }

    // Her yerden BEKLEMEDE'ye geçiş izinli (iptal/durdurma için)
    if (toStation === 'BEKLEMEDE') {
      return { valid: true, reason: null };
    }

    // Tezgahlar arası geçiş kuralları
    const workflowRules = {
      'TORNALAR': ['FREZELER', '3_METRE', '5_METRE', '6_METRE', '8_METRE'], // Tornadan sonra frezelere veya ölçüme
      'FREZELER': ['3_METRE', '5_METRE', '6_METRE', '8_METRE'], // Frezeden sonra sadece ölçüme
      '3_METRE': [], // Ölçü tezgahları son durak
      '5_METRE': [],
      '6_METRE': [],
      '8_METRE': []
    };

    // İş akışı kuralı kontrolü
    if (workflowRules[fromStation] && !workflowRules[fromStation].includes(toStation)) {
      return { 
        valid: false, 
        reason: `${fromStation}'dan ${toStation}'ya direkt geçiş yapılamaz. İzin verilen hedefler: ${workflowRules[fromStation].join(', ')}`
      };
    }

    // İş emri durum kontrolü (eğer workOrder mevcutsa)
    if (workOrder) {
      // Tamamlanmış iş emirleri taşınamaz
      if (workOrder.durum === 'TAMAMLANDI') {
        return { valid: false, reason: 'Tamamlanmış iş emri taşınamaz' };
      }

      // İptal edilmiş iş emirleri sadece BEKLEMEDE'ye taşınabilir
      if (workOrder.durum === 'IPTAL' && toStation !== 'BEKLEMEDE') {
        return { valid: false, reason: 'İptal edilmiş iş emri sadece beklemede durabilir' };
      }
    }

    return { valid: true, reason: null };
  };

  // Kullanıcı yetki kontrolü (gelecekte role-based olabilir)
  const validateUserPermission = (action) => {
    // TODO: Kullanıcı rolleri ve yetkileri burada kontrol edilecek
    // Şimdilik tüm işlemlere izin ver
    return { valid: true, reason: null };
  };

  // Zaman aralığı validation'ı
  const validateTimeRange = (workOrder, targetDate) => {
    // İş emrinin teslim tarihi kontrolü
    if (workOrder.teslim_tarihi) {
      const deliveryDate = dayjs(workOrder.teslim_tarihi);
      const target = dayjs(targetDate);
      
      if (target.isAfter(deliveryDate)) {
        return { 
          valid: false, 
          reason: `Hedef tarih (${target.format('DD.MM.YYYY')}) teslim tarihinden (${deliveryDate.format('DD.MM.YYYY')}) sonra olamaz` 
        };
      }
    }

    // Geçmiş tarihe taşıma kontrolü
    const today = dayjs();
    const target = dayjs(targetDate);
    
    if (target.isBefore(today, 'day')) {
      return { 
        valid: false, 
        reason: 'İş emri geçmiş tarihe taşınamaz' 
      };
    }

    return { valid: true, reason: null };
  };

  // Kapsamlı drag validation
  const validateDrag = (workOrderId, fromStation, toStation, targetDate = null, targetShift = null) => {
    // İş emri bilgisini al
    const workOrder = Object.values(istasyonData)
      .flat()
      .find(wo => wo.id === parseInt(workOrderId));

    if (!workOrder) {
      return { valid: false, reason: 'İş emri bulunamadı' };
    }

    // İstasyon değişikliği kontrolü
    const stationValidation = validateStationChange(fromStation, toStation, workOrder);
    if (!stationValidation.valid) {
      return stationValidation;
    }

    // Kullanıcı yetki kontrolü
    const permissionValidation = validateUserPermission('move-work-order');
    if (!permissionValidation.valid) {
      return permissionValidation;
    }

    // Zaman aralığı kontrolü (eğer tarih belirtilmişse)
    if (targetDate) {
      const timeValidation = validateTimeRange(workOrder, targetDate);
      if (!timeValidation.valid) {
        return timeValidation;
      }
    }

    // Çakışma kontrolü (eğer tarih ve vardiya belirtilmişse)
    if (targetDate && targetShift) {
      const hasCollision = checkCollision(workOrderId, toStation, targetDate, targetShift);
      if (hasCollision) {
        return { 
          valid: false, 
          reason: `${targetDate} ${targetShift} vardiyasında ${toStation} istasyonunda çakışma var` 
        };
      }
    }

    return { valid: true, reason: null };
  };
  
  // Local state update (optimistic update)
  const updateLocalWorkOrderStation = (workOrderId, fromStation, toStation) => {
    setIstasyonData(prevData => {
      const newData = { ...prevData };
      
      // İş emrini eski istasyondan çıkar
      if (newData[fromStation]) {
        newData[fromStation] = newData[fromStation].filter(
          wo => wo.id !== parseInt(workOrderId)
        );
      }
      
      // İş emrini yeni istasyona ekle
      const workOrder = Object.values(prevData)
        .flat()
        .find(wo => wo.id === parseInt(workOrderId));
      
      if (workOrder && newData[toStation]) {
        newData[toStation] = [...newData[toStation], { ...workOrder, istasyon: toStation }];
      }
      
      return newData;
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DragDropContext 
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      >
        <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header */}
        <AppBar position="static" color="default" elevation={1} sx={{ borderRadius: 1, mb: 3 }}>
          <Toolbar>
            <TimelineIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Tezgah İş Planı
            </Typography>
            
            {/* Toolbar Butonları */}
            <IconButton 
              onClick={() => setTimelineMode(!timelineMode)}
              color={timelineMode ? "primary" : "default"}
              title={timelineMode ? "Liste Görünümü" : "Timeline Görünümü"}
            >
              {timelineMode ? <ViewListIcon /> : <CalendarViewWeekIcon />}
            </IconButton>
            
            {/* Zoom Butonları (sadece timeline modunda) */}
            {timelineMode && (
              <>
                <IconButton 
                  onClick={handleZoomOut}
                  title="Uzaklaştır"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOutIcon />
                </IconButton>
                <IconButton 
                  onClick={handleZoomReset}
                  title="Zoom Sıfırla"
                  size="small"
                >
                  <ZoomOutMapIcon />
                </IconButton>
                <IconButton 
                  onClick={handleZoomIn}
                  title="Yakınlaştır"
                  disabled={zoomLevel >= 3}
                >
                  <ZoomInIcon />
                </IconButton>
                <Typography variant="caption" sx={{ mx: 1, minWidth: '40px' }}>
                  {Math.round(zoomLevel * 100)}%
                </Typography>
              </>
            )}
            
            <IconButton onClick={loadTezgahIsPlanimi} disabled={loading}>
              <RefreshIcon />
            </IconButton>

            {/* Cache durumu indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Cache: {Object.keys(parcaCache).length}
              </Typography>
            </Box>

            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Filtreler */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="İş Emri Ara"
                value={filtreMetni}
                onChange={(e) => setFiltreMetni(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filtreMetni && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setFiltreMetni('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={durumFiltresi}
                  label="Durum Filtresi"
                  onChange={(e) => setDurumFiltresi(e.target.value)}
                >
                  <MenuItem value="">Tüm Durumlar</MenuItem>
                  <MenuItem value="beklemede">Beklemede</MenuItem>
                  <MenuItem value="torna">Torna</MenuItem>
                  <MenuItem value="freze">Freze</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Tarih Filtresi"
                value={tarihFiltresi}
                onChange={(newValue) => setTarihFiltresi(newValue)}
                slots={{ textField: TextField }}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={loadTezgahIsPlanimi}
                disabled={loading}
                fullWidth
              >
                Filtrele
              </Button>
            </Grid>
          </Grid>
          
          {(filtreMetni || durumFiltresi || tarihFiltresi) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {filtreMetni && (
                  <Chip label={`Arama: ${filtreMetni}`} onDelete={() => setFiltreMetni('')} />
                )}
                {durumFiltresi && (
                  <Chip label={`Durum: ${durumFiltresi}`} onDelete={() => setDurumFiltresi('')} />
                )}
                {tarihFiltresi && (
                  <Chip 
                    label={`Tarih: ${tarihFiltresi.format('DD/MM/YYYY')}`} 
                    onDelete={() => setTarihFiltresi(null)} 
                  />
                )}
              </Box>
              <Button size="small" onClick={handleFiltreClear}>
                Tümünü Temizle
              </Button>
            </Box>
          )}
        </Paper>

        {/* Hata Mesajı */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* İstasyon Satırları */}
        {!loading && !error && (
          <Paper ref={timelineRef} sx={{ overflow: 'hidden' }}>
            {/* Timeline Header */}
            {timelineMode && (
              <TimelineHeader 
                baslangicTarihi={baslangicTarihi} 
                gunSayisi={gunSayisi} 
                columnWidth={columnWidth}
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                isDragging={isDragging}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            )}
            
            {/* İstasyon Satırları */}
            <Box>
              {Object.entries(ISTASYONLAR).map(([istasyonKey, istasyonAdi]) => (
                timelineMode ? (
                  <TimelineIstasyonSatiri
                    key={istasyonKey}
                    istasyonKey={istasyonKey}
                    istasyonAdi={istasyonAdi}
                    isEmirleri={filteredIstasyonData[istasyonKey] || []}
                    onIsEmriClick={handleIsEmriClick}
                    onContextMenu={handleContextMenu}
                    baslangicTarihi={baslangicTarihi}
                    gunSayisi={gunSayisi}
                    columnWidth={columnWidth}
                    zoomLevel={zoomLevel}
                    panOffset={panOffset}
                    getParcaBilgileriWithCache={getParcaBilgileriWithCache}
                  />
                ) : (
                  <IstasyonSatiri
                    key={istasyonKey}
                    istasyonKey={istasyonKey}
                    istasyonAdi={istasyonAdi}
                    isEmirleri={filteredIstasyonData[istasyonKey] || []}
                    onIsEmriClick={handleIsEmriClick}
                    onContextMenu={handleContextMenu}
                    getParcaBilgileriWithCache={getParcaBilgileriWithCache}
                  />
                )
              ))}
            </Box>
          </Paper>
        )}

        {/* İstatistikler */}
        {!loading && !error && (
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h6" gutterBottom>İstatistikler</Typography>
            <Grid container spacing={2}>
              {Object.entries(ISTASYONLAR).map(([istasyonKey, istasyonAdi]) => (
                <Grid item xs={6} md={3} key={istasyonKey}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color={ISTASYON_RENKLERI[istasyonKey]}>
                      {filteredIstasyonData[istasyonKey]?.length || 0}
                    </Typography>
                    <Typography variant="body2">{istasyonAdi}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Context Menu */}
        <Menu
          open={contextMenu !== null}
          onClose={handleContextMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            contextMenu !== null
              ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
              : undefined
          }
        >
          <MenuItem onClick={handleEditDuration}>
            <ScheduleIcon sx={{ mr: 1 }} />
            Tahmini Süreyi Düzenle
          </MenuItem>
        </Menu>

        {/* Tahmini Süre Düzenleme Modal */}
        <Dialog open={editModalOpen} onClose={handleModalClose}>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ mr: 1 }} />
              Tahmini İşleme Süresi Düzenle
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>İş Emri:</strong> {selectedWorkOrder?.is_emri_no} - {selectedWorkOrder?.is_adi}
              </Typography>
              <TextField
                label="Tahmini İşleme Süresi (Vardiya)"
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                InputProps={{
                  inputProps: { min: 1, max: 20 }
                }}
                fullWidth
                helperText="1-20 vardiya arasında bir değer giriniz"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>İptal</Button>
            <Button onClick={handleDurationUpdate} variant="contained">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
        </Container>
      </DragDropContext>
    </LocalizationProvider>
  );
};

export default TezgahIsPlanı;