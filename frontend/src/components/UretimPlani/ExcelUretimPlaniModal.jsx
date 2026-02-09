import React, { useState, useCallback } from 'react';
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
    Paper,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Description as FileIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import axios from 'axios';
import ExcelParcaOlusturModal from './ExcelParcaOlusturModal';
import ExcelIsEmriParametreleriForm from './ExcelIsEmriParametreleriForm';

const ExcelUretimPlaniModal = ({ open, onClose, onSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [excelFile, setExcelFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // ExcelParcaOlusturModal için state'ler
    const [parcaOlusturModalOpen, setParcaOlusturModalOpen] = useState(false);
    const [selectedEksikParca, setSelectedEksikParca] = useState(null);

    // İş emri parametreleri state'leri
    const [isEmriParametreleri, setIsEmriParametreleri] = useState(null);

    const steps = ['Excel Yükle', 'Veri Analizi', 'Parça Kontrolü', 'İş Emri Parametreleri', 'Sonuç'];

    // Excel dosyası yükleme için dropzone
    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        if (rejectedFiles.length > 0) {
            setError('Lütfen sadece Excel dosyası (.xlsx, .xls) yükleyin.');
            return;
        }

        const file = acceptedFiles[0];
        if (file) {
            setExcelFile(file);
            setError(null);
            parseExcelFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1,
        multiple: false
    });

    // Excel dosyasını parse et
    const parseExcelFile = async (file) => {
        setLoading(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // JSON'a dönüştür
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            
            // Veriyi analiz et ve temizle
            const analyzedData = analyzeExcelData(rawData);
            setParsedData(analyzedData);
            setActiveStep(1);
            
        } catch (err) {
            console.error('Excel parse hatası:', err);
            setError('Excel dosyası okunurken hata oluştu. Dosya formatını kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    // Excel verisini analiz et
    const analyzeExcelData = (rawData) => {
        console.log('Raw Excel data:', rawData);
        
        // Başlık satırını bul (ADET ve PARÇA ADI içeren satır)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawData.length, 10); i++) {
            const row = rawData[i];
            if (row && row.length > 1) {
                const rowStr = row.join('').toUpperCase();
                if (rowStr.includes('ADET') && (rowStr.includes('PARÇA') || rowStr.includes('PARCA'))) {
                    headerRowIndex = i;
                    break;
                }
            }
        }

        if (headerRowIndex === -1) {
            throw new Error('Excel dosyasında ADET ve PARÇA ADI sütunları bulunamadı!');
        }

        const headers = rawData[headerRowIndex];
        const dataRows = rawData.slice(headerRowIndex + 1);

        // Sütun indekslerini bul
        const adetIndex = headers.findIndex(h => 
            h && h.toString().toUpperCase().includes('ADET')
        );
        const parcaAdiIndex = headers.findIndex(h => 
            h && (h.toString().toUpperCase().includes('PARÇA') || h.toString().toUpperCase().includes('PARCA'))
        );
        const kesitIndex = headers.findIndex(h => 
            h && h.toString().toUpperCase().includes('KESIT')
        );
        const boyIndex = headers.findIndex(h => 
            h && h.toString().toUpperCase().includes('BOY')
        );
        const malzemeIndex = headers.findIndex(h => 
            h && (h.toString().toUpperCase().includes('MALZEME') || h.toString().toUpperCase().includes('MAZLEME'))
        );

        if (adetIndex === -1 || parcaAdiIndex === -1) {
            throw new Error('ADET veya PARÇA ADI sütunu bulunamadı!');
        }

        // Veriyi işle
        const processedData = [];
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            
            if (!row || row.length === 0) continue;
            
            const adet = row[adetIndex];
            const parcaAdi = row[parcaAdiIndex];
            
            // Adet ve parça adı boş olanları atla
            if (!adet || !parcaAdi || adet.toString().trim() === '' || parcaAdi.toString().trim() === '') {
                continue;
            }

            const item = {
                satirNo: i + 1,
                adet: parseInt(adet) || 0,
                parcaAdi: parcaAdi.toString().trim(),
                kesit: kesitIndex !== -1 ? (row[kesitIndex] || '').toString().trim() : '',
                boy: boyIndex !== -1 ? (row[boyIndex] || '').toString().trim() : '',
                malzeme: malzemeIndex !== -1 ? (row[malzemeIndex] || '').toString().trim() : ''
            };

            if (item.adet > 0 && item.parcaAdi) {
                processedData.push(item);
            }
        }

        const analysis = {
            totalRows: processedData.length,
            totalQuantity: processedData.reduce((sum, item) => sum + item.adet, 0),
            uniqueParts: [...new Set(processedData.map(item => item.parcaAdi))].length,
            hasKesit: processedData.some(item => item.kesit),
            hasBoy: processedData.some(item => item.boy),
            hasMalzeme: processedData.some(item => item.malzeme),
            data: processedData.slice(0, 50) // İlk 50 satırı göster
        };

        console.log('Analyzed data:', analysis);
        return analysis;
    };

    // Parça kontrolü yap
    const handleParcaKontrolu = async () => {
        if (!parsedData || !parsedData.data) return;

        setLoading(true);
        setError(null);

        try {
            // Her parça için veritabanında kontrol et
            const parcaKodlari = [...new Set(parsedData.data.map(item => item.parcaAdi))];
            
            const response = await axios.post('/api/parcalar/batch-check', {
                parcaKodlari: parcaKodlari
            });

            if (response.data && Array.isArray(response.data)) {
                const results = response.data;
                
                // Mevcut ve eksik parçaları ayır
                const mevcutParcalar = results.filter(r => r.mevcutMu).map(r => r.parcaKodu);
                const eksikParcalar = results.filter(r => !r.mevcutMu).map(r => r.parcaKodu);
                
                // Analiz sonucunu güncelle
                const updatedData = parsedData.data.map(item => {
                    const parcaResult = results.find(r => r.parcaKodu === item.parcaAdi);
                    return {
                        ...item,
                        parcaExists: parcaResult?.mevcutMu || false,
                        needsCreation: !parcaResult?.mevcutMu,
                        parcaDetay: parcaResult?.parcaDetay || null,
                        hamMalzemeStokKarti: parcaResult?.hamMalzemeStokKarti || null
                    };
                });

                const analysisWithCheck = {
                    ...parsedData,
                    data: updatedData,
                    mevcutParcalar: mevcutParcalar,
                    eksikParcalar: eksikParcalar,
                    mevcutSayisi: mevcutParcalar.length,
                    eksikSayisi: eksikParcalar.length,
                    results: results // Detaylı sonuçlar
                };

                setAnalysisResult(analysisWithCheck);
                setActiveStep(2);
            } else {
                throw new Error('API\'den geçersiz yanıt geldi');
            }
        } catch (err) {
            console.error('Parça kontrolü hatası:', err);
            setError('Parça kontrolü yapılırken hata oluştu: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Modal'ı sıfırla
    const handleClose = () => {
        setActiveStep(0);
        setExcelFile(null);
        setParsedData(null);
        setAnalysisResult(null);
        setError(null);
        setLoading(false);
        setIsEmriParametreleri(null);
        setParcaOlusturModalOpen(false);
        setSelectedEksikParca(null);
        onClose();
    };

    // Dosya yükleme alanı
    const renderFileUpload = () => (
        <Box sx={{ p: 3 }}>
            <Paper
                {...getRootProps()}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                    }
                }}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Dosyayı buraya bırakın' : 'Excel dosyasını sürükleyin veya tıklayın'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Desteklenen formatlar: .xlsx, .xls
                </Typography>
            </Paper>

            {excelFile && (
                <Box sx={{ mt: 2 }}>
                    <Alert severity="info" icon={<FileIcon />}>
                        <strong>Seçilen Dosya:</strong> {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
                    </Alert>
                </Box>
            )}

            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                    📋 Beklenen Excel Formatı:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ADET</TableCell>
                                <TableCell>PARÇA ADI</TableCell>
                                <TableCell>KESIT</TableCell>
                                <TableCell>BOY</TableCell>
                                <TableCell>MALZEME</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>20</TableCell>
                                <TableCell>EPEO_KSC-002</TableCell>
                                <TableCell>40X25</TableCell>
                                <TableCell>45</TableCell>
                                <TableCell>SOĞUK</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        </Box>
    );

    // Veri analizi sonuçları
    const renderDataAnalysis = () => (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📊 Özet Bilgiler
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary="Toplam Satır" 
                                        secondary={parsedData?.totalRows || 0} 
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary="Toplam Adet" 
                                        secondary={parsedData?.totalQuantity || 0} 
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary="Benzersiz Parça" 
                                        secondary={parsedData?.uniqueParts || 0} 
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🔍 Veri Kalitesi
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        {parsedData?.hasKesit ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                                    </ListItemIcon>
                                    <ListItemText primary="Kesit Bilgisi" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        {parsedData?.hasBoy ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                                    </ListItemIcon>
                                    <ListItemText primary="Boy Bilgisi" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon>
                                        {parsedData?.hasMalzeme ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                                    </ListItemIcon>
                                    <ListItemText primary="Malzeme Bilgisi" />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    📋 Veri Önizleme (İlk 10 Satır)
                </Typography>
                <Paper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Satır</TableCell>
                                <TableCell>Adet</TableCell>
                                <TableCell>Parça Adı</TableCell>
                                <TableCell>Kesit</TableCell>
                                <TableCell>Boy</TableCell>
                                <TableCell>Malzeme</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {parsedData?.data?.slice(0, 10).map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.satirNo}</TableCell>
                                    <TableCell>{item.adet}</TableCell>
                                    <TableCell>{item.parcaAdi}</TableCell>
                                    <TableCell>{item.kesit || '-'}</TableCell>
                                    <TableCell>{item.boy || '-'}</TableCell>
                                    <TableCell>{item.malzeme || '-'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        </Box>
    );

    // Parça kontrolü sonuçları
    const renderPartCheck = () => (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="success.main">
                                ✅ Mevcut Parçalar ({analysisResult?.mevcutSayisi || 0})
                            </Typography>
                            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                {analysisResult?.mevcutParcalar?.map((parca, index) => (
                                    <Chip 
                                        key={index} 
                                        label={parca} 
                                        color="success" 
                                        variant="outlined" 
                                        size="small" 
                                        sx={{ m: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="warning.main">
                                ⚠️ Oluşturulacak Parçalar ({analysisResult?.eksikSayisi || 0})
                            </Typography>
                            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                {analysisResult?.eksikParcalar?.map((parca, index) => {
                                    // Parsed data'da bu parçanın detaylarını bul
                                    const parcaDetay = parsedData?.data?.find(item => item.parcaAdi === parca);
                                    
                                    return (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Chip 
                                                label={parca} 
                                                color="warning" 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ mr: 1 }}
                                            />
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => {
                                                    setSelectedEksikParca(parcaDetay);
                                                    setParcaOlusturModalOpen(true);
                                                }}
                                                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                                            >
                                                Oluştur
                                            </Button>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                    <Typography variant="body2">
                        Eksik parçalar otomatik olarak oluşturulacak ve kesit, boy, malzeme bilgileri Excel'den alınacaktır.
                        Akıllı malzeme eşleştirme algoritması kullanılacaktır.
                    </Typography>
                </Alert>
            </Box>
        </Box>
    );

    // İş emri parametreleri ekranı
    const renderIsEmriParametreleri = () => {
        // Mevcut parçalar için liste hazırla
        const parcaListesi = parsedData?.data?.filter(item => 
            analysisResult?.mevcutParcalar?.includes(item.parcaAdi)
        ) || [];

        return (
            <ExcelIsEmriParametreleriForm
                parcaListesi={parcaListesi}
                onParametersChange={setIsEmriParametreleri}
                initialParameters={isEmriParametreleri}
            />
        );
    };

    // Parametrelerin geçerliliğini kontrol et
    const isValidParametreler = () => {
        if (!isEmriParametreleri) return false;
        
        // Temel alanları kontrol et
        if (!isEmriParametreleri.teslimTarihi) return false;
        if (!isEmriParametreleri.oncelik) return false;
        
        // Üretim planı seçimi varsa kontrol et
        if (isEmriParametreleri.uretimPlaniSecimi === 'mevcut') {
            return !!isEmriParametreleri.mevcutPlanId;
        } else if (isEmriParametreleri.uretimPlaniSecimi === 'yeni') {
            return !!isEmriParametreleri.yeniPlanAdi?.trim();
        }
        
        // Üretim planı seçimi yapılmamışsa da geçerli (sadece iş emri oluştur)
        return true;
    };

    // İş emri taslakları oluştur
    const handleIsEmriOlustur = async () => {
        setLoading(true);
        setError(null);

        try {
            // Excel verisini backend'in beklediği formata çevir
            const uretimPlaniData = parsedData?.data?.map(item => ({
                Item: item.parcaAdi, // parcaAdi -> Item
                Adet: item.adet,     // adet -> Adet  
                Malzemesi: item.malzeme || 'Belirtilmemiş', // malzeme -> Malzemesi
                // Ek alanlar varsa buraya eklenebilir
                Kesit: item.kesit,
                Boy: item.boy
            })) || [];

            console.log('Backend\'e gönderilecek üretim planı verisi:', uretimPlaniData);

            // Taslak oluşturma API endpoint'ini kullan
            const response = await axios.post('/api/is-emri-taslaklari/create-from-excel', {
                uretimPlani: uretimPlaniData,
                uretimPlaniId: isEmriParametreleri?.uretimPlaniId
            });

            if (response.data.success) {
                setActiveStep(4); // Sonuç ekranına geç
                
                // Taslak yönetimi sayfasına yönlendirme için oturum ID'sini döndür
                onSuccess && onSuccess({
                    message: response.data.message,
                    oturum_id: response.data.data.oturum_id,
                    taslak_sayisi: response.data.data.taslak_sayisi,
                    isEmriTaslakOlusturuldu: true
                });
            } else {
                throw new Error('İş emri taslakları oluşturulurken hata oluştu');
            }

        } catch (err) {
            console.error('İş emri taslağı oluşturma hatası:', err);
            setError(err.response?.data?.error || err.response?.data?.details || err.message || 'İş emri taslakları oluşturulurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Sonuç ekranı
    const renderResult = () => (
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
                ✅ İş Emri Taslakları Başarıyla Oluşturuldu!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Excel'den okunan parçalar için iş emri taslakları oluşturuldu. 
                Şimdi bu taslakları gözden geçirebilir, düzenleyebilir ve yayınlayabilirsiniz.
            </Typography>
            <Typography variant="body2" color="textSecondary">
                Taslakları gözden geçirmek ve yayınlamak için "Taslakları Yönet" butonuna tıklayın.
            </Typography>
        </Box>
    );

    return (
        <>
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                📊 Excel'den Üretim Planı Oluştur
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && (
                    <>
                        {activeStep === 0 && renderFileUpload()}
                        {activeStep === 1 && renderDataAnalysis()}
                        {activeStep === 2 && renderPartCheck()}
                        {activeStep === 3 && renderIsEmriParametreleri()}
                        {activeStep === 4 && renderResult()}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    {activeStep === 4 ? 'Kapat' : 'İptal'}
                </Button>
                
                {activeStep === 1 && parsedData && (
                    <Button 
                        variant="contained" 
                        onClick={handleParcaKontrolu}
                        disabled={loading}
                    >
                        Parça Kontrolü Yap
                    </Button>
                )}
                
                {activeStep === 2 && analysisResult && (
                    <Button 
                        variant="contained" 
                        onClick={() => setActiveStep(3)}
                        disabled={loading || (analysisResult.eksikSayisi > 0)}
                    >
                        İş Emri Parametreleri
                    </Button>
                )}

                {activeStep === 3 && (
                    <Button 
                        variant="contained" 
                        onClick={handleIsEmriOlustur}
                        disabled={loading || !isValidParametreler()}
                    >
                        İş Emri Taslakları Oluştur
                    </Button>
                )}
            </DialogActions>
        </Dialog>
        
        {/* Excel Parça Oluştur Modal */}
        <ExcelParcaOlusturModal
            open={parcaOlusturModalOpen}
            onClose={() => {
                setParcaOlusturModalOpen(false);
                setSelectedEksikParca(null);
            }}
            parcaDetay={selectedEksikParca}
            onSuccess={(parcaData) => {
                console.log('Parça başarıyla oluşturuldu:', parcaData);
                setParcaOlusturModalOpen(false);
                setSelectedEksikParca(null);
                
                // Parça kontrolünü tekrar yap (oluşturulan parça artık mevcut olacak)
                if (parsedData) {
                    handleParcaKontrolu();
                }
            }}
        />
        </>
    );
};

export default ExcelUretimPlaniModal;
