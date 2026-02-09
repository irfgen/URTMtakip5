import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import CameraCapture from './CameraCapture';
import teknikResimService from '../services/teknikResimService';
import useDeviceDetect from '../hooks/useDeviceDetect';
import axios from 'axios';

const steps = [
  'Resim Seç',
  'Analiz Ediliyor',
  'Sonuçları İncele',
  'İşlem Seç'
];

const TeknikResimCameraModal = ({ 
  open, 
  onClose, 
  onPartFound, 
  onPartCreate 
}) => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetect();
  
  // Stepper ve modal state'leri
  const [activeStep, setActiveStep] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  // Analiz state'leri
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Parça kontrol state'leri
  const [partCheckResult, setPartCheckResult] = useState(null);
  const [partExists, setPartExists] = useState(false);
  
  // Düzenlenebilir form verileri
  const [editableData, setEditableData] = useState({
    parcaKodu: '',
    parcaAdi: '',
    malzemeCinsi: '',
    hamMalzemeOlculeri: '',
    projeAdi: '',
    aciklama: ''
  });

  // Modal açıldığında sıfırla
  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

  // Modal sıfırlama
  const handleReset = () => {
    setActiveStep(0);
    setCameraOpen(false);
    setCapturedImage(null);
    setAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisResults(null);
    setAnalysisError(null);
    setPartCheckResult(null);
    setPartExists(false);
    setEditableData({
      parcaKodu: '',
      parcaAdi: '',
      malzemeCinsi: '',
      hamMalzemeOlculeri: '',
      projeAdi: '',
      aciklama: ''
    });
  };

  // Modal kapatma
  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Kameradan fotoğraf geldi
  const handleCameraCapture = async (imageData) => {
    try {
      setCapturedImage(imageData);
      setCameraOpen(false);
      setActiveStep(1); // Analiz adımına geç
      
      await handleAnalyzeImage(imageData);
    } catch (error) {
      console.error('Kamera yakalama hatası:', error);
      setAnalysisError(error.message || 'Fotoğraf işlenemedi');
    }
  };

  // Teknik resim analizini başlat
  const handleAnalyzeImage = async (imageData) => {
    try {
      setAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisError(null);

      // Teknik resim API'sine gönder
      const result = await teknikResimService.analyzeFromCamera(
        imageData,
        (progress) => setAnalysisProgress(progress)
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Sonuçları formatla
      const formattedResults = teknikResimService.formatAnalysisResults(result.data);
      
      if (!formattedResults.isValid) {
        throw new Error(formattedResults.error || 'Analiz sonuçları geçersiz');
      }

      setAnalysisResults(formattedResults);
      
      // Form verilerini doldur
      setEditableData({
        parcaKodu: formattedResults.parcaKodu || '',
        parcaAdi: formattedResults.parcaAdi || '',
        malzemeCinsi: formattedResults.malzemeCinsi || '',
        hamMalzemeOlculeri: formattedResults.ham_malzeme_olculeri || '',
        projeAdi: formattedResults.projeAdi || '',
        aciklama: formattedResults.aciklama || ''
      });

      // Parça kodu bulunduysa kontrol et
      if (formattedResults.parcaKodu) {
        await handleCheckPart(formattedResults.parcaKodu);
      }

      setActiveStep(2); // Sonuçları İncele adımına geç

    } catch (error) {
      console.error('Analiz hatası:', error);
      setAnalysisError(error.message || 'Analiz sırasında hata oluştu');
    } finally {
      setAnalyzing(false);
    }
  };

  // Dosya seçme ile analiz başlat (web versiyonu için)
  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // File'dan data URL oluştur
          const dataUrl = URL.createObjectURL(file);
          
          // CapturedImage formatına benzer yapı oluştur
          const imageData = {
            blob: file,
            dataUrl: dataUrl,
            width: null,
            height: null,
            timestamp: new Date().toISOString()
          };
          
          setCapturedImage(imageData);
          setActiveStep(1); // Analiz adımına geç
          
          // analyzeFromFile metodunu kullan
          await handleAnalyzeFromFile(file);
        } catch (error) {
          console.error('Dosya seçme hatası:', error);
          setAnalysisError(error.message || 'Dosya işlenemedi');
        }
      }
    };
    input.click();
  };

  // Dosyadan analiz başlat
  const handleAnalyzeFromFile = async (file) => {
    try {
      setAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisError(null);

      // Teknik resim API'sine dosya gönder
      const result = await teknikResimService.analyzeFromFile(
        file,
        (progress) => setAnalysisProgress(progress)
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Sonuçları formatla
      const formattedResults = teknikResimService.formatAnalysisResults(result.data);
      
      if (!formattedResults.isValid) {
        throw new Error(formattedResults.error || 'Analiz sonuçları geçersiz');
      }

      setAnalysisResults(formattedResults);
      
      // Form verilerini doldur
      setEditableData({
        parcaKodu: formattedResults.parcaKodu || '',
        parcaAdi: formattedResults.parcaAdi || '',
        malzemeCinsi: formattedResults.malzemeCinsi || '',
        hamMalzemeOlculeri: formattedResults.ham_malzeme_olculeri || '',
        projeAdi: formattedResults.projeAdi || '',
        aciklama: formattedResults.aciklama || ''
      });

      // Parça kodu bulunduysa kontrol et
      if (formattedResults.parcaKodu) {
        await handleCheckPart(formattedResults.parcaKodu);
      }

      setActiveStep(2); // Sonuçları İncele adımına geç

    } catch (error) {
      console.error('Dosya analiz hatası:', error);
      setAnalysisError(error.message || 'Analiz sırasında hata oluştu');
    } finally {
      setAnalyzing(false);
    }
  };

  // Parça var mı kontrol et
  const handleCheckPart = async (parcaKodu) => {
    try {
      const response = await axios.get(`/api/parcalar/check?parcaKodu=${encodeURIComponent(parcaKodu)}`);
      setPartCheckResult(response.data);
      setPartExists(response.data.exists);
      
      if (response.data.exists) {
        setActiveStep(3); // İşlem Seç adımına geç
      }
    } catch (error) {
      console.error('Parça kontrol hatası:', error);
      setPartExists(false);
    }
  };

  // Form verilerini düzenle
  const handleEditableDataChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Parça detayına git
  const handleGoToPartDetail = () => {
    if (partCheckResult?.parca?.parcaKodu) {
      navigate(`/parcalar/${encodeURIComponent(partCheckResult.parca.parcaKodu)}`);
      handleClose();
      if (onPartFound) {
        onPartFound(partCheckResult.parca);
      }
    }
  };

  // Yeni parça oluştur
  const handleCreateNewPart = () => {
    if (onPartCreate) {
      onPartCreate(editableData, capturedImage);
    }
    handleClose();
  };

  // Tekrar fotoğraf çek
  const handleRetakePhoto = () => {
    setActiveStep(0);
    setCameraOpen(true);
    setCapturedImage(null);
    setAnalysisResults(null);
    setAnalysisError(null);
    setPartCheckResult(null);
  };

  // Kamera hatası
  const handleCameraError = (error) => {
    console.error('Kamera hatası:', error);
    setAnalysisError('Kamera erişim hatası: ' + error.message);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Teknik Resim Analizi</Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Stepper */}
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Adım 0: Fotoğraf Çek */}
          {activeStep === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PhotoCameraIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Teknik Resim Ekle
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Parça kodunu, malzeme bilgilerini ve ölçüleri daha iyi okuyabilmek için 
                resmi net ve iyi ışıklandırılmış şekilde {isMobile ? 'çekin veya galeriden seçin' : 'seçin'}.
              </Typography>
              
              {isMobile ? (
                // Mobil versiyonda hem kamera hem dosya seçimi
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => setCameraOpen(true)}
                    sx={{ minWidth: 200 }}
                  >
                    Kamera Aç
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<FolderIcon />}
                    onClick={handleFileSelect}
                    sx={{ minWidth: 200 }}
                  >
                    Galeriden Seç
                  </Button>
                </Box>
              ) : (
                // Web versiyonda sadece dosya seçimi
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<FolderIcon />}
                  onClick={handleFileSelect}
                >
                  Resim Dosyası Seç
                </Button>
              )}
            </Box>
          )}

          {/* Adım 1: Analiz Ediliyor */}
          {activeStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress 
                variant={analysisProgress > 0 ? "determinate" : "indeterminate"} 
                value={analysisProgress}
                size={80}
                sx={{ mb: 3 }}
              />
              <Typography variant="h6" gutterBottom>
                Teknik Resim Analiz Ediliyor
              </Typography>
              <Typography color="text.secondary">
                {analysisProgress > 0 ? 
                  `Yükleniyor: %${analysisProgress}` : 
                  'OCR ve metin analizi yapılıyor...'
                }
              </Typography>
              
              {capturedImage && (
                <Box sx={{ mt: 3, maxWidth: 300, mx: 'auto' }}>
                  <img 
                    src={capturedImage.dataUrl}
                    alt="Çekilen Fotoğraf"
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 8,
                      border: '2px solid #ddd'
                    }}
                  />
                </Box>
              )}

              {analysisError && (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {analysisError}
                </Alert>
              )}
            </Box>
          )}

          {/* Adım 2: Sonuçları İncele */}
          {activeStep === 2 && analysisResults && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Analiz Sonuçları
              </Typography>
              
              <Grid container spacing={3}>
                {/* Sol taraf - Çekilen fotoğraf */}
                <Grid item xs={12} md={5}>
                  {capturedImage && (
                    <Card>
                      <CardMedia
                        component="img"
                        image={capturedImage.dataUrl}
                        alt="Çekilen Fotoğraf"
                        sx={{ maxHeight: 300, objectFit: 'contain' }}
                      />
                    </Card>
                  )}
                  
                  {analysisResults.processedImage && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        İşlenmiş Görüntü
                      </Typography>
                      <Card>
                        <CardMedia
                          component="img"
                          image={analysisResults.processedImage}
                          alt="İşlenmiş Görüntü"
                          sx={{ maxHeight: 200, objectFit: 'contain' }}
                        />
                      </Card>
                    </Box>
                  )}
                </Grid>

                {/* Sağ taraf - Düzenlenebilir form */}
                <Grid item xs={12} md={7}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Çıkarılan Bilgiler
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={`Güven: %${Math.round(analysisResults.confidence * 100)}`}
                        color={analysisResults.confidence > 0.7 ? 'success' : 
                               analysisResults.confidence > 0.4 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Parça Kodu"
                          value={editableData.parcaKodu}
                          onChange={(e) => handleEditableDataChange('parcaKodu', e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Parça Adı"
                          value={editableData.parcaAdi}
                          onChange={(e) => handleEditableDataChange('parcaAdi', e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Malzeme Cinsi"
                          value={editableData.malzemeCinsi}
                          onChange={(e) => handleEditableDataChange('malzemeCinsi', e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Ham Malzeme Ölçüleri"
                          value={editableData.hamMalzemeOlculeri}
                          onChange={(e) => handleEditableDataChange('hamMalzemeOlculeri', e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Proje Adı"
                          value={editableData.projeAdi}
                          onChange={(e) => handleEditableDataChange('projeAdi', e.target.value)}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Açıklama"
                          value={editableData.aciklama}
                          onChange={(e) => handleEditableDataChange('aciklama', e.target.value)}
                          variant="outlined"
                          size="small"
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Adım 3: İşlem Seç */}
          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Parça Kontrol Sonucu
              </Typography>
              
              {partExists && partCheckResult?.parca ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1">
                    Parça bulundu: "{partCheckResult.parca.parcaKodu}"
                  </Typography>
                  <Typography variant="body2">
                    {partCheckResult.parca.parcaAdi}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1">
                    Parça sistemde bulunamadı
                  </Typography>
                  <Typography variant="body2">
                    Yeni parça olarak kayıt oluşturabilirsiniz.
                  </Typography>
                </Alert>
              )}

              <Grid container spacing={2}>
                {partExists && (
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={handleGoToPartDetail}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <VisibilityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6">
                          Parça Detayına Git
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mevcut parçanın detay sayfasını açın
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={partExists ? 6 : 12}>
                  <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={handleCreateNewPart}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <EditIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6">
                        {partExists ? 'Yeni Parça Oluştur' : 'Parça Oluştur'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Analiz sonuçlarıyla yeni parça kaydet
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              {activeStep > 0 && activeStep < 3 && (
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleRetakePhoto}
                  color="secondary"
                >
                  Tekrar Çek
                </Button>
              )}
            </Box>
            
            <Box>
              <Button onClick={handleClose}>
                Kapat
              </Button>
              {activeStep === 2 && editableData.parcaKodu && (
                <Button
                  variant="contained"
                  onClick={() => handleCheckPart(editableData.parcaKodu)}
                  startIcon={<CheckIcon />}
                  sx={{ ml: 1 }}
                >
                  Devam Et
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Kamera Modal */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        onError={handleCameraError}
        aspectRatio="auto"
      />
    </>
  );
};

export default TeknikResimCameraModal; 