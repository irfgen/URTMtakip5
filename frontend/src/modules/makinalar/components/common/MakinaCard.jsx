import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DurumBadge from './DurumBadge';

/**
 * Makina bilgilerini gösteren kart bileşeni
 * @param {object} props - Bileşen props'ları
 * @param {object} props.makina - Makina verisi
 * @param {function} props.onEdit - Düzenleme fonksiyonu
 * @param {function} props.onDelete - Silme fonksiyonu
 * @param {boolean} props.showActions - Aksiyon butonları gösterilsin mi
 * @param {boolean} props.compact - Sıkışık mod
 * @returns {JSX.Element} - Makina kartı bileşeni
 */
const MakinaCard = ({ 
  makina, 
  onEdit, 
  onDelete, 
  showActions = true, 
  compact = false 
}) => {
  const navigate = useNavigate();

  // Detay sayfasına git
  const handleViewDetails = () => {
    navigate(`/makinalar/${makina.makina_id}`);
  };

  // Düzenleme butonu tıklandığında
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(makina);
    }
  };

  // Silme butonu tıklandığında
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(makina);
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
      }}
      onClick={handleViewDetails}
    >
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant={compact ? 'h6' : 'h5'} 
            component="h2" 
            noWrap
            title={makina.name}
          >
            {makina.name}
          </Typography>
          <DurumBadge durum={makina.durum} type="makina" size="small" />
        </Box>

        {makina.model && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Model: {makina.model}
          </Typography>
        )}

        {makina.seri_no && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Seri No: {makina.seri_no}
          </Typography>
        )}

        {makina.uretim_yili && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Üretim Yılı: {makina.uretim_yili}
          </Typography>
        )}

        {!compact && makina.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {makina.description}
          </Typography>
        )}

        {makina.items && makina.items.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Bileşenler ({makina.items.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {makina.items.slice(0, compact ? 2 : 4).map((item, index) => (
                <Chip
                  key={index}
                  label={item.name}
                  size="small"
                  variant="outlined"
                  color={item.type === 'PART' ? 'primary' : 'secondary'}
                />
              ))}
              {makina.items.length > (compact ? 2 : 4) && (
                <Chip
                  label={`+${makina.items.length - (compact ? 2 : 4)}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
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
        </CardActions>
      )}
    </Card>
  );
};

export default MakinaCard;