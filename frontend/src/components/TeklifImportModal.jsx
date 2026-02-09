import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';

const TeklifImportModal = ({ open, onClose, onImportComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState([]);
  const [parcaCheckResults, setParcaCheckResults] = useState({});
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  // Yeni parça oluşturma modal state'leri
  const [yeniParcaModalOpen, setYeniParcaModalOpen] = useState(false);
  const [yeniParcaData, setYeniParcaData] = useState({
    parcaKodu: '',
    parcaAdi: '',
    stokAdeti: 0,
    kritik_stok: 0,
    tedarikBedeli: 0,
    imalMi: false,
    hamMalzemeCinsi: '',
    hamMalzemeOlculeri: '',
    fasonMaliyeti: 0,
    sirketIciMaliyeti: 0,
    teknik_resim_path: '',
    foto_path: '',
    setupSayisi: 0,
    cncIslemeSuresi: 0,
    siyah: false
  });
  const [parcaKaydetmeLoading, setParcaKaydetmeLoading] = useState(false);

  // editableData değişimini takip et
  useEffect(() => {
    console.log('[useEffect] editableData changed:', editableData.length);
  }, [editableData]);

  // activeStep değişimini takip et
  useEffect(() => {
    console.log('[useEffect] activeStep changed:', activeStep);
  }, [activeStep]);

  const steps = [
    'Excel Dosyası Yükleme',
    'Veri Kontrol ve Düzenleme',
    'Teklifleri Kaydetme',
    'Import Raporu'
  ];

  // Modal kapatılırken state'i temizle
  const handleClose = () => {
    console.log('[DEBUG] handleClose called');
    setActiveStep(0);
    setFile(null);
    setLoading(false);
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setEditableData([]);
    setParcaCheckResults({});
    setImportResults(null);
    setYeniParcaModalOpen(false);
    setYeniParcaData({
      parcaKodu: '',
      parcaAdi: '',
      stokAdeti: 0,
      kritik_stok: 0,
      tedarikBedeli: 0,
      imalMi: false,
      hamMalzemeCinsi: '',
      hamMalzemeOlculeri: '',
      fasonMaliyeti: 0,
      sirketIciMaliyeti: 0,
      teknik_resim_path: '',
      foto_path: '',
      setupSayisi: 0,
      cncIslemeSuresi: 0,
      siyah: false
    });
    onClose();
  };

  // Dosya seçimi
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  // Excel dosyasını yükle ve parse et
  const handleFileUpload = async () => {
    if (!file) {
      setError('Lütfen bir Excel dosyası seçin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('excel', file);

      const response = await axios.post('/api/fason/teklifler/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[DEBUG] Backend response:', response.data);
      
      if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const mappedData = response.data.data.map(item => ({
          ...item,
          edited: false
        }));
        
        console.log('[DEBUG] Mapped editable data length:', mappedData.length);
        
        // Tek seferde tüm state'leri güncelle
        setParsedData(response.data);
        setEditableData(mappedData);
        setActiveStep(1);
        setSuccess(`Excel dosyası başarıyla yüklendi. ${mappedData.length} satır işlendi.`);
        
        // Parça kodlarını arka planda kontrol et
        checkAllParcaKodlari(response.data.data).catch(console.error);
        
      } else {
        console.error('[ERROR] Boş veri:', response.data.data);
        setError('Excel dosyasından veri alınamadı veya veri boş');
      }

    } catch (err) {
      console.error('Excel yükleme hatası:', err);
      setError(err.response?.data?.message || 'Excel dosyası yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tüm parça kodlarını kontrol et
  const checkAllParcaKodlari = async (data) => {
    const checkResults = {};
    
    for (const item of data) {
      if (item.parca_kodu && !checkResults[item.parca_kodu]) {
        try {
          const response = await axios.get(`/api/fason/teklifler/check-parca?parca_kodu=${encodeURIComponent(item.parca_kodu)}`);
          checkResults[item.parca_kodu] = response.data;
        } catch (err) {
          checkResults[item.parca_kodu] = {
            parca_kodu: item.parca_kodu,
            exists: false,
            error: err.message
          };
        }
      }
    }
    
    setParcaCheckResults(checkResults);
  };

  // Teklifleri kaydet
  const handleSaveTeklifler = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tüm teklifleri düz liste haline getir
      const teklifler = [];
      
      editableData.forEach(item => {
        item.firmalar.forEach(firma => {
          teklifler.push({
            satir_no: item.satir_no,
            parca_kodu: item.parca_kodu,
            firma_adi: firma.firma_adi,
            teklif_fiyati: firma.teklif_fiyati,
            teslim_suresi: 30, // Default
            aciklama: `${item.malzeme_kesiti} ${item.uzunluk} - ${item.malzeme_cinsi}`.trim()
          });
        });
      });

      const response = await axios.post('/api/fason/teklifler/bulk-create', {
        teklifData: teklifler
      });

      setImportResults(response.data.results);
      setActiveStep(3);
      setSuccess(`${response.data.results.basarili.length} teklif başarıyla kaydedildi`);

    } catch (err) {
      console.error('Teklif kaydetme hatası:', err);
      setError(err.response?.data?.message || 'Teklifler kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Veri düzenleme
  const handleDataEdit = (rowIndex, field, value) => {
    const newData = [...editableData];
    newData[rowIndex][field] = value;
    newData[rowIndex].edited = true;
    setEditableData(newData);
  };

  // Parça durumu chip'i
  const getParcaStatusChip = (parcaKodu) => {
    const checkResult = parcaCheckResults[parcaKodu];
    
    if (!checkResult) {
      return <Chip size="small" label="Kontrol ediliyor..." color="default" />;
    }
    
    if (checkResult.exists) {
      return <Chip size="small" label="Parça Var" color="success" icon={<CheckIcon />} />;
    } else {
      return (
        <Chip 
          size="small" 
          label="Yeni Parça Oluştur" 
          color="warning" 
          icon={<AddIcon />}
          onClick={() => handleCreateNewParca(parcaKodu)}
          clickable
        />
      );
    }
  };

  // Yeni parça oluşturma
  const handleCreateNewParca = (parcaKodu) => {
    // Excel'deki ilgili satırı bul
    const excelRow = editableData.find(row => row.parca_kodu === parcaKodu);
    
    if (excelRow) {
      // Excel'deki değerlerle ön tanımlı doldur
      const hamMalzemeOlculeri = `${excelRow.malzeme_kesiti} ${excelRow.uzunluk}`.trim();
      
      setYeniParcaData({
        parcaKodu: parcaKodu,
        parcaAdi: parcaKodu, // Parça adı olarak parça kodunu kullan
        stokAdeti: parseInt(excelRow.adet) || 0,
        kritik_stok: Math.max(1, Math.floor((parseInt(excelRow.adet) || 0) * 0.2)), // %20'si kritik stok
        tedarikBedeli: 0,
        imalMi: false,
        hamMalzemeCinsi: excelRow.malzeme_cinsi || '',
        hamMalzemeOlculeri: hamMalzemeOlculeri,
        fasonMaliyeti: 0,
        sirketIciMaliyeti: 0,
        teknik_resim_path: '',
        foto_path: '',
        setupSayisi: 1,
        cncIslemeSuresi: 0,
        siyah: false
      });
      
      setYeniParcaModalOpen(true);
    }
  };

  // Yeni parçayı kaydet
  const handleSaveNewParca = async () => {
    try {
      setParcaKaydetmeLoading(true);
      setError(null);

      // Parça bilgilerini API'ye gönder
      const response = await axios.post('/api/parcalar', yeniParcaData);
      
      // Başarılı kayıt sonrası parça kontrol sonuçlarını güncelle
      setParcaCheckResults(prev => ({
        ...prev,
        [yeniParcaData.parcaKodu]: {
          parca_kodu: yeniParcaData.parcaKodu,
          exists: true,
          parca: response.data
        }
      }));

      setYeniParcaModalOpen(false);
      setSuccess(`${yeniParcaData.parcaKodu} parçası başarıyla oluşturuldu`);
      
      // Modal'ı kapat ve formu temizle
      setYeniParcaData({
        parcaKodu: '',
        parcaAdi: '',
        stokAdeti: 0,
        kritik_stok: 0,
        tedarikBedeli: 0,
        imalMi: false,
        hamMalzemeCinsi: '',
        hamMalzemeOlculeri: '',
        fasonMaliyeti: 0,
        sirketIciMaliyeti: 0,
        teknik_resim_path: '',
        foto_path: '',
        setupSayisi: 0,
        cncIslemeSuresi: 0,
        siyah: false
      });

    } catch (err) {
      console.error('Yeni parça kaydedilirken hata:', err);
      setError(err.response?.data?.message || 'Parça kaydedilirken hata oluştu');
    } finally {
      setParcaKaydetmeLoading(false);
    }
  };

  const renderUploadStep = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Excel Dosyası Yükleme
      </Typography>
      
      <Paper
        sx={{
          p: 4,
          border: '2px dashed #ccc',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#f5f5f5'
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Excel dosyasını seçin veya sürükleyip bırakın
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Desteklenen formatlar: .xlsx, .xls
        </Typography>
        
        {file && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={file.name}
              color="primary"
              onDelete={() => setFile(null)}
              deleteIcon={<CloseIcon />}
            />
          </Box>
        )}
      </Paper>
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
      />
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Excel Sütun Formatı:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • <strong>Adet:</strong> Teklif miktarı<br />
          • <strong>Parça Adı (parca_kodu):</strong> Parça kodu<br />
          • <strong>Malzeme Kesiti:</strong> Hammadde kesit bilgisi<br />
          • <strong>Uzunluk:</strong> Hammadde uzunluk bilgisi<br />
          • <strong>Malzeme Cinsi:</strong> Malzeme türü<br />
          • <strong>Firma Sütunları:</strong> Her firma için ayrı sütun
        </Typography>
      </Box>
    </Box>
  );

  const renderEditStep = () => {
    console.log('[DEBUG] renderEditStep - editableData.length:', editableData.length);
    
    return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Veri Kontrol ve Düzenleme
      </Typography>
      
      {parsedData?.teklifGrubuAdi && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Teklif Grubu: <strong>{parsedData.teklifGrubuAdi}</strong>
          </Typography>
        </Alert>
      )}
      
      {editableData.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Veri yüklenmedi. Lütfen Excel dosyasını tekrar yükleyin.
        </Alert>
      )}
      
      {editableData.length > 0 && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            {editableData.length} satır veri yüklendi
          </Alert>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Satır</TableCell>
                  <TableCell>Adet</TableCell>
                  <TableCell>Parça Kodu</TableCell>
                  <TableCell>Parça Durumu</TableCell>
                  <TableCell>Malzeme Kesiti</TableCell>
                  <TableCell>Uzunluk</TableCell>
                  <TableCell>Malzeme Cinsi</TableCell>
                  <TableCell>Firmalar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {editableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.satir_no}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={row.adet}
                        onChange={(e) => handleDataEdit(index, 'adet', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.parca_kodu}
                        onChange={(e) => handleDataEdit(index, 'parca_kodu', e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      {getParcaStatusChip(row.parca_kodu)}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.malzeme_kesiti}
                        onChange={(e) => handleDataEdit(index, 'malzeme_kesiti', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.uzunluk}
                        onChange={(e) => handleDataEdit(index, 'uzunluk', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.malzeme_cinsi}
                        onChange={(e) => handleDataEdit(index, 'malzeme_cinsi', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.firmalar.map((firma, firmaIndex) => (
                          <Chip
                            key={firmaIndex}
                            size="small"
                            label={`${firma.firma_adi}: ${firma.teklif_fiyati}₺`}
                            color="primary"
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
  };

  const renderImportResults = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Import Raporu
      </Typography>
      
      {importResults && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            {importResults.basarili.length} teklif başarıyla kaydedildi
          </Alert>
          
          {importResults.basarisiz.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {importResults.basarisiz.length} teklif kaydedilemedi
            </Alert>
          )}
          
          {/* Başarısız kayıtları listele */}
          {importResults.basarisiz.length > 0 && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Satır</TableCell>
                    <TableCell>Parça Kodu</TableCell>
                    <TableCell>Firma</TableCell>
                    <TableCell>Hata</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.basarisiz.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.satir_no}</TableCell>
                      <TableCell>{item.parca_kodu}</TableCell>
                      <TableCell>{item.firma_adi}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error">
                          {item.hata}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );

  // Yeni parça oluşturma modalı
  const renderYeniParcaModal = () => (
    <Dialog
      open={yeniParcaModalOpen}
      onClose={() => setYeniParcaModalOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Yeni Parça Oluştur
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Parça Kodu"
              value={yeniParcaData.parcaKodu}
              onChange={(e) => setYeniParcaData({...yeniParcaData, parcaKodu: e.target.value})}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Parça Adı"
              value={yeniParcaData.parcaAdi}
              onChange={(e) => setYeniParcaData({...yeniParcaData, parcaAdi: e.target.value})}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Stok Adeti"
              type="number"
              value={yeniParcaData.stokAdeti}
              onChange={(e) => setYeniParcaData({...yeniParcaData, stokAdeti: parseInt(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Kritik Stok"
              type="number"
              value={yeniParcaData.kritik_stok}
              onChange={(e) => setYeniParcaData({...yeniParcaData, kritik_stok: parseInt(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Tedarik Bedeli"
              type="number"
              value={yeniParcaData.tedarikBedeli}
              onChange={(e) => setYeniParcaData({...yeniParcaData, tedarikBedeli: parseFloat(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Ham Malzeme Cinsi"
              value={yeniParcaData.hamMalzemeCinsi}
              onChange={(e) => setYeniParcaData({...yeniParcaData, hamMalzemeCinsi: e.target.value})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Ham Malzeme Ölçüleri"
              value={yeniParcaData.hamMalzemeOlculeri}
              onChange={(e) => setYeniParcaData({...yeniParcaData, hamMalzemeOlculeri: e.target.value})}
              fullWidth
              helperText="Excel'den: Malzeme Kesiti + Uzunluk"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Fason Maliyeti"
              type="number"
              value={yeniParcaData.fasonMaliyeti}
              onChange={(e) => setYeniParcaData({...yeniParcaData, fasonMaliyeti: parseFloat(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Şirket İçi Maliyeti"
              type="number"
              value={yeniParcaData.sirketIciMaliyeti}
              onChange={(e) => setYeniParcaData({...yeniParcaData, sirketIciMaliyeti: parseFloat(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Setup Sayısı"
              type="number"
              value={yeniParcaData.setupSayisi}
              onChange={(e) => setYeniParcaData({...yeniParcaData, setupSayisi: parseInt(e.target.value) || 0})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={yeniParcaData.imalMi}
                  onChange={(e) => setYeniParcaData({...yeniParcaData, imalMi: e.target.checked})}
                />
              }
              label="İmal Edilecek Mi?"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setYeniParcaModalOpen(false)}>
          İptal
        </Button>
        <Button 
          variant="contained"
          onClick={handleSaveNewParca}
          disabled={!yeniParcaData.parcaKodu || !yeniParcaData.parcaAdi || parcaKaydetmeLoading}
        >
          {parcaKaydetmeLoading ? 'Kaydediliyor...' : 'Parçayı Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        Teklif Import
      </DialogTitle>
      
      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Excel Dosyası Yükleme</StepLabel>
            <StepContent>
              {renderUploadStep()}
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Veri Kontrol ve Düzenleme</StepLabel>
            <StepContent>
              {renderEditStep()}
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Teklifleri Kaydetme</StepLabel>
            <StepContent>
              <Box sx={{ p: 2 }}>
                <Typography>
                  Teklifler veritabanına kaydedilmeye hazır. 
                  Toplam {editableData.reduce((total, item) => total + item.firmalar.length, 0)} teklif kaydı oluşturulacak.
                </Typography>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>Import Raporu</StepLabel>
            <StepContent>
              {renderImportResults()}
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
      
      <DialogActions>
        {activeStep === 0 && (
          <>
            <Button onClick={handleClose}>İptal</Button>
            <Button 
              variant="contained" 
              onClick={handleFileUpload}
              disabled={!file || loading}
            >
              Yükle ve İşle
            </Button>
          </>
        )}
        
        {activeStep === 1 && (
          <>
            <Button 
              onClick={() => setActiveStep(0)}
              sx={{ mb: 2 }}
            >
              Geri
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setActiveStep(2)}
              sx={{ mb: 2, ml: 1 }}
              disabled={editableData.length === 0}
            >
              Devam Et
            </Button>
          </>
        )}
        
        {activeStep === 2 && (
          <>
            <Button onClick={() => setActiveStep(1)}>Geri</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveTeklifler}
              disabled={loading}
            >
              Teklifleri Kaydet
            </Button>
          </>
        )}
        
        {activeStep === 3 && (
          <Button 
            variant="contained" 
            onClick={() => {
              onImportComplete();
              handleClose();
            }}
          >
            Kapat
          </Button>
        )}
      </DialogActions>
      
      {/* Yeni Parça Oluşturma Modal */}
      {renderYeniParcaModal()}
    </Dialog>
  );
};

export default TeklifImportModal;
