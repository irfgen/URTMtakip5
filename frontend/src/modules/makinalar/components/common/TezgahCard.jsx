import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DurumBadge from './DurumBadge';

/**
 * Tezgah bilgilerini gösteren kart bileşeni
 * @param {object} props - Bileşen props'ları
 * @param {object} props.tezgah - Tezgah verisi
 * @param {function} props.onEdit - Düzenleme fonksiyonu
 * @param {function} props.onDelete - Silme fonksiyonu
 * @param {function} props.onAssignJob - İş atama fonksiyonu
 * @param {function} props.onPauseJob - İşe ara verme fonksiyonu
 * @param {function} props.onCompleteJob - İş tamamlama fonksiyonu
 * @param {boolean} props.showActions - Aksiyon butonları gösterilsin mi
 * @param {boolean} props.compact - Sıkışık mod
 * @returns {JSX.Element} - Tezgah kartı bileşeni
 */
const TezgahCard = ({ 
  tezgah, 
  onEdit, 
  onDelete, 
  onAssignJob,
  onPauseJob,
  onCompleteJob,
  showActions = true, 
  compact = false 
}) => {
  const navigate = useNavigate();

  // Detay sayfasına git
  const handleViewDetails = () => {
    navigate(`/tezgahlar/${tezgah.tezgah_id}`);
  };

  // Düzenleme butonu tıklandığında
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(tezgah);
    }
  };

  // Silme butonu tıklandığında
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(tezgah);
    }
  };

  // İş atama butonu tıklandığında
  const handleAssignJob = (e) => {
    e.stopPropagation();
    if (onAssignJob) {
      onAssignJob(tezgah);
    }
  };

  // İşe ara verme butonu tıklandığında
  const handlePauseJob = (e) => {
    e.stopPropagation();
    if (onPauseJob) {
      onPauseJob(tezgah);
    }
  };

  // İş tamamlama butonu tıklandığında
  const handleCompleteJob = (e) => {
    e.stopPropagation();
    if (onCompleteJob) {
      onCompleteJob(tezgah);
    }
  };

  // Aktif iş emri var mı
  const hasActiveJob = tezgah.is_emirleri && tezgah.is_emirleri.length > 0;
  const activeJob = hasActiveJob ? tezgah.is_emirleri[0] : null;

  // Duruma göre ilerleme çubuğu rengi
  const getProgressColor = () => {
    switch (tezgah.calisma_durumu) {
      case 'calisiyor': return 'primary';
      case 'arizada': return 'error';
      case 'bakimda': return 'warning';
      default: return 'success';
    }
  };

  // Duruma göre ilerleme çubuğu değeri
  const getProgressValue = () => {
    switch (tezgah.calisma_durumu) {
      case 'calisiyor': return 75;
      case 'arizada': return 25;
      case 'bakimda': return 50;
      default: return 0;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        cursor: 'pointer',
        border: tezgah.calisma_durumu !== 'musait' ? '2px solid' : 'none',
        borderColor: tezgah.calisma_durumu === 'calisiyor' ? 'primary.main' : 
                     tezgah.calisma_durumu === 'arizada' ? 'error.main' : 
                     tezgah.calisma_durumu === 'bakimda' ? 'warning.main' : 'transparent',
      }}
      onClick={handleViewDetails}
    >
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant={compact ? 'h6' : 'h5'} 
            component="h2" 
            noWrap
            title={tezgah.tezgah_tanimi}
          >
            {tezgah.tezgah_tanimi}
          </Typography>
          <DurumBadge durum={tezgah.calisma_durumu} type="tezgah" size="small" />
        </Box>

        {/* Durum ilerleme çubuğu */}
        {tezgah.calisma_durumu !== 'musait' && (
          <Box sx={{ mb: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={getProgressValue()} 
              color={getProgressColor()}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Aktif iş emri bilgisi */}
        {hasActiveJob && activeJob && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Aktif İş:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="bold">
                  {activeJob.is_adi}
                </Typography>
                <Chip 
                  label={activeJob.parca_kodu} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  İş Emri No: {activeJob.is_emri_no}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeJob.islenen_adet}/{activeJob.toplam_adet}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Arıza/Bakım durumu */}
        {tezgah.ariza_bakim_durumu && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {tezgah.ariza_bakim_durumu.tipi === 'ariza' ? 'Arıza' : 'Bakım'}:
            </Typography>
            <Chip 
              label={tezgah.ariza_bakim_durumu.tipi === 'ariza' ? 'Arızada' : 'Bakımda'} 
              size="small" 
              color={tezgah.ariza_bakim_durumu.tipi === 'ariza' ? 'error' : 'warning'}
            />
          </Box>
        )}
      </CardContent>

      {showActions && (
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box>
            <Tooltip title="Detayları Gör">
              <IconButton size="small" onClick={handleViewDetails}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Düzenle">
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton size="small" onClick={handleDelete} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box>
            {tezgah.calisma_durumu === 'musait' && onAssignJob && (
              <Tooltip title="İş Ata">
                <Button 
                  size="small" 
                  variant="contained" 
                  startIcon={<PlayIcon />}
                  onClick={handleAssignJob}
                >
                  İş Ata
                </Button>
              </Tooltip>
            )}
            
            {tezgah.calisma_durumu === 'calisiyor' && onPauseJob && (
              <Tooltip title="İşe Ara Ver">
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<PauseIcon />}
                  onClick={handlePauseJob}
                >
                  Ara Ver
                </Button>
              </Tooltip>
            )}
            
            {tezgah.calisma_durumu === 'calisiyor' && onCompleteJob && (
              <Tooltip title="İşi Tamamla">
                <Button 
                  size="small" 
                  variant="contained" 
                  color="success"
                  startIcon={<StopIcon />}
                  onClick={handleCompleteJob}
                  sx={{ ml: 1 }}
                >
                  Tamamla
                </Button>
              </Tooltip>
            )}
          </Box>
        </CardActions>
      )}
    </Card>
  );
};

export default TezgahCard;