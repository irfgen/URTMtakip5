import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Badge,
  IconButton,
  Tooltip,
  Fab,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchIsEmirleri, updateIsEmriStatus, confirmFasonConversion } from '../store/slices/isEmirleriSlice';
import IsEmriKarti from './IsEmriKarti';
import FasonConfirmDialog from './FasonConfirmDialog';

// ✅ Dinamik durum sistemi ile uyumlu - API'den çekilecek

const IsEmriKanbanBoard = ({ onAddIsEmri, onEditIsEmri, onDeleteIsEmri }) => {
  const dispatch = useDispatch();
  const { isEmirleri, loading, error } = useSelector(state => state.isEmirleri);
  const [draggedItem, setDraggedItem] = useState(null);
  
  // ✅ Dinamik durum kolonları
  const [durumKolonlari, setDurumKolonlari] = useState([]);
  
  // Fason dialog state'leri
  const [fasonDialog, setFasonDialog] = useState({
    open: false,
    isEmri: null,
    loading: false
  });

  useEffect(() => {
    dispatch(fetchIsEmirleri());
    fetchDurumKolonlari();
  }, [dispatch]);

  // ✅ Dinamik durumları çek
  const fetchDurumKolonlari = async () => {
    try {
      const response = await fetch('/api/is-emri-durumlari');
      const durumlar = await response.json();
      
      const kolonlar = durumlar.map(durum => ({
        id: durum.durum_kodu,
        title: durum.durum_adi,
        color: durum.renk_kodu,
        backgroundColor: durum.renk_kodu + '20', // Alpha için opacity ekleme
        isEmriSayisi: durum.is_emri_sayisi || 0
      }));
      
      setDurumKolonlari(kolonlar);
    } catch (error) {
      console.error('Durum kolonları yüklenirken hata:', error);
      // Fallback: Temel durumlar
      setDurumKolonlari([
        { id: 'beklemede', title: 'Beklemede', color: '#2196f3', backgroundColor: '#e3f2fd' },
        { id: 'fason', title: 'Fason', color: '#ff6b35', backgroundColor: '#fff3e0' },
        { id: 'tamamlandı', title: 'Tamamlandı', color: '#4caf50', backgroundColor: '#e8f5e8' }
      ]);
    }
  };

  // İş emirlerini durumlara göre grupla
  const groupedIsEmirleri = React.useMemo(() => {
    const grouped = {};
    
    // ✅ Dinamik durumlar için boş arrayler oluştur
    durumKolonlari.forEach(kolon => {
      grouped[kolon.id] = [];
    });

    // İş emirlerini durumlarına göre dağıt
    if (Array.isArray(isEmirleri)) {
      isEmirleri.forEach(isEmri => {
        const durum = isEmri.durum || 'beklemede'; // Default status
        if (grouped[durum]) {
          grouped[durum].push(isEmri);
        } else {
          // Bilinmeyen durum varsa beklemede'ye koy
          if (grouped['beklemede']) {
            grouped['beklemede'].push(isEmri);
          }
        }
      });
    }

    return grouped;
  }, [isEmirleri, durumKolonlari]);

  const handleDragStart = (start) => {
    setDraggedItem(start.draggableId);
  };

  const handleDragEnd = async (result) => {
    setDraggedItem(null);
    
    const { destination, source, draggableId } = result;

    // Drop edilmedi veya aynı yere drop edildi
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // İş emrinin durumunu güncelle
    const isEmriId = parseInt(draggableId);
    const yeniDurum = destination.droppableId;

    try {
      const response = await dispatch(updateIsEmriStatus({
        id: isEmriId,
        status: yeniDurum
      })).unwrap();
      
      // Eğer fason dialog gerekiyorsa, dialog'u aç
      if (response.requiresFasonDialog) {
        setFasonDialog({
          open: true,
          isEmri: response.isEmri,
          loading: false
        });
        return;
      }
      
      // İş emirlerini yeniden yükle
      dispatch(fetchIsEmirleri());
    } catch (error) {
      console.error('İş emri durumu güncellenirken hata:', error);
    }
  };


  // Fason dialog işlemleri
  const handleFasonConfirm = async (data) => {
    setFasonDialog(prev => ({ ...prev, loading: true }));
    
    try {
      await dispatch(confirmFasonConversion({
        id: fasonDialog.isEmri.is_emri_id,
        ...data
      })).unwrap();
      
      // Dialog'u kapat ve listeyi yenile
      setFasonDialog({ open: false, isEmri: null, loading: false });
      dispatch(fetchIsEmirleri());
    } catch (error) {
      console.error('Fason dönüşümü hatası:', error);
      setFasonDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFasonCancel = () => {
    setFasonDialog({ open: false, isEmri: null, loading: false });
  };

  const handleRefresh = () => {
    dispatch(fetchIsEmirleri());
    fetchDurumKolonlari();
  };

  if (loading || durumKolonlari.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          {loading ? 'İş emirleri yükleniyor...' : 'Durumlar yükleniyor...'}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Hata: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          İş Emri Kanban Panosu
        </Typography>
        <Box>
          <Tooltip title="Yenile">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {onAddIsEmri && (
            <Tooltip title="Yeni İş Emri Ekle">
              <Fab color="primary" size="small" onClick={onAddIsEmri} sx={{ ml: 1 }}>
                <AddIcon />
              </Fab>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid container spacing={1} sx={{ height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {durumKolonlari.map((kolon) => {
            const isEmriList = groupedIsEmirleri[kolon.id] || [];
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={durumKolonlari.length > 6 ? 12/durumKolonlari.length : 2} key={kolon.id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    height: '100%',
                    backgroundColor: kolon.backgroundColor,
                    border: `2px solid ${kolon.color}`,
                    borderRadius: 2
                  }}
                >
                  {/* Kolon Header */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderBottom: `1px solid ${kolon.color}`,
                      backgroundColor: kolon.color,
                      color: 'white',
                      borderRadius: '8px 8px 0 0'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" fontWeight="bold" fontSize="0.9rem">
                        {kolon.title}
                      </Typography>
                      <Badge badgeContent={isEmriList.length} color="secondary">
                        <Box />
                      </Badge>
                    </Stack>
                  </Box>

                  {/* Droppable Area */}
                  <Droppable droppableId={kolon.id}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                          minHeight: '500px',
                          maxHeight: 'calc(100vh - 200px)',
                          overflowY: 'auto',
                          p: 1,
                          backgroundColor: snapshot.isDraggingOver 
                            ? 'rgba(0, 0, 0, 0.05)' 
                            : 'transparent'
                        }}
                      >
                        {isEmriList.map((isEmri, index) => (
                          <Draggable
                            key={isEmri.is_emri_id}
                            draggableId={isEmri.is_emri_id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{
                                  mb: 1,
                                  transform: snapshot.isDragging 
                                    ? `${provided.draggableProps.style?.transform} rotate(5deg)`
                                    : provided.draggableProps.style?.transform,
                                  opacity: snapshot.isDragging ? 0.8 : 1,
                                  cursor: snapshot.isDragging ? 'grabbing' : 'grab'
                                }}
                              >
                                <IsEmriKarti
                                  isEmri={isEmri}
                                  index={index}
                                  onEdit={onEditIsEmri}
                                  onDelete={onDeleteIsEmri}
                                />
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Empty State */}
                        {isEmriList.length === 0 && (
                          <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            minHeight="200px"
                            color="text.secondary"
                          >
                            <Typography variant="body2" textAlign="center">
                              Bu durumda henüz iş emri yok
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>

      {/* Fason Confirm Dialog */}
      <FasonConfirmDialog
        open={fasonDialog.open}
        onClose={handleFasonCancel}
        onConfirm={handleFasonConfirm}
        isEmri={fasonDialog.isEmri}
        loading={fasonDialog.loading}
      />
    </Box>
  );
};

export default IsEmriKanbanBoard;
