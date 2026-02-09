import React, { useState, useEffect } from 'react';
import getApiBaseUrl from '../utils/getApiBaseUrl';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  FolderOpen,
  Folder,
  Settings,
  Search,
  Assessment,
  InsertDriveFile,
  PictureAsPdf,
  Engineering,
  ExpandMore,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  Refresh,
  ArrowBack,
  Home,
  Download,
  Computer,
  CloudDownload
} from '@mui/icons-material';
import axios from 'axios';

const DizinTarama = () => {
  const [secilenDizin, setSecilenDizin] = useState('');
  const [dizinDialogAcik, setDizinDialogAcik] = useState(false);
  const [analizButonAktif, setAnalizButonAktif] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [analizSonucu, setAnalizSonucu] = useState(null);
  const [hata, setHata] = useState('');
  const [geciciDizinYolu, setGeciciDizinYolu] = useState('');
  const [mevcutYol, setMevcutYol] = useState('/');
  const [dizinler, setDizinler] = useState([]);
  const [expandedParts, setExpandedParts] = useState(new Set());
  const [dizinTarayiciAktif, setDizinTarayiciAktif] = useState(false);
  const [clientSonuclari, setClientSonuclari] = useState([]);
  const [kaydetmeDevamEdiyor, setKaydetmeDevamEdiyor] = useState(false);
  const [kaydetmeSonuclari, setKaydetmeSonuclari] = useState(null);

  // API base URL
  const API_BASE = `${getApiBaseUrl()}/dizin-tarama`;

  // 🆕 YENİ - Parçaları veritabanına kaydetme fonksiyonu
  const parcalariVeritabaninaKaydet = async (clientSonucu) => {
    if (!clientSonucu.parcaListesi || clientSonucu.parcaListesi.length === 0) {
      alert('Kaydedilecek parça bulunamadı!');
      return;
    }

    setKaydetmeDevamEdiyor(true);
    setKaydetmeSonuclari(null);

    try {
      // Parça listesini API formatına çevir
      const kaydedilecekParcalar = clientSonucu.parcaListesi.map(parca => ({
        fileName: parca.parcaAdi, // Parça adı dosya adı olarak kullanılacak
        parcaKodu: parca.parcaAdi, // Dosya adından parça kodu
        parcaAdi: parca.parcaAdi,  // Parça adı
        kaynak: 'dizin_tarama'
      }));

      console.log(`${kaydedilecekParcalar.length} parça kaydedilecek...`);

      const response = await fetch(`${API_BASE}/save-parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parts: kaydedilecekParcalar
        })
      });

      const result = await response.json();

      if (result.success) {
        setKaydetmeSonuclari(result.data);
        console.log('Parçalar başarıyla kaydedildi:', result.data);

        // Başarı mesajı
        alert(
          `✅ Kaydetme Tamamlandı!\n\n` +
          `📊 Toplam: ${result.data.requestedCount} parça\n` +
          `✅ Başarılı: ${result.data.successCount} parça\n` +
          `🆕 Yeni: ${result.data.createdCount} parça\n` +
          `🔄 Güncellenen: ${result.data.updatedCount} parça\n` +
          `⏱️ Süre: ${result.data.executionTime}\n` +
          `📈 Başarı Oranı: ${result.data.statistics.successRate.toFixed(1)}%`
        );
      } else {
        console.error('Kaydetme hatası:', result.error);
        alert(`❌ Kaydetme Hatası: ${result.error.message}`);
      }

    } catch (error) {
      console.error('Kaydetme işlemi sırasında hata:', error);
      alert(`❌ İletişim Hatası: ${error.message}`);
    } finally {
      setKaydetmeDevamEdiyor(false);
    }
  };

  // Dizin seçme dialog'unu aç
  const handleDizinSec = () => {
    setDizinDialogAcik(true);
    setGeciciDizinYolu(secilenDizin || '');
    setMevcutYol('/mnt');
    setDizinTarayiciAktif(false);
    setDizinler([]);
  };

  // Dizinleri listele
  const dizinleriListele = async (path) => {
    try {
      const response = await axios.post(`${API_BASE}/listele`, {
        parentPath: path
      });

      if (response.data.success) {
        setDizinler(response.data.data.directories);
        setMevcutYol(response.data.data.parentPath);
      } else {
        setHata('Dizin listeleme hatası: ' + response.data.message);
      }
    } catch (error) {
      console.error('Dizin listeleme hatası:', error);
      setHata('Dizin listeleme hatası: ' + error.message);
    }
  };

  // Dizin tarayıcısını aç/kapat
  const toggleDizinTarayici = () => {
    const newState = !dizinTarayiciAktif;
    setDizinTarayiciAktif(newState);
    if (newState) {
      dizinleriListele(mevcutYol);
    }
  };

  // Üst dizine git
  const ustDizineGit = () => {
    const parentPath = mevcutYol.split('/').slice(0, -1).join('/') || '/';
    setMevcutYol(parentPath);
    dizinleriListele(parentPath);
  };

  // Ana dizine git
  const anaDizineGit = () => {
    setMevcutYol('/mnt');
    dizinleriListele('/mnt');
  };

  // Dizine çift tıklama - içine gir
  const dizineGir = (dizinPath) => {
    setMevcutYol(dizinPath);
    dizinleriListele(dizinPath);
  };

  // Dizini seç
  const diziniSec = (dizinPath) => {
    setGeciciDizinYolu(dizinPath);
  };

  // SMB path'i mount path'e çevir
  const convertSmbPath = (path) => {
    if (path.startsWith('smb://')) {
      // smb://mzrktasarim.local/mzk%20makineler/ -> /mnt/mzk_makineler/
      const smbPath = path.replace('smb://mzrktasarim.local/mzk%20makineler', '/mnt/mzk_makineler');
      return decodeURIComponent(smbPath);
    }
    return path;
  };

  // Dizin seçimini onayla
  const handleDizinOnayla = async () => {
    if (!geciciDizinYolu.trim()) {
      setHata('Lütfen bir dizin yolu girin');
      return;
    }

    // SMB path'i mount path'e çevir
    const convertedPath = convertSmbPath(geciciDizinYolu.trim());

    setYukleniyor(true);
    setHata('');

    try {
      // Dizin varlığını kontrol et
      const response = await axios.post(`${API_BASE}/kontrol`, {
        dizinYolu: convertedPath
      });

      if (response.data.success) {
        setSecilenDizin(convertedPath);
        setAnalizButonAktif(true);
        setDizinDialogAcik(false);
        setAnalizSonucu(null); // Önceki analiz sonuçlarını temizle
      } else {
        setHata('Dizin hatası: ' + response.data.message);
      }
    } catch (error) {
      console.error('Dizin kontrolü hatası:', error);
      setHata('Dizin kontrolü hatası: ' + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  // Dizin analizini başlat
  const handleAnalizBaslat = async () => {
    if (!secilenDizin) {
      setHata('Önce bir dizin seçmelisiniz');
      return;
    }

    setYukleniyor(true);
    setHata('');

    try {
      const response = await axios.post(`${API_BASE}/analiz`, {
        dizinYolu: secilenDizin
      });

      if (response.data.success) {
        setAnalizSonucu(response.data.data);
      } else {
        setHata('Analiz hatası: ' + response.data.message);
      }
    } catch (error) {
      console.error('Dizin analizi hatası:', error);
      setHata('Dizin analizi hatası: ' + error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  // Parça detaylarını genişlet/daralt
  const togglePartExpansion = (partName) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partName)) {
      newExpanded.delete(partName);
    } else {
      newExpanded.add(partName);
    }
    setExpandedParts(newExpanded);
  };

  // Dosya türü ikonu
  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    switch (extension) {
      case 'sldprt':
        return <Engineering color="primary" />;
      case 'slddrw':
        return <InsertDriveFile color="secondary" />;
      case 'pdf':
        return <PictureAsPdf color="error" />;
      default:
        return <InsertDriveFile />;
    }
  };

  // Durum rengi
  const getStatusColor = (has3D, hasDrawing, hasPDF) => {
    if (has3D && hasDrawing && hasPDF) return 'success';
    if (has3D && (hasDrawing || hasPDF)) return 'warning';
    return 'error';
  };

  // Durum metni
  const getStatusText = (has3D, hasDrawing, hasPDF) => {
    if (has3D && hasDrawing && hasPDF) return 'Tam';
    if (has3D && (hasDrawing || hasPDF)) return 'Kısmi';
    return 'Eksik';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📁 Dizin Tarama
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        CAD dosyalarını tarayarak parça bazlı gruplandırma ve analiz yapın.
      </Typography>

      {/* Client Download Bölümü */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Computer color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" color="primary">
            💻 Client Uygulamaları
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 3 }}>
          Kullanıcı bilgisayarından dizin tarama işlemi yapmak için client uygulamalarını indirin. İki farklı versiyon mevcuttur:
        </Typography>

        {/* Python Client */}
        <Box sx={{ mb: 3, p: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="success.main" sx={{ mr: 1 }}>
              🐍 Python Client (v1.2.12) - Stabil
            </Typography>
            <Chip label="ÖNERİLEN" color="success" size="small" />
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Üretim kullanımı için hazır.</strong> Python 3.8+ tabanlı, tüm özellikler tam fonksiyonel.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  ⚡ Hızlı Kurulum:
                </Typography>
                <Typography variant="body2" component="div">
                  1. <strong>Python 3.8+</strong> kurun (PATH'e eklemeyi unutmayın)<br/>
                  2. Client dosyalarını indirin ve çıkartın<br/>
                  3. <code style={{backgroundColor: '#f5f5f5', padding: '2px 4px'}}>DZNTRM_python/install.bat</code> yönetici olarak çalıştırın<br/>
                  4. <code style={{backgroundColor: '#f5f5f5', padding: '2px 4px'}}>DZNTRM_python/run.bat</code> ile programı başlatın
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CloudDownload />}
                  size="large"
                  fullWidth
                  onClick={() => window.open('/api/download/dizin-tarama-python-client', '_blank')}
                >
                  Python Client İndir
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  size="small"
                  fullWidth
                  onClick={() => window.open('/api/download/dizin-tarama-python-rehber', '_blank')}
                >
                  Python Kurulum Rehberi
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
            <Typography variant="body2" component="div">
              <strong>Özellikler:</strong><br/>
              ✅ Platform bağımsız (Windows/Linux/macOS)<br/>
              ✅ Tüm özellikler tam fonksiyonel<br/>
              ✅ 2 saniyelik gecikmeli otomatik resim yükleme<br/>
              ✅ Tıklanabilir CAD dosya linkleri<br/>
              ✅ Hafif ve hızlı performans
            </Typography>
          </Box>
        </Box>

        {/* C# Client */}
        <Box sx={{ p: 3, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="info.main" sx={{ mr: 1 }}>
              🔷 C# Client (v1.0.0) - Yeni
            </Typography>
            <Chip label="MODERN" color="info" size="small" />
            <Chip label="BETA" color="warning" size="small" />
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Modern alternatif.</strong> C# 10+ / .NET 8.0 tabanlı, enterprise-level mimari.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  🚀 Modern Kurulum:
                </Typography>
                <Typography variant="body2" component="div">
                  1. <strong>.NET 8.0 Runtime</strong> kurun<br/>
                  2. Client dosyalarını indirin ve çıkartın<br/>
                  3. <code style={{backgroundColor: '#f5f5f5', padding: '2px 4px'}}>DZNTRM_cs/build.bat</code> ile build edin<br/>
                  4. <code style={{backgroundColor: '#f5f5f5', padding: '2px 4px'}}>DZNTRM_cs/run.bat</code> ile programı başlatın
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<CloudDownload />}
                  size="large"
                  fullWidth
                  onClick={() => window.open('/api/download/dizin-tarama-csharp-client', '_blank')}
                >
                  C# Client İndir
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Info />}
                  size="small"
                  fullWidth
                  onClick={() => window.open('/api/download/dizin-tarama-csharp-rehber', '_blank')}
                >
                  C# Kurulum Rehberi
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
            <Typography variant="body2" component="div">
              <strong>Özellikler:</strong><br/>
              ✅ Modern Windows Forms arayüzü<br/>
              ✅ Enterprise-level mimari<br/>
              ✅ Asenkron işlemler ve Dependency Injection<br/>
              ✅ Gelişmiş hata yönetimi<br/>
              🚧 Geliştirme aşamasında
            </Typography>
          </Box>
        </Box>

        {/* Hangisini Seçmeli? */}
        <Alert severity="question" sx={{ mt: 2 }}>
          <Typography variant="body2" component="div">
            <strong>Hangisini seçmeliyim?</strong><br/>
            • <strong>Python Client:</strong> Mevcut sistemler için, acil üretim kullanımı, platform bağımsızlık gerektiren durumlar<br/>
            • <strong>C# Client:</strong> Yeni projeler için, Windows odaklı geliştirme, modern teknoloji yığını tercih edenler
          </Typography>
        </Alert>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Desteklenen dosya türleri:</strong> .sldprt (3D), .slddrw (Çizim), .pdf (Teknik Resim)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Boyutlar:</strong> Python ~90 KB | C# ~25 MB
          </Typography>
        </Box>
      </Paper>

      {/* Hata mesajı */}
      {hata && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setHata('')}>
          {hata}
        </Alert>
      )}

      {/* Sunucu tabanlı dizin seçimi ve analiz butonları */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Settings color="action" sx={{ mr: 1 }} />
          <Typography variant="h6">
            🖥️ Sunucu Tabanlı Tarama
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sunucu üzerindeki dizinleri taramak için bu bölümü kullanın (Linux/Unix sistemler için).
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<FolderOpen />}
                onClick={handleDizinSec}
                disabled={yukleniyor}
              >
                {secilenDizin ? 'Dizini Değiştir' : 'Dizin Seç'}
              </Button>

              {secilenDizin && (
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Seçilen dizin:
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    {secilenDizin}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Search />}
                onClick={handleAnalizBaslat}
                disabled={!analizButonAktif || yukleniyor}
                size="large"
              >
                Dizini Analiz Et
              </Button>

              {analizSonucu && (
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleAnalizBaslat}
                  disabled={yukleniyor}
                >
                  Yenile
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {yukleniyor && <LinearProgress sx={{ mt: 2 }} />}

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Uyarı:</strong> Sunucu tabanlı tarama sadece sunucunun erişebildiği dizinlerde çalışır.
          Windows ağ sürücüleri için yukarıdaki Client uygulamasını kullanın.
        </Alert>
      </Paper>

      {/* Analiz sonuçları */}
      {analizSonucu && (
        <Box>
          {/* İstatistikler */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom startIcon={<Assessment />}>
              📊 Analiz Özeti
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {analizSonucu.istatistikler.toplamParca}
                    </Typography>
                    <Typography variant="body2">
                      Toplam Parça
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {analizSonucu.istatistikler.tamDosyalar}
                    </Typography>
                    <Typography variant="body2">
                      Tam Dosyalar
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {analizSonucu.istatistikler.eksikDrawing}
                    </Typography>
                    <Typography variant="body2">
                      Eksik Drawing Dosyası
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {analizSonucu.istatistikler.eksikPDF}
                    </Typography>
                    <Typography variant="body2">
                      Eksik Teknik Resim Dosyası
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{analizSonucu.istatistikler.toplamSLDPRT}</Typography>
                  <Typography variant="body2">3D Çizim (.sldprt)</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{analizSonucu.istatistikler.toplamSLDDRW}</Typography>
                  <Typography variant="body2">Drawing Dosyası (.slddrw)</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{analizSonucu.istatistikler.toplamPDF}</Typography>
                  <Typography variant="body2">Teknik Resim Dosyası (.pdf)</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Parça listesi */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🔧 Parça Listesi ({analizSonucu.parcaListesi.length} adet)
            </Typography>

            <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
              {analizSonucu.parcaListesi.map((parca, index) => (
                <Accordion key={parca.parcaAdi} expanded={expandedParts.has(parca.parcaAdi)}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    onClick={() => togglePartExpansion(parca.parcaAdi)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                        {parca.parcaAdi}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={getStatusText(parca.has3D, parca.hasDrawing, parca.hasPDF)}
                          color={getStatusColor(parca.has3D, parca.hasDrawing, parca.hasPDF)}
                          size="small"
                        />

                        <Tooltip title="3D Çizim">
                          <Chip
                            icon={<Engineering />}
                            label={parca.sldprt.length}
                            size="small"
                            color={parca.has3D ? 'primary' : 'default'}
                          />
                        </Tooltip>

                        <Tooltip title="Drawing Dosyası">
                          <Chip
                            icon={<InsertDriveFile />}
                            label={parca.slddrw.length}
                            size="small"
                            color={parca.hasDrawing ? 'secondary' : 'default'}
                          />
                        </Tooltip>

                        <Tooltip title="Teknik Resim Dosyası">
                          <Chip
                            icon={<PictureAsPdf />}
                            label={parca.pdf.length}
                            size="small"
                            color={parca.hasPDF ? 'error' : 'default'}
                          />
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    <Box>
                      {/* 3D Çizim dosyaları */}
                      {parca.sldprt.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            🔧 3D Çizim Dosyaları ({parca.sldprt.length} adet)
                          </Typography>
                          <List dense>
                            {parca.sldprt.map((file, idx) => (
                              <ListItem key={idx} sx={{ pl: 2 }}>
                                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                                <ListItemText
                                  primary={file.split('/').pop()}
                                  secondary={file}
                                  primaryTypographyProps={{ fontFamily: 'monospace' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {/* Drawing dosyaları */}
                      {parca.slddrw.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="secondary" gutterBottom>
                            📐 Drawing Dosyaları ({parca.slddrw.length} adet)
                          </Typography>
                          <List dense>
                            {parca.slddrw.map((file, idx) => (
                              <ListItem key={idx} sx={{ pl: 2 }}>
                                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                                <ListItemText
                                  primary={file.split('/').pop()}
                                  secondary={file}
                                  primaryTypographyProps={{ fontFamily: 'monospace' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {/* Teknik resim dosyaları */}
                      {parca.pdf.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            📄 Teknik Resim Dosyaları ({parca.pdf.length} adet)
                          </Typography>
                          <List dense>
                            {parca.pdf.map((file, idx) => (
                              <ListItem key={idx} sx={{ pl: 2 }}>
                                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                                <ListItemText
                                  primary={file.split('/').pop()}
                                  secondary={file}
                                  primaryTypographyProps={{ fontFamily: 'monospace' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Paper>

          {/* Client Sonuçları */}
          {clientSonuclari.length > 0 && (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                📱 Client Tarama Sonuçları
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                Kullanıcı bilgisayarlarından gelen son tarama sonuçları:
              </Typography>

              {clientSonuclari.slice(0, 1000000).map((sonuc, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      📂 {sonuc.dizinYolu}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(sonuc.taramaZamani).toLocaleString('tr-TR')}
                    </Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {sonuc.istatistikler.scanMode === 'enhanced' ? (
                      // Enhanced statistics display
                      <>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.totalAssemblies}</strong><br/>
                            <small>Montaj</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.totalParts}</strong><br/>
                            <small>Parça</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.completeAssemblies}</strong><br/>
                            <small>Komple</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.standaloneParts}</strong><br/>
                            <small>Bağımsız</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.partsWith3D}</strong><br/>
                            <small>3D</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.totalFiles}</strong><br/>
                            <small>Dosya</small>
                          </Typography>
                        </Grid>
                      </>
                    ) : (
                      // Legacy statistics display
                      <>
                        <Grid item xs={3}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.toplamParca}</strong><br/>
                            <small>Parça</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.toplamDosya}</strong><br/>
                            <small>Dosya</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.tamDosyalar}</strong><br/>
                            <small>Tam</small>
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2" align="center">
                            <strong>{sonuc.istatistikler.eksikDrawing + sonuc.istatistikler.eksikPDF}</strong><br/>
                            <small>Eksik</small>
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>

                  {/* Scan Mode Badge */}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={sonuc.istatistikler.scanMode === 'enhanced' ? '🚀 Enhanced Mode' : '📊 Legacy Mode'}
                      color={sonuc.istatistikler.scanMode === 'enhanced' ? 'primary' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* 🆕 Kaydetme Butonu */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        💾 Veritabanı Kaydetme
                      </Typography>
                      {kaydetmeSonuclari && kaydetmeSonuclari.dizinYolu === sonuc.dizinYolu && (
                        <Chip
                          label="✅ Kaydedildi"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={kaydetmeDevamEdiyor ? <CircularProgress size={16} /> : '💾'}
                      onClick={() => parcalariVeritabaninaKaydet(sonuc)}
                      disabled={kaydetmeDevamEdiyor}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      {kaydetmeDevamEdiyor
                        ? `${sonuc.parcaListesi?.length || 0} parça kaydediliyor...`
                        : `${sonuc.parcaListesi?.length || 0} parçayı veritabanına kaydet`
                      }
                    </Button>

                    {/* Kaydetme sonuçları */}
                    {kaydetmeSonuclari && kaydetmeSonuclari.dizinYolu === sonuc.dizinYolu && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1, fontSize: '0.8rem' }}>
                        <Typography variant="body2" color="success.main">
                          ✅ {kaydetmeSonuclari.successCount}/{kaydetmeSonuclari.requestedCount} parça kaydedildi
                          ({kaydetmeSonuclari.createdCount} yeni, {kaydetmeSonuclari.updatedCount} güncellendi)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      )}

      {/* Dizin seçme dialog'u */}
      <Dialog
        open={dizinDialogAcik}
        onClose={() => setDizinDialogAcik(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Dizin Seçin</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Dizin Yolu"
              value={geciciDizinYolu}
              onChange={(e) => setGeciciDizinYolu(e.target.value)}
              placeholder="/mnt/smb_share/folder"
              helperText="Manuel olarak dizin yolu girin (SMB: smb://server/share/path) veya aşağıdaki tarayıcıyı kullanın"
            />
          </Box>

          {/* Dizin tarayıcısı toggle */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button
              variant={dizinTarayiciAktif ? "contained" : "outlined"}
              startIcon={<Folder />}
              onClick={toggleDizinTarayici}
            >
              {dizinTarayiciAktif ? 'Tarayıcıyı Gizle' : 'Dizin Tarayıcısı'}
            </Button>

            {dizinTarayiciAktif && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={anaDizineGit}
                  size="small"
                >
                  /mnt
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={ustDizineGit}
                  disabled={mevcutYol === '/' || mevcutYol === ''}
                  size="small"
                >
                  Geri
                </Button>
              </>
            )}
          </Box>

          {/* Dizin tarayıcı içeriği */}
          {dizinTarayiciAktif && (
            <Box sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              mb: 2,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderBottomColor: 'grey.300' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                  Mevcut Konum: {mevcutYol}
                </Typography>
              </Box>

              <List dense>
                {dizinler.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="Dizin boş veya erişilemiyor" />
                  </ListItem>
                ) : (
                  dizinler.map((dizin, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => diziniSec(dizin.path)}
                      onDoubleClick={() => dizineGir(dizin.path)}
                      selected={geciciDizinYolu === dizin.path}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        '&.Mui-selected': { bgcolor: 'primary.light' }
                      }}
                    >
                      <ListItemIcon>
                        <Folder color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={dizin.name}
                        secondary={`Çift tıklayın: İçine gir | Tek tıklayın: Seç`}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Box>
          )}

          {!dizinTarayiciAktif && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Örnek dizin yolları:
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  /mnt/mzk_makineler/KALINLIK_MAKINESI<br/>
                  /mnt/ripper_fr/R532<br/>
                  smb://mzrktasarim.local/mzk%20makineler/CIZICILI_YATAR_DAIRE_MAKINELERI<br/>
                  /home/user/cad_files
                </Typography>
              </Box>
            </>
          )}

          {/* Kullanıcıya bilgi */}
          <Alert severity="info">
            SMB paylaşımları önce mount edilmelidir. IPTAL klasörleri otomatik olarak filtrelenir.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDizinDialogAcik(false)}>
            İptal
          </Button>
          <Button
            onClick={handleDizinOnayla}
            variant="contained"
            disabled={yukleniyor || !geciciDizinYolu.trim()}
          >
            {yukleniyor ? 'Kontrol Ediliyor...' : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DizinTarama;