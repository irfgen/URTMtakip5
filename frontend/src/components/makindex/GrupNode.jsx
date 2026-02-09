import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Category,
  ChevronRight,
  Article,
  BrandingWatermark,
} from '@mui/icons-material';

const GrupNode = ({
  grup,
  isExpanded,
  hasChildren,
  isSelected,
  onToggle,
}) => {
  const theme = useTheme();

  // Group tipine göre ikon seçimi
  const getGroupIcon = () => {
    if (grup.grup_tipi === 'marka') {
      return <BrandingWatermark fontSize="small" />;
    }
    return <Category fontSize="small" />;
  };

  // Grup tipine göre renk seçimi
  const getGroupColor = () => {
    if (grup.grup_tipi === 'marka') {
      return theme.palette.info.main;
    }
    if (grup.grup_tipi === 'ozel') {
      return theme.palette.secondary.main;
    }
    return theme.palette.primary.main;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.5,
        px: 1,
        borderRadius: 1,
        cursor: 'pointer',
        backgroundColor: isSelected
          ? theme.palette.primary.light
          : 'transparent',
        border: isSelected
          ? `2px solid ${theme.palette.primary.main}`
          : '2px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          transform: 'translateX(2px)',
        },
      }}
      onClick={onToggle}
    >
      {/* Expand/Collapse Icon */}
      {hasChildren && (
        <IconButton
          size="small"
          sx={{
            mr: 1,
            transition: 'transform 0.2s ease-in-out',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      )}

      {/* Group Icon */}
      <Box sx={{ mr: 1.5, color: getGroupColor() }}>
        {getGroupIcon()}
      </Box>

      {/* Node Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'primary.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {grup.ad}
        </Typography>

        {/* Grup Açıklama */}
        {grup.aciklama && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              mt: 0.25,
            }}
          >
            {grup.aciklama}
          </Typography>
        )}

        {/* Version */}
        {grup.versiyon && grup.versiyon !== '1.0' && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'inline-block',
              mt: 0.25,
            }}
          >
            v{grup.versiyon}
          </Typography>
        )}
      </Box>

      {/* Status and Metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Group Type Badge - Sadece marka ve ozel gruplarda göster */}
        {(grup.grup_tipi === 'marka' || grup.grup_tipi === 'ozel') && (
          <Tooltip title={`Grup Tipi: ${grup.grup_tipi}`}>
            <Chip
              size="small"
              label={grup.grup_tipi.toUpperCase()}
              color={grup.grup_tipi === 'marka' ? 'info' : 'secondary'}
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}
  
        {/* Brand Badge */}
        {grup.marka && (
          <Tooltip title={`Marka: ${grup.marka}`}>
            <Chip
              size="small"
              label={grup.marka}
              color="info"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        {/* Special Label */}
        {grup.ozel_etiket && (
          <Tooltip title={`Özel Etiket: ${grup.ozel_etiket}`}>
            <Chip
              size="small"
              label={grup.ozel_etiket}
              color="secondary"
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        {/* Status Badge */}
        <Tooltip title={grup.aktif ? 'Aktif' : 'Pasif'}>
          <Chip
            size="small"
            label={grup.aktif ? 'Aktif' : 'Pasif'}
            color={grup.aktif ? 'success' : 'default'}
            sx={{
              fontSize: '0.65rem',
              height: 18,
            }}
          />
        </Tooltip>

        {/* Part Count */}
        {hasChildren && (
          <Tooltip title={`${grup.parcalar?.length || 0} parça`}>
            <Chip
              size="small"
              icon={<Article fontSize="small" />}
              label={`${grup.parcalar?.length || 0}`}
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        </Box>
    </Box>
  );
};

export default GrupNode;