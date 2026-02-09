import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UretimPlaniKartiMobile = ({ plan, onMenuClick }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/mobile/uretim-plani/detay/${plan.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getDurumColor = (durum) => {
    switch (durum?.toLowerCase()) {
      case 'tamamlandi':
      case 'tamamlandı':
        return 'success';
      case 'devam ediyor':
      case 'aktif':
        return 'primary';
      case 'beklemede':
        return 'warning';
      case 'iptal':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ pb: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
              {plan.ozel_liste_adi || `Plan #${plan.id}`}
            </Typography>
            
            {plan.makina && (
              <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                  <BuildIcon fontSize="small" />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {plan.makina.name}
                </Typography>
              </Box>
            )}
          </Box>
          
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick && onMenuClick(plan, e);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ mt: 2 }}>
          {/* Miktar */}
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <AssignmentIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Miktar: {plan.miktar || '-'}
            </Typography>
          </Box>

          {/* Teslim Tarihi */}
          {plan.teslim_tarihi && (
            <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Teslim: {formatDate(plan.teslim_tarihi)}
              </Typography>
            </Box>
          )}

          {/* Durum ve Oluşturma Tarihi */}
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Chip 
              label={plan.durum || 'Belirtilmemiş'}
              color={getDurumColor(plan.durum)}
              size="small"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(plan.olusturma_tarihi)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UretimPlaniKartiMobile;