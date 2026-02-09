import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Close as CloseIcon,
  AutoFixHigh as AutoFixHighIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { fetchSchedulerConflicts, updateScheduledTask } from '../../store/slices/schedulerSlice';

const ConflictDetector = ({ 
  onConflictDetected, 
  autoResolve = false,
  showDetails = true 
}) => {
  const dispatch = useDispatch();
  const { conflicts, selectedDateRange, selectedWorkstations } = useSelector(state => state.scheduler);
  
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);

  // Çakışmaları otomatik kontrol et
  const checkConflicts = useCallback(() => {
    dispatch(fetchSchedulerConflicts({
      startDate: selectedDateRange.start,
      endDate: selectedDateRange.end,
      workstationIds: selectedWorkstations
    }));
  }, [dispatch, selectedDateRange, selectedWorkstations]);

  // Periyodik olarak çakışmaları kontrol et
  useEffect(() => {
    const interval = setInterval(checkConflicts, 30000); // 30 saniyede bir
    return () => clearInterval(interval);
  }, [checkConflicts]);

  // Çakışma durumu değiştiğinde callback çağır
  useEffect(() => {
    if (conflicts.length > 0 && onConflictDetected) {
      onConflictDetected(conflicts);
    }
  }, [conflicts, onConflictDetected]);

  // Zamanları formatla
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Çakışma tipini belirle
  const getConflictType = (conflict) => {
    // Backend'den gelen conflict data yapısına göre ayarla
    if (conflict.overlap_type === 'complete_overlap') {
      return 'Tam Çakışma';
    } else if (conflict.overlap_type === 'partial_overlap') {
      return 'Kısmi Çakışma';
    }
    return 'Çakışma';
  };

  // Çakışma çözüm önerileri
  const getResolutionSuggestions = (conflict) => {
    const suggestions = [];
    
    // Zaman kayması önerisi
    suggestions.push({
      type: 'time_shift',
      title: 'Zaman Kaydır',
      description: 'İkinci görevi çakışmayan zaman dilimine taşı',
      action: () => suggestTimeShift(conflict)
    });

    // Tezgah değişimi önerisi
    suggestions.push({
      type: 'workstation_change',
      title: 'Tezgah Değiştir',
      description: 'Görevi müsait olan başka tezgaha ata',
      action: () => suggestWorkstationChange(conflict)
    });

    // Süre optimize et
    if (conflict.optimization_possible) {
      suggestions.push({
        type: 'duration_optimize',
        title: 'Süre Optimize Et',
        description: 'Görev sürelerini optimize ederek çakışmayı çöz',
        action: () => optimizeDurations(conflict)
      });
    }

    return suggestions;
  };

  // Zaman kayması önerisi hesapla
  const suggestTimeShift = (conflict) => {
    // İkinci görevin bitiş zamanından sonraki ilk müsait zamanı bul
    const task1End = new Date(conflict.task1.end_time);
    const suggestedStart = new Date(task1End.getTime() + 30 * 60 * 1000); // 30dk buffer
    
    return {
      taskId: conflict.task2.id,
      newStartTime: suggestedStart.toISOString(),
      reason: `${conflict.task1.work_order.number} işi bittikten sonra başlatılacak`
    };
  };

  // Tezgah değişimi önerisi
  const suggestWorkstationChange = (conflict) => {
    // Bu logic'i backend'den alınacak available workstations ile güçlendir
    return {
      taskId: conflict.task2.id,
      newWorkstationId: null, // Backend'den gelecek
      reason: 'Alternatif tezgah önerisi'
    };
  };

  // Süre optimizasyonu
  const optimizeDurations = (conflict) => {
    return {
      optimizations: [
        {
          taskId: conflict.task1.id,
          newDuration: Math.floor(conflict.task1.planned_duration_minutes * 0.9)
        },
        {
          taskId: conflict.task2.id,
          newDuration: Math.floor(conflict.task2.planned_duration_minutes * 0.9)
        }
      ],
      reason: '%10 süre optimizasyonu ile çakışma çözülebilir'
    };
  };

  // Çakışmayı otomatik çöz
  const resolveConflict = async (conflict, solution) => {
    setResolving(true);
    try {
      if (solution.type === 'time_shift') {
        const suggestion = suggestTimeShift(conflict);
        await dispatch(updateScheduledTask({
          taskId: suggestion.taskId,
          taskData: {
            baslangic_zamani: suggestion.newStartTime,
            bitis_zamani: new Date(
              new Date(suggestion.newStartTime).getTime() + 
              conflict.task2.planned_duration_minutes * 60 * 1000
            ).toISOString()
          }
        }));
      }
      
      // Çözümden sonra çakışmaları yeniden kontrol et
      setTimeout(checkConflicts, 1000);
      
    } catch (error) {
      console.error('Çakışma çözülürken hata:', error);
    } finally {
      setResolving(false);
    }
  };

  // Çakışma detaylarını göster
  const showConflictDetails = (conflict) => {
    setSelectedConflict(conflict);
    setShowConflictDialog(true);
  };

  if (conflicts.length === 0) {
    return null; // Çakışma yoksa hiçbir şey gösterme
  }

  return (
    <Box>
      {/* Ana çakışma uyarısı */}
      <Alert 
        severity="warning" 
        sx={{ mb: 2 }}
        action={
          <Stack direction="row" spacing={1}>
            <Button 
              size="small" 
              onClick={() => setShowConflictDialog(true)}
              startIcon={<VisibilityIcon />}
            >
              Detaylar
            </Button>
            {autoResolve && (
              <Button 
                size="small" 
                onClick={() => resolveConflict(conflicts[0], { type: 'time_shift' })}
                disabled={resolving}
                startIcon={<AutoFixHighIcon />}
              >
                Otomatik Çöz
              </Button>
            )}
          </Stack>
        }
      >
        <Typography variant="body2">
          <strong>{conflicts.length} çakışma tespit edildi.</strong> 
          {' '}Planlamaları gözden geçirin ve gerekli düzeltmeleri yapın.
        </Typography>
      </Alert>

      {/* Kısa çakışma listesi */}
      {showDetails && conflicts.slice(0, 3).map((conflict, index) => (
        <Alert 
          key={index}
          severity="error" 
          sx={{ mb: 1 }}
          action={
            <IconButton 
              size="small" 
              onClick={() => showConflictDetails(conflict)}
            >
              <VisibilityIcon />
            </IconButton>
          }
        >
          <Typography variant="caption">
            <BuildIcon fontSize="inherit" /> {conflict.workstation_name}: 
            {' '}{conflict.task1?.work_order?.number} ↔ {conflict.task2?.work_order?.number}
          </Typography>
        </Alert>
      ))}

      {conflicts.length > 3 && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          +{conflicts.length - 3} çakışma daha...
        </Typography>
      )}

      {/* Çakışma detay dialog'u */}
      <Dialog 
        open={showConflictDialog} 
        onClose={() => setShowConflictDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Çakışma Detayları ({conflicts.length})
            </Typography>
            <IconButton onClick={() => setShowConflictDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {conflicts.map((conflict, index) => (
              <ListItem key={index} divider>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <BuildIcon fontSize="small" />
                      <Typography variant="subtitle2">
                        {conflict.workstation_name}
                      </Typography>
                      <Chip 
                        label={getConflictType(conflict)} 
                        size="small" 
                        color="error" 
                      />
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      {/* Çakışan görevler */}
                      <Box display="flex" gap={2} mb={1}>
                        <Box flex={1}>
                          <Typography variant="caption" color="primary" display="block">
                            📋 {conflict.task1?.work_order?.number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <ScheduleIcon fontSize="inherit" />
                            {' '}{formatDateTime(conflict.task1?.start_time)} - {formatDateTime(conflict.task1?.end_time)}
                          </Typography>
                        </Box>
                        
                        <Box flex={1}>
                          <Typography variant="caption" color="secondary" display="block">
                            📋 {conflict.task2?.work_order?.number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <ScheduleIcon fontSize="inherit" />
                            {' '}{formatDateTime(conflict.task2?.start_time)} - {formatDateTime(conflict.task2?.end_time)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Çözüm önerileri */}
                      <Box mt={2}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          💡 Çözüm Önerileri:
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {getResolutionSuggestions(conflict).map((suggestion, idx) => (
                            <Button
                              key={idx}
                              size="small"
                              variant="outlined"
                              onClick={() => resolveConflict(conflict, suggestion)}
                              disabled={resolving}
                            >
                              {suggestion.title}
                            </Button>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowConflictDialog(false)}>
            Kapat
          </Button>
          <Button 
            variant="contained"
            onClick={checkConflicts}
            startIcon={<WarningIcon />}
          >
            Yeniden Kontrol Et
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConflictDetector;