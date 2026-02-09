import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';

/**
 * A component that renders an image with fallback behavior when the image fails to load.
 * 
 * @param {Object} props - Component props
 * @param {string} props.src - The source URL of the image
 * @param {string} [props.alt=''] - Alt text for the image
 * @param {Object} [props.imgStyle={}] - Additional styles for the img element
 * @param {Object} [props.fallbackStyle={}] - Additional styles for the fallback container
 * @param {string} [props.fallbackText='Görüntü yüklenemedi'] - Text to show when image fails to load
 * @param {Object} [props.sx={}] - MUI sx prop for the container
 */
const ImageWithFallback = ({ 
  src, 
  alt = '', 
  imgStyle = {}, 
  fallbackStyle = {}, 
  fallbackText = 'Görüntü yüklenemedi',
  sx = {},
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.warn(`Image failed to load: ${src}`);
    setHasError(true);
  };

  if (hasError) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          border: '1px dashed #ccc',
          borderRadius: 1,
          backgroundColor: '#f5f5f5',
          minHeight: '100px',
          ...sx,
          ...fallbackStyle
        }}
      >
        <BrokenImageIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          {fallbackText}
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
          {alt || src.split('/').pop()}
        </Typography>
      </Box>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={handleError} 
      style={{ maxWidth: '100%', maxHeight: '100%', ...imgStyle }} 
      loading="lazy"
      {...props} 
    />
  );
};

export default ImageWithFallback;
