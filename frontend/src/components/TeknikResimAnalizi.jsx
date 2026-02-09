import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  ButtonGroup,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { Upload, Image, Analytics, Info, PhotoCamera, Folder, AutoFixHigh, ManualMode } from '@mui/icons-material';
import useDeviceDetect from '../hooks/useDeviceDetect';
import MetinSecimPaneli from './MetinSecimPaneli';
import AdayMetinKartlari from './AdayMetinKartlari';

const TeknikResimAnalizi = () => {
  const { isMobile } = useDeviceDetect();
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [interactiveMode, setInteractiveMode] = useState(true);
  const [selectedPartCode, setSelectedPartCode] = useState(null);
  const [resultTab, setResultTab] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
      setSelectedPartCode(null);
      setResultTab(0);
    }
  };

  // Mobil cihazlarda kameradan fotoğraf çekme
  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Arka kamerayı tercih et
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        setResult(null);
        setError(null);
        setSelectedPartCode(null);
        setResultTab(0);
      }
    };
    input.click();
  };

  // Web versiyonda dosya seçme
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
        setResult(null);
        setError(null);
        setSelectedPartCode(null);
        setResultTab(0);
      }
    };
    input.click();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Lütfen analiz edilecek teknik resim dosyasını seçin.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setSelectedPartCode(null);

    const formData = new FormData();
    formData.append('teknik_resim', selectedFile);

    try {
      const endpoint = interactiveMode ? '/api/teknik-resim/analiz-interactive' : '/api/teknik-resim/analiz';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        // If interactive mode and candidates available, auto-select first candidate
        if (interactiveMode && data.data.extractedTexts?.candidates?.length > 0) {
          setSelectedPartCode(data.data.extractedTexts.candidates[0].text);
          setResultTab(1); // Switch to interactive tab
        }
      } else {
        setError(data.error?.message || 'Analiz sırasında bir hata oluştu.');
      }
    } catch (error) {
      setError('Ağ hatası: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatConfidence = (confidence) => {
    return `%${(confidence * 100).toFixed(1)}`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const handlePartCodeSelect = (partCode) => {
    setSelectedPartCode(partCode);
  };

  const handleModeChange = (event) => {
    setInteractiveMode(event.target.checked);
    setResult(null);
    setSelectedPartCode(null);
    setResultTab(0);
  };

  const handleResultTabChange = (event, newValue) => {
    setResultTab(newValue);
  };

  const renderStandardResults = (resultData) => {
    const confidence = resultData.confidence || {};
    
    return (
      <Grid container spacing={2}>
        {/* Ana Bilgiler */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Çıkarılan Bilgiler
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Parça Kodu:
                </Typography>
                <Typography variant="body1">
                  {interactiveMode ? (selectedPartCode || 'Seçilmedi') : (resultData.parca_kodu || 'Bulunamadı')}
                  {((interactiveMode && selectedPartCode) || resultData.parca_kodu) && (
                    <Chip
                      size="small"
                      label={interactiveMode ? 'Manuel Seçim' : formatConfidence(confidence.parca_kodu || 0)}
                      color={interactiveMode ? 'success' : getConfidenceColor(confidence.parca_kodu || 0)}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Malzeme:
                </Typography>
                <Typography variant="body1">
                  {resultData.material || 'Bulunamadı'}
                  {resultData.material && (
                    <Chip
                      size="small"
                      label={formatConfidence(confidence.material || 0)}
                      color={getConfidenceColor(confidence.material || 0)}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Proje Adı:
                </Typography>
                <Typography variant="body1">
                  {resultData.projectName || 'Bulunamadı'}
                  {resultData.projectName && (
                    <Chip
                      size="small"
                      label={formatConfidence(confidence.projectName || 0)}
                      color={getConfidenceColor(confidence.projectName || 0)}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Genel Güven Skoru:
                </Typography>
                <Chip
                  label={formatConfidence(confidence.overall || 0)}
                  color={getConfidenceColor(confidence.overall || 0)}
                  variant="filled"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* İşlem Bilgileri */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                İşlem Bilgileri
              </Typography>
              <Typography variant="body2" color="text.secondary">
                İşlem Süresi: {result?.metadata?.processingTime || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                OCR Süresi: {result?.metadata?.ocrProcessingTime || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bulunan Kelime: {result?.metadata?.totalWords || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Yüksek Güvenli Kelime: {result?.metadata?.highConfidenceWords || 0}
              </Typography>
              {interactiveMode && result?.extractedTexts && (
                <Typography variant="body2" color="text.secondary">
                  Çıkarılan Toplam Metin: {result.extractedTexts.totalTextsFound || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* İşlenmiş Görüntü */}
        {result?.processedImage && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  İşlenmiş Görüntü
                </Typography>
                <Box
                  component="img"
                  src={result.processedImage}
                  alt="İşlenmiş Teknik Resim"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <Analytics sx={{ mr: 1 }} />
          Teknik Resim Analizi
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={interactiveMode}
              onChange={handleModeChange}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {interactiveMode ? <ManualMode sx={{ mr: 0.5 }} /> : <AutoFixHigh sx={{ mr: 0.5 }} />}
              {interactiveMode ? 'İnteraktif Mod' : 'Otomatik Mod'}
            </Box>
          }
        />
      </Box>

      {interactiveMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>İnteraktif Mod:</strong> Sistem tüm metinleri çıkaracak ve sizin doğru parça kodunu seçmenize imkan tanıyacak.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Dosya Yükleme Bölümü */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Upload sx={{ mr: 1 }} />
              Teknik Resim Yükle
            </Typography>

            <Box sx={{ mb: 2 }}>
              {isMobile ? (
                // Mobil versiyonda hem kamera hem dosya seçimi
                <ButtonGroup 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 2 }}
                  orientation="vertical"
                >
                  <Button
                    startIcon={<PhotoCamera />}
                    onClick={handleCameraCapture}
                    sx={{ mb: 1 }}
                  >
                    Kameradan Çek
                  </Button>
                  <Button
                    startIcon={<Folder />}
                    onClick={handleFileUpload}
                  >
                    Galeriden Seç
                  </Button>
                </ButtonGroup>
              ) : (
                // Web versiyonda sadece dosya seçimi
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Image />}
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={handleFileUpload}
                >
                  Resim Dosyası Seç
                </Button>
              )}
            </Box>

            {selectedFile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Seçilen dosya:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              fullWidth
              startIcon={analyzing ? <CircularProgress size={20} /> : <Analytics />}
            >
              {analyzing ? 'Analiz Ediliyor...' : 'Analiz Et'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Sonuç Bölümü */}
        <Grid item xs={12} md={6}>
          {result && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  <Info sx={{ mr: 1 }} />
                  Analiz Sonuçları
                </Typography>
                
                {interactiveMode && (
                  <Chip 
                    label="İnteraktif Mod" 
                    color="primary" 
                    variant="outlined"
                    icon={<ManualMode />}
                  />
                )}
              </Box>

              {interactiveMode ? (
                // Interactive Mode Results
                <Box>
                  <Tabs
                    value={resultTab}
                    onChange={handleResultTabChange}
                    variant="scrollable"
                    scrollButtons
                    allowScrollButtonsMobile
                    sx={{
                      mb: 3,
                      '& .MuiTabs-scrollButtons': {
                        '&.Mui-disabled': {
                          opacity: 0.3,
                        },
                      },
                    }}
                  >
                    <Tab label="Otomatik Sonuçlar" />
                    <Tab label="Metin Seçimi" />
                  </Tabs>

                  <div hidden={resultTab !== 0}>
                    {resultTab === 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Otomatik Analiz Sonuçları
                        </Typography>
                        {renderStandardResults(result.automaticResults || result)}
                      </Box>
                    )}
                  </div>

                  <div hidden={resultTab !== 1}>
                    {resultTab === 1 && (
                      <Box>
                        <AdayMetinKartlari
                          candidates={result.extractedTexts?.candidates || []}
                          onSelect={handlePartCodeSelect}
                          selectedText={selectedPartCode}
                          maxItems={6}
                          showDetails={false}
                        />
                      </Box>
                    )}
                  </div>
                </Box>
              ) : (
                // Standard Mode Results
                renderStandardResults(result)
              )}
            </Paper>
          )}
        </Grid>

        {/* Interactive Mode: Full Text Selection Panel */}
        {result && interactiveMode && (
          <Grid item xs={12}>
            <MetinSecimPaneli
              extractedTexts={result.extractedTexts}
              onPartCodeSelect={handlePartCodeSelect}
              selectedPartCode={selectedPartCode}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TeknikResimAnalizi; 