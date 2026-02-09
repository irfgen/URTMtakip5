import React, { useState, useRef, useEffect } from 'react';
import { getFileUploadUrl } from '../../utils/getApiBaseUrl';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  Build,
  OpenInNew,
  Inventory,
  Warning,
  ErrorOutline,
  PhotoCamera,
  Article,
} from '@mui/icons-material';

const ParcaNode = ({
  parca,
  isSelected,
  onSelect,
  mobile = false,
  height = 48,
}) => {
  const theme = useTheme();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasImage) {
            setHasImage(true);
            setIsImageLoading(true);
            setShowImage(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasImage]);

  // Check stock status
  const getStockStatus = (stokAdeti, kritikStok) => {
    if (stokAdeti === 0) {
      return {
        status: 'out',
        color: theme.palette.error.main,
        icon: ErrorOutline,
        label: 'Stok Yok',
        tooltip: 'Stokta mevcut değil',
      };
    } else if (stokAdeti <= kritikStok) {
      return {
        status: 'critical',
        color: theme.palette.warning.main,
        icon: Warning,
        label: 'Kritik',
        tooltip: `Kritik seviyede (${stokAdeti}/${kritikStok})`,
      };
    } else {
      return {
        status: 'in_stock',
        color: theme.palette.success.main,
        icon: Inventory,
        label: 'Stokta',
        tooltip: `Stokta mevcut (${stokAdeti} adet)`,
      };
    }
  };

  const stockStatus = getStockStatus(parca.stokAdeti, parca.kritik_stok);

  // Mobile-friendly styling
  const nodeStyles = mobile ? {
    minHeight: height,
    py: 1,
    px: 1.5,
    fontSize: '0.9rem',
    '&:hover': {
      transform: 'none',
      backgroundColor: theme.palette.action.hover,
    },
  } : {
    py: 0.5,
    px: 1,
    '&:hover': {
      transform: 'translateX(2px)',
      backgroundColor: theme.palette.action.hover,
    },
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        ...nodeStyles,
        borderRadius: 1,
        cursor: 'pointer',
        backgroundColor: isSelected
          ? theme.palette.success.light
          : 'transparent',
        border: isSelected
          ? `2px solid ${theme.palette.success.main}`
          : '2px solid transparent',
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={onSelect}
    >
      {/* Part Icon */}
      <Box sx={{ mr: 1.5, color: stockStatus.color }}>
        <Build fontSize="small" />
      </Box>

      {/* Node Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          component="div"
          sx={{
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? 'success.main' : 'text.primary',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {parca.parcaKodu}
        </Typography>

        {/* Part Name */}
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
          {parca.parcaAdi}
        </Typography>

        {/* Category */}
        {parca.kategori && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'inline-block',
              mr: 1,
              backgroundColor: theme.palette.grey[100],
              px: 1,
              py: 0.25,
              borderRadius: 0.5,
              fontSize: '0.6rem',
            }}
          >
            {parca.kategori}
          </Typography>
        )}
      </Box>

      {/* Status and Metadata */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Manufacturing Status */}
        <Tooltip title={parca.imalMi ? 'İmalat' : 'Tedarik'}>
          <Chip
            size="small"
            label={parca.imalMi ? 'İmal' : 'Tdr'}
            color={parca.imalMi ? 'info' : 'secondary'}
            sx={{
              fontSize: '0.6rem',
              height: 16,
            }}
          />
        </Tooltip>

        {/* Stock Status */}
        <Tooltip title={stockStatus.tooltip}>
          <Chip
            size="small"
            icon={<stockStatus.icon fontSize="small" />}
            label={stockStatus.label}
            sx={{
              fontSize: '0.6rem',
              height: 16,
              color: stockStatus.color,
              backgroundColor: `${stockStatus.color}20`,
            }}
          />
        </Tooltip>

        {/* Stock Quantity */}
        <Tooltip title="Stok Adeti">
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: stockStatus.color,
              fontWeight: 500,
            }}
          >
            {parca.stokAdeti}
          </Typography>
        </Tooltip>

        {/* Has Technical Drawing */}
        {parca.teknik_resim_path && (
          <Tooltip title="Teknik Resim Mevcut">
            <Article fontSize="small" sx={{ color: theme.palette.info.main }} />
          </Tooltip>
        )}

        {/* Has Photo */}
        {parca.foto_path && (
          <Tooltip title="Foto Mevcut">
            <PhotoCamera fontSize="small" sx={{ color: theme.palette.info.main }} />
          </Tooltip>
        )}

        {/* Open in New Tab */}
        <Tooltip title="Detaylı Görüntüle (Yeni Sekme)">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            sx={{
              p: 0.5,
              color: theme.palette.action.active,
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Lazy Loaded Technical Drawing Image */}
      {showImage && parca.teknik_resim_path && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isImageLoaded ? 0.1 : 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            borderRadius: 1,
          }}
        >
          <img
            ref={imgRef}
            src={`${getFileUploadUrl()}/${parca.teknik_resim_path}`}
            alt={`Teknik resim: ${parca.parcaAdi}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onLoad={() => {
              setIsImageLoaded(true);
              setIsImageLoading(false);
            }}
            onError={() => {
              setIsImageLoading(false);
              setShowImage(false);
            }}
          />
          {isImageLoading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Skeleton variant="rectangular" width={100} height={100} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ParcaNode;