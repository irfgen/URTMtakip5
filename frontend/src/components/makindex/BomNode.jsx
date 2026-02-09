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
  Description,
  ChevronRight,
  Article,
  Inventory2,
} from '@mui/icons-material';

const BomNode = ({
  bom,
  isExpanded,
  hasChildren,
  isSelected,
  onToggle,
}) => {
  const theme = useTheme();

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
          ? theme.palette.warning.light
          : 'transparent',
        border: isSelected
          ? `2px solid ${theme.palette.warning.main}`
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

      {/* BOM Icon */}
      <Box sx={{ mr: 1.5, color: theme.palette.warning.main }}>
        <Description fontSize="small" />
      </Box>

      {/* Node Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'warning.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {bom.name}
        </Typography>

        {/* BOM Code and Description */}
        {(bom.bom_kodu || bom.bom_aciklamasi) && (
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
            {bom.bom_kodu && (
              <>
                Kod: {bom.bom_kodu}
                {bom.bom_aciklamasi && ' - '}
              </>
            )}
            {bom.bom_aciklamasi}
          </Typography>
        )}

        {/* Version */}
        {bom.versiyon && bom.versiyon !== '1.0' && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'inline-block',
              mt: 0.25,
            }}
          >
            v{bom.versiyon}
          </Typography>
        )}
      </Box>

      {/* Status and Metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status Badge */}
        <Tooltip title={bom.aktif ? 'Aktif' : 'Pasif'}>
          <Chip
            size="small"
            label={bom.aktif ? 'Aktif' : 'Pasif'}
            color={bom.aktif ? 'success' : 'default'}
            sx={{
              fontSize: '0.65rem',
              height: 18,
            }}
          />
        </Tooltip>

        {/* Part Count */}
        {hasChildren && (
          <Tooltip title={`${bom.parcalar?.length || 0} parça`}>
            <Chip
              size="small"
              icon={<Article fontSize="small" />}
              label={`${bom.parcalar?.length || 0}`}
              variant="outlined"
              sx={{
                fontSize: '0.65rem',
                height: 18,
              }}
            />
          </Tooltip>
        )}

        {/* BOM Code */}
        {bom.bom_kodu && (
          <Tooltip title={`BOM Kodu: ${bom.bom_kodu}`}>
            <Chip
              size="small"
              icon={<Inventory2 fontSize="small" />}
              label={bom.bom_kodu}
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

export default BomNode;