import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle, 
  Circle, 
  Star,
  TrendingUp,
  Visibility,
  Info
} from '@mui/icons-material';

const AdayMetinKartlari = ({ 
  candidates, 
  onSelect, 
  selectedText, 
  maxItems = 10,
  showDetails = false 
}) => {
  if (!candidates || candidates.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography color="text.secondary">
            Aday parça kodu bulunamadı
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const formatConfidence = (confidence) => {
    return `%${(confidence * 100).toFixed(1)}`;
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'error';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const topCandidates = candidates.slice(0, maxItems);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Star color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Aday Parça Kodları
        </Typography>
        <Chip 
          size="small" 
          label={candidates.length} 
          color="primary" 
          sx={{ ml: 1 }} 
        />
      </Box>

      <Grid container spacing={2}>
        {topCandidates.map((candidate, index) => {
          const isSelected = selectedText === candidate.text;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={candidate.text + candidate.source}>
              <Card 
                variant="outlined"
                sx={{ 
                  cursor: 'pointer',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: 2
                  },
                  position: 'relative'
                }}
                onClick={() => onSelect(candidate.text)}
              >
                {/* Ranking Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#CD7F32' : 'grey.500',
                    color: 'white',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {index + 1}
                </Box>

                <CardContent sx={{ pt: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {isSelected ? (
                      <CheckCircle color="primary" sx={{ mr: 1 }} />
                    ) : (
                      <Circle color="action" sx={{ mr: 1 }} />
                    )}
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: isSelected ? 'bold' : 'normal',
                        color: isSelected ? 'primary.main' : 'inherit',
                        fontSize: '1.1rem'
                      }}
                    >
                      {candidate.text}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      icon={<TrendingUp />}
                      label={formatConfidence(candidate.partCodeScore)}
                      color={getScoreColor(candidate.partCodeScore)}
                      variant="filled"
                    />
                    
                    <Chip
                      size="small"
                      label={formatConfidence(candidate.confidence)}
                      color={getConfidenceColor(candidate.confidence)}
                      variant="outlined"
                    />
                  </Box>

                  {showDetails && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Kaynak: {candidate.source}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Kategori: {candidate.category}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant={isSelected ? "contained" : "outlined"}
                    size="small"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(candidate.text);
                    }}
                  >
                    {isSelected ? 'Seçildi' : 'Seç'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {candidates.length > maxItems && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {candidates.length - maxItems} adet daha aday parça kodu mevcut...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AdayMetinKartlari;