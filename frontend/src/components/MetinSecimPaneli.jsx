import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  Button,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Badge
} from '@mui/material';
import { 
  CheckCircle, 
  Circle, 
  Star,
  Numbers,
  TextFields,
  Code,
  Category,
  TrendingUp
} from '@mui/icons-material';

const MetinSecimPaneli = ({ extractedTexts, onPartCodeSelect, selectedPartCode }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!extractedTexts) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTextSelect = (text) => {
    onPartCodeSelect(text);
  };

  const formatConfidence = (confidence) => {
    return `%${(confidence * 100).toFixed(1)}`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreColor = (score) => {
    if (score >= 0.7) return 'success';
    if (score >= 0.4) return 'warning';
    return 'error';
  };

  const renderTextCard = (textItem, showScore = false) => {
    const isSelected = selectedPartCode === textItem.text;
    
    return (
      <Card 
        key={textItem.text + textItem.source} 
        variant="outlined"
        sx={{ 
          mb: 1,
          cursor: 'pointer',
          border: isSelected ? 2 : 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: 1
          }
        }}
        onClick={() => handleTextSelect(textItem.text)}
      >
        <CardContent sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {isSelected ? (
                <CheckCircle color="primary" sx={{ mr: 1 }} />
              ) : (
                <Circle color="action" sx={{ mr: 1 }} />
              )}
              
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isSelected ? 'primary.main' : 'inherit'
                }}
              >
                {textItem.text}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {showScore && textItem.partCodeScore !== undefined && (
                <Chip
                  size="small"
                  icon={<TrendingUp />}
                  label={formatConfidence(textItem.partCodeScore)}
                  color={getScoreColor(textItem.partCodeScore)}
                  variant="outlined"
                />
              )}
              
              <Chip
                size="small"
                label={formatConfidence(textItem.confidence)}
                color={getConfidenceColor(textItem.confidence)}
              />
              
              <Chip
                size="small"
                label={textItem.source}
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const tabConfigs = [
    {
      label: 'Aday Parça Kodları',
      icon: <Star />,
      data: extractedTexts.candidates || [],
      description: 'Parça kodu olma potansiyeli yüksek metinler',
      showScore: true
    },
    {
      label: 'Karışık İçerik',
      icon: <Code />,
      data: extractedTexts.mixed || [],
      description: 'Harf, rakam ve özel karakter içeren metinler'
    },
    {
      label: 'Kelimeler',
      icon: <TextFields />,
      data: extractedTexts.words || [],
      description: 'Sadece harflerden oluşan metinler'
    },
    {
      label: 'Sayılar',
      icon: <Numbers />,
      data: extractedTexts.numbers || [],
      description: 'Sadece rakamlardan oluşan metinler'
    }
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Category sx={{ mr: 1 }} />
        Metin Seçimi - Çıkarılan Metinler ({extractedTexts.totalTextsFound} total)
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Aşağıdaki listeden doğru parça kodunu seçin. Sistem çıkardığı tüm metinleri kategorilere ayırarak sunmaktadır.
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {tabConfigs.map((config, index) => (
            <Tab
              key={index}
              icon={config.icon}
              label={
                <Badge badgeContent={config.data.length} color="primary">
                  {config.label}
                </Badge>
              }
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {tabConfigs.map((config, index) => (
        <div key={index} hidden={activeTab !== index}>
          {activeTab === index && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {config.description}
              </Typography>

              {config.data.length === 0 ? (
                <Alert severity="warning">
                  Bu kategoride metin bulunamadı.
                </Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {config.data.map((textItem) => 
                    renderTextCard(textItem, config.showScore)
                  )}
                </Box>
              )}
            </Box>
          )}
        </div>
      ))}

      {selectedPartCode && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Seçilen Parça Kodu:
          </Typography>
          <Typography variant="h6" color="primary">
            {selectedPartCode}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MetinSecimPaneli;