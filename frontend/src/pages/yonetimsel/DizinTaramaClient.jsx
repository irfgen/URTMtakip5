import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Divider,
  Alert,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Download,
  CheckCircle,
  Info,
  Description,
  FolderOpen,
  Storage,
  CloudDownload,
  Update,
  Settings,
  Security,
  Speed,
  BugReport,
  AutoFixHigh,
  GetApp,
  OpenInNew
} from '@mui/icons-material';
import axios from 'axios';

function DizinTaramaClient() {
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReleaseInfo();
  }, []);

  const fetchReleaseInfo = async () => {
    try {
      const response = await axios.get('/downloads/LATEST_RELEASE.json');
      setReleaseInfo(response.data);
      setLoading(false);
    } catch (err) {
      // Backend'den alınamazsa hardcoded versiyon kullan
      setReleaseInfo({
        version: '1.2.19',
        version_full: '1.2.19.20250107004',
        release_date: '2026-01-07',
        build_number: '20250107004',
        download_url: '/downloads/URTM_DizinTarama_Client_v1.2.19.zip',
        file_size: '69KB',
        changelog: [
          'v1.2.19 - 2025-10-07:',
          '- KRITIK: Parça-detay penceresinde montaj dosyaları görüntülenme sorunu düzeltildi',
          '- KRITIK: combine_part_data fonksiyonunda yanlış anahtar isimleri düzeltildi',
          '- KRITIK: Parçalar için hasAssembly alanı hesaplanmıyordu - düzeltildi',
          '- YENİ: Parçaların aynı isimli montaj dosyaları ile ilişkilendirilmesi'
        ],
        requirements: [
          'Python 3.8+',
          'Windows 10/11',
          'requests>=2.25.0'
        ],
        compatible_backend: '11.3.184+'
      });
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (releaseInfo) {
      window.open(releaseInfo.download_url, '_blank');
    }
  };

  const handleDownloadFromSource = () => {
    // Proje dizininden indirme (README ve diğer dosyalar için)
    window.open('/downloads/README.md', '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !releaseInfo) {
    return (
      <Alert severity="error">
        Sürüm bilgileri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Başlık Alanı */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          <FolderOpen sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dizin Tarama Client
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Windows tabanlı CAD dosya tarama ve parça veritabanı oluşturma aracı
        </Typography>
      </Box>

      {/* Sürüm Bilgisi */}
      {releaseInfo && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                Güncel Sürüm
              </Typography>
              <Typography variant="h6">
                v{releaseInfo.version}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Yapım: {releaseInfo.version_full} | Tarih: {releaseInfo.release_date}
              </Typography>
            </Box>
            <Chip
              icon={<CheckCircle />}
              label="Stabil"
              color="success"
              size="small"
            />
          </Box>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Özellikler Kartı */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                Dizin Tarama Nedir?
              </Typography>
              <Typography variant="body2" paragraph>
                Dizin Tarama Client, Windows bilgisayarlarınızda çalışan, ağ depolama alanlarındaki
                CAD dosyalarını otomatik olarak tarayan ve ÜRTM Takip sistemiyle entegre eden bir araçtır.
              </Typography>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Temel Özellikler:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><FolderOpen color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Otomatik CAD dosya tarama (.sldprt, .slddrw, .pdf)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Storage color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Parça bazlı gruplandırma ve organizasyon" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CloudDownload color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Network drive ve UNC path desteği" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Settings color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Sunucu ile otomatik senkronizasyon" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Speed color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Hızlı ve kullanıcı dostu arayüz" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Kullanım Adımları Kartı */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoFixHigh sx={{ mr: 1 }} />
                Nasıl Kullanılır?
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Chip label="1" size="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Client'i indirin ve kurun" secondary="simple_install.bat çalıştırın" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="2" size="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Sunucu bağlantısını yapılandırın" secondary="Backend URL'sini girin" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="3" size="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Taramak istediğiniz dizini seçin" secondary="Network drive veya yerel klasör" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="4" size="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Analiz başlatın" secondary="Otomatik dosya taraması ve gruplandırma" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Chip label="5" size="small" color="primary" /></ListItemIcon>
                  <ListItemText primary="Parçaları kaydedin" secondary="Veritabanına toplu import" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* İndirme Kartı */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Download sx={{ mr: 1 }} />
                İndirme Alanı
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Resmi İndirme (ÖNERİLEN)
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      startIcon={<GetApp />}
                      onClick={handleDownload}
                      disabled={!releaseInfo}
                      sx={{ py: 1.5 }}
                    >
                      İndir v{releaseInfo?.version || ''}
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Boyut: {releaseInfo?.file_size || '-'} | Yapım: {releaseInfo?.build_number || '-'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Alternatif: Kaynak Koddan
                    </Typography>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      startIcon={<OpenInNew />}
                      onClick={handleDownloadFromSource}
                      sx={{ py: 1.5 }}
                    >
                      Proje Dizinini Aç
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Geliştirici erişimi için
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {releaseInfo?.requirements && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Sistem Gereksinimleri:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {releaseInfo.requirements.map((req, idx) => (
                      <Chip
                        key={idx}
                        icon={<CheckCircle fontSize="small" />}
                        label={req}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  {releaseInfo.compatible_backend && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                      * Uyumlu Backend Sürümü: {releaseInfo.compatible_backend}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Değişiklik Kaydı */}
        {releaseInfo?.changelog && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Update sx={{ mr: 1 }} />
                  Son Güncellemeler
                </Typography>
                <List dense>
                  {releaseInfo.changelog.map((log, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        {log.includes('KRITIK') && <BugReport color="error" fontSize="small" />}
                        {log.includes('YENİ') && <AutoFixHigh color="success" fontSize="small" />}
                        {log.includes('GELİŞTİRME') && <Update color="info" fontSize="small" />}
                        {!log.includes('KRITIK') && !log.includes('YENİ') && !log.includes('GELİŞTİRME') && <Description fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={log}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            color: log.includes('KRITIK') ? 'error.main' :
                                   log.includes('YENİ') ? 'success.main' :
                                   log.includes('GELİŞTİRME') ? 'info.main' : 'text.primary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Dokümantasyon Linkleri */}
        <Grid item xs={12}>
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dokümantasyon ve Destek
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<Description />}
                    component={Link}
                    href="/docs/CNC_PYTHON_TOOLS.md#dizin-tarama-client"
                    target="_blank"
                  >
                    Kullanım Kılavuzu
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<BugReport />}
                    component={Link}
                    href="/DizinTarama_Client/SORUN_GIDERME.md"
                    target="_blank"
                  >
                    Sorun Giderme
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<Security />}
                    component={Link}
                    href="/DizinTarama_Client/KURULUM_REHBERI.md"
                    target="_blank"
                  >
                    Kurulum Rehberi
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<OpenInNew />}
                    component={Link}
                    href="/DizinTarama_Client/README.md"
                    target="_blank"
                  >
                    README
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DizinTaramaClient;
