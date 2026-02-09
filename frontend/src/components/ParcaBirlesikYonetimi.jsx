import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Merge as MergeIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from 'axios';
import ParcaBirlestirmeGecmisi from './ParcaBirlestirmeGecmisi';

const ParcaBirlesikYonetimi = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tekrarliGruplar, setTekrarliGruplar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrup, setSelectedGrup] = useState(null);
  const [birlestirmeDialogAcik, setBirlestirmeDialogAcik] = useState(false);
  const [onizleme, setOnizleme] = useState(null);
  const [onizlemeLoading, setOnizlemeLoading] = useState(false);
  const [birlestirmeLoading, setBirlestirmeLoading] = useState(false);
  const [tutulanParca, setTutulanParca] = useState(null);
  const [silinenParcalar, setSilinenParcalar] = useState([]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchTekrarliParcalar();
    }
  }, [activeTab]);

  const fetchTekrarliParcalar = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/parca-birlesik/tekrarli-parcalar');
      
      if (response.data.success) {
        setTekrarliGruplar(response.data.data);
      } else {
        setError('Tekrarlı parçalar yüklenemedi');
      }
    } catch (err) {
      console.error('Tekrarlı parça yükleme hatası:', err);
      setError('Tekrarlı parçalar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBirlestirmeBaslat = (grup) => {
    setSelectedGrup(grup);
    // İlk parçayı varsayılan olarak tutulan parça yap (en çok bağlı veriye sahip olan)
    setTutulanParca(grup.parcalar[0]);
    setSilinenParcalar(grup.parcalar.slice(1));
    setBirlestirmeDialogAcik(true);
  };

  const handleOnizlemeOlustur = async () => {
    if (!tutulanParca || silinenParcalar.length === 0) return;

    try {
      setOnizlemeLoading(true);
      const response = await axios.post('/api/parca-birlesik/birlestirme-onizleme', {
        tutulan_parca_kodu: tutulanParca.parcaKodu,
        silinen_parca_kodlari: silinenParcalar.map(p => p.parcaKodu)
      });

      if (response.data.success) {
        setOnizleme(response.data.data);
      }
    } catch (err) {
      console.error('Önizleme oluşturma hatası:', err);
      setError('Önizleme oluşturulurken hata oluştu');
    } finally {
      setOnizlemeLoading(false);
    }
  };

  const handleBirlestir = async () => {
    if (!tutulanParca || silinenParcalar.length === 0) return;

    try {
      setBirlestirmeLoading(true);
      const response = await axios.post('/api/parca-birlesik/birlestir', {
        tutulan_parca_kodu: tutulanParca.parcaKodu,
        silinen_parca_kodlari: silinenParcalar.map(p => p.parcaKodu),
        yeni_parca_bilgileri: {
          // Tutulan parçanın mevcut bilgileri korunacak
        }
      });

      if (response.data.success) {
        alert('Parça birleştirme işlemi başarıyla tamamlandı!');
        setBirlestirmeDialogAcik(false);
        setSelectedGrup(null);
        setOnizleme(null);
        fetchTekrarliParcalar(); // Listeyi yenile
      }
    } catch (err) {
      console.error('Birleştirme hatası:', err);
      setError('Birleştirme işlemi sırasında hata oluştu');
    } finally {
      setBirlestirmeLoading(false);
    }
  };

  const handleParcaSecimi = (parca, secimTipi) => {
    if (secimTipi === 'tutulan') {
      setTutulanParca(parca);
      // Seçilen parçayı silinen parçalardan çıkar
      setSilinenParcalar(selectedGrup.parcalar.filter(p => p.parcaKodu !== parca.parcaKodu));
    } else {
      // Silinen parça listesini güncelle
      const mevcutSilinenler = silinenParcalar.filter(p => p.parcaKodu !== parca.parcaKodu);
      setSilinenParcalar([...mevcutSilinenler, parca]);
      // Eğer tutulan parça silinen listesine eklendiyse, yeni tutulan parça seç
      if (tutulanParca && tutulanParca.parcaKodu === parca.parcaKodu) {
        const kalanParcalar = selectedGrup.parcalar.filter(p => 
          p.parcaKodu !== parca.parcaKodu && 
          !mevcutSilinenler.some(s => s.parcaKodu === p.parcaKodu)
        );
        if (kalanParcalar.length > 0) {
          setTutulanParca(kalanParcalar[0]);
        }
      }
    }
    setOnizleme(null); // Önizlemeyi sıfırla
  };

  const getBagliVeriToplamText = (bagliVeriler) => {
    if (!bagliVeriler) return '0';
    return `${bagliVeriler.toplam} (İE: ${bagliVeriler.is_emirleri}, BOM: ${bagliVeriler.bom_kayitlari}, PK: ${bagliVeriler.parca_kayitlari})`;
  };

  const getRiskSeviyesi = (bagliVeriSayisi) => {
    if (bagliVeriSayisi === 0) return { seviye: 'düşük', renk: 'success' };
    if (bagliVeriSayisi < 10) return { seviye: 'orta', renk: 'warning' };
    return { seviye: 'yüksek', renk: 'error' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Tekrarlı parçalar analiz ediliyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchTekrarliParcalar} sx={{ ml: 2 }}>
          Tekrar Dene
        </Button>
      </Alert>
    );
  }

  const renderTekrarliParcalarTab = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Tekrarlı parçalar analiz ediliyor...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
          <Button onClick={fetchTekrarliParcalar} sx={{ ml: 2 }}>
            Tekrar Dene
          </Button>
        </Alert>
      );
    }

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Bu modül sayesinde:</strong> Sistem içinde tekrarlanan parçaları tespit edebilir, 
          bunları birleştirerek veri bütünlüğünü sağlayabilirsiniz. Birleştirme işlemi sırasında 
          tüm ilişkili veriler (iş emirleri, BOM kayıtları, parça kayıtları) seçilen parçaya aktarılır.
        </Alert>

        {tekrarliGruplar.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Tekrarlı Parça Bulunamadı
              </Typography>
              <Typography color="text.secondary">
                Sistemde tekrarlı parça tespit edilmedi. Veri bütünlüğünüz korunmuş durumda.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {tekrarliGruplar.map((grup, index) => (
              <Grid item xs={12} key={index}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Badge badgeContent={grup.parca_sayisi} color="primary" sx={{ mr: 2 }}>
                        <WarningIcon color="warning" />
                      </Badge>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Tekrarlı Grup #{index + 1}
                      </Typography>
                      <Chip 
                        label={`${grup.parca_sayisi} parça`} 
                        color="warning" 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<MergeIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBirlestirmeBaslat(grup);
                        }}
                      >
                        Birleştir
                      </Button>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Parça Kodu</TableCell>
                            <TableCell>Parça Adı</TableCell>
                            <TableCell>Kategori</TableCell>
                            <TableCell>Stok Adeti</TableCell>
                            <TableCell>Bağlı Veriler</TableCell>
                            <TableCell>Risk</TableCell>
                            <TableCell>İşlemler</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {grup.parcalar.map((parca) => {
                            const risk = getRiskSeviyesi(parca.bagliVeriler.toplam);
                            return (
                              <TableRow key={parca.parcaKodu}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {parca.parcaKodu}
                                  </Typography>
                                </TableCell>
                                <TableCell>{parca.parcaAdi}</TableCell>
                                <TableCell>
                                  <Chip label={parca.kategori || 'Kategorisiz'} size="small" />
                                </TableCell>
                                <TableCell>{parca.stokAdeti}</TableCell>
                                <TableCell>
                                  <Tooltip title={getBagliVeriToplamText(parca.bagliVeriler)}>
                                    <Chip 
                                      label={parca.bagliVeriler.toplam} 
                                      size="small"
                                      color={risk.renk}
                                    />
                                  </Tooltip>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={risk.seviye} 
                                    color={risk.renk} 
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Tooltip title="Detay Görüntüle">
                                    <IconButton size="small">
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Parça Birleştirme Yönetimi
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
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
        <Tab 
          label="Tekrarlı Parçalar" 
          icon={<MergeIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Birleştirme Geçmişi" 
          icon={<HistoryIcon />}
          iconPosition="start"
        />
      </Tabs>

      {activeTab === 0 && renderTekrarliParcalarTab()}
      {activeTab === 1 && <ParcaBirlestirmeGecmisi />}

      {/* Birleştirme Dialog'u */}
      <Dialog 
        open={birlestirmeDialogAcik} 
        onClose={() => setBirlestirmeDialogAcik(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <MergeIcon sx={{ mr: 1 }} />
            Parça Birleştirme İşlemi
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedGrup && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Dikkat:</strong> Bu işlem geri alınamaz! Seçilen parçalar silinecek ve 
                tüm ilişkili veriler tutulan parçaya aktarılacaktır.
              </Alert>

              <Typography variant="h6" gutterBottom>
                1. Hangi parça tutulacak seçin:
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedGrup.parcalar.map((parca) => (
                  <Grid item xs={12} md={6} key={parca.parcaKodu}>
                    <Card 
                      sx={{ 
                        border: tutulanParca?.parcaKodu === parca.parcaKodu ? 3 : 1,
                        borderColor: tutulanParca?.parcaKodu === parca.parcaKodu ? 'primary.main' : 'divider',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleParcaSecimi(parca, 'tutulan')}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {parca.parcaKodu}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {parca.parcaAdi}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Stok: {parca.stokAdeti} | 
                          Bağlı Veri: {parca.bagliVeriler.toplam}
                        </Typography>
                        {tutulanParca?.parcaKodu === parca.parcaKodu && (
                          <Chip label="Tutulacak" color="primary" size="small" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box display="flex" gap={2} sx={{ mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleOnizlemeOlustur}
                  disabled={!tutulanParca || silinenParcalar.length === 0 || onizlemeLoading}
                  startIcon={onizlemeLoading ? <CircularProgress size={20} /> : <InfoIcon />}
                >
                  Önizleme Oluştur
                </Button>
              </Box>

              {onizleme && (
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Birleştirme Önizlemesi
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Transfer Edilecek Stok:</Typography>
                        <Typography variant="h4" color="primary">
                          {onizleme.toplamlar.transfer_edilecek_stok}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">Etkilenecek Kayıt:</Typography>
                        <Typography variant="h4" color="warning.main">
                          {onizleme.toplamlar.toplam_etkilenen_kayit}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBirlestirmeDialogAcik(false)}
            disabled={birlestirmeLoading}
          >
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleBirlestir}
            disabled={!tutulanParca || silinenParcalar.length === 0 || !onizleme || birlestirmeLoading}
            startIcon={birlestirmeLoading ? <CircularProgress size={20} /> : <MergeIcon />}
          >
            {birlestirmeLoading ? 'Birleştiriliyor...' : 'Birleştir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParcaBirlesikYonetimi;