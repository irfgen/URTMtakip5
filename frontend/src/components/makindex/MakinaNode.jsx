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
  Business,
  ChevronRight,
  Settings,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';

const MakinaNode = ({
  makina,
  isExpanded,
  hasChildren,
  isSelected,
  onToggle,
}) => {
  const theme = useTheme();

  // Determine status color based on durum
  const getStatusColor = (durum) => {
    switch (durum) {
      case 'aktif':
        return {
          color: theme.palette.success.main,
          icon: CheckCircle,
          label: 'Aktif',
        };
      case 'bakim':
        return {
          color: theme.palette.warning.main,
          icon: Warning,
          label: 'Bakımda',
        };
      case 'pasif':
        return {
          color: theme.palette.error.main,
          icon: Error,
          label: 'Pasif',
        };
      default:
        return {
          color: theme.palette.grey[500],
          icon: Settings,
          label: durum,
        };
    }
  };

  const statusInfo = getStatusColor(makina.durum);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.75,
        px: 1,
        borderRadius: 1,
        cursor: 'pointer',
        backgroundColor: isSelected
          ? theme.palette.info.light
          : 'transparent',
        border: isSelected
          ? `2px solid ${theme.palette.info.main}`
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

      {/* Machine Icon */}
      <Box sx={{ mr: 1.5, color: statusInfo.color }}>
        <Business fontSize="small" />
      </Box>

      {/* Node Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'info.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {makina.name}
        </Typography>

        {/* Model and Description */}
        {(makina.model || makina.description) && (
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
            {makina.model && (
              <>
                Model: {makina.model}
                {makina.description && ' - '}
              </>
            )}
            {makina.description}
          </Typography>
        )}
      </Box>

      {/* Status and Metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status Badge */}
        <Tooltip title={statusInfo.label}>
          <Chip
            size="small"
            icon={<statusInfo.icon fontSize="small" />}
            label={statusInfo.label}
            sx={{
              fontSize: '0.65rem',
              height: 18,
              color: statusInfo.color,
              backgroundColor: `${statusInfo.color}20`,
              borderColor: statusInfo.color,
            }}
          />
        </Tooltip>

        {/* BOM Count */}
        {hasChildren && (
          <Tooltip title={`${makina.boms?.length || 0} BOM grubu`}>
            <Chip
              size="small"
              label={`${makina.boms?.length || 0}`}
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        {/* Production Year */}
        {makina.uretim_yili && (
          <Tooltip title={`Üretim Yılı: ${makina.uretim_yili}`}>
            <Chip
              size="small"
              label={makina.uretim_yili.toString()}
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        {/* Serial Number */}
        {makina.seri_no && (
          <Tooltip title={`Seri No: ${makina.seri_no}`}>
            <Chip
              size="small"
              label="SN"
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

export default MakinaNode;