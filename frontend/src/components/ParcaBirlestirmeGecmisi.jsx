import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Pagination,
  Grid
} from '@mui/material';
import {
  History as HistoryIcon,
  Undo as UndoIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ParcaBirlestirmeGecmisi = () => {
  const [gecmis, setGecmis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [toplamSayfa, setToplamSayfa] = useState(1);
  const [detayDialog, setDetayDialog] = useState({ acik: false, kayit: null });
  const [rollbackDialog, setRollbackDialog] = useState({ acik: false, kayit: null });
  const [rollbackLoading, setRollbackLoading] = useState(false);

  useEffect(() => {
    fetchGecmis();
  }, [sayfa]);

  const fetchGecmis = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/parca-birlesik/gecmis', {
        params: { page: sayfa, limit: 20 }
      });
      
      if (response.data.success) {
        setGecmis(response.data.data.gecmis);
        setToplamSayfa(response.data.data.toplam_sayfa);
      }
    } catch (err) {
      console.error('Geçmiş yükleme hatası:', err);
      setError('Birleştirme geçmişi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (kayit) => {
    try {
      setRollbackLoading(true);
      const response = await axios.post(`/api/parca-birlesik/rollback/${kayit.id}`);
      
      if (response.data.success) {
        alert('Birleştirme işlemi başarıyla geri alındı!');
        setRollbackDialog({ acik: false, kayit: null });
        fetchGecmis(); // Listeyi yenile
      }
    } catch (err) {
      console.error('Rollback hatası:', err);
      alert('Geri alma işlemi başarısız oldu: ' + (err.response?.data?.message || err.message));
    } finally {
      setRollbackLoading(false);
    }
  };

  const getDurumRengi = (durum) => {
    switch (durum) {
      case 'aktif': return 'success';
      case 'geri_alindi': return 'warning';
      case 'geri_alinamaz': return 'error';
      default: return 'default';
    }
  };

  const getDurumMetni = (durum) => {
    switch (durum) {
      case 'aktif': return 'Aktif';
      case 'geri_alindi': return 'Geri Alındı';
      case 'geri_alinamaz': return 'Geri Alınamaz';
      default: return durum;
    }
  };

  const getDurumIkonu = (durum) => {
    switch (durum) {
      case 'aktif': return <CheckCircleIcon />;
      case 'geri_alindi': return <UndoIcon />;
      case 'geri_alinamaz': return <BlockIcon />;
      default: return <CancelIcon />;
    }
  };

  if (loading && gecmis.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Birleştirme geçmişi yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchGecmis} sx={{ ml: 2 }}>
          Tekrar Dene
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <HistoryIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4">
          Parça Birleştirme Geçmişi
        </Typography>
      </Box>

      {gecmis.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Henüz Birleştirme İşlemi Yok
            </Typography>
            <Typography color="text.secondary">
              Parça birleştirme işlemleri burada görünecektir.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Tutulan Parça</TableCell>
                  <TableCell>Silinen Parçalar</TableCell>
                  <TableCell>Transfer Edilen</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gecmis.map((kayit) => (
                  <TableRow key={kayit.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(kayit.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {kayit.tutulan_parca_kodu}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {kayit.silinen_parca_kodlari.slice(0, 2).map((kod, index) => (
                          <Chip
                            key={index}
                            label={kod}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {kayit.silinen_parca_kodlari.length > 2 && (
                          <Chip
                            label={`+${kayit.silinen_parca_kodlari.length - 2}`}
                            size="small"
                            color="primary"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        İE: {kayit.transfer_detaylari.is_emirleri}
                      </Typography>
                      <Typography variant="caption" display="block">
                        BOM: {kayit.transfer_detaylari.bom_kayitlari}
                      </Typography>
                      <Typography variant="caption" display="block">
                        PK: {kayit.transfer_detaylari.parca_kayitlari}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getDurumIkonu(kayit.rollback_durumu)}
                        label={getDurumMetni(kayit.rollback_durumu)}
                        color={getDurumRengi(kayit.rollback_durumu)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {kayit.kullanici_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Detay Görüntüle">
                          <IconButton 
                            size="small"
                            onClick={() => setDetayDialog({ acik: true, kayit })}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {kayit.rollback_durumu === 'aktif' && (
                          <Tooltip title="Geri Al">
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={() => setRollbackDialog({ acik: true, kayit })}
                            >
                              <UndoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={toplamSayfa}
              page={sayfa}
              onChange={(event, value) => setSayfa(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* Detay Dialog */}
      <Dialog 
        open={detayDialog.acik} 
        onClose={() => setDetayDialog({ acik: false, kayit: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Birleştirme İşlemi Detayları</DialogTitle>
        <DialogContent>
          {detayDialog.kayit && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Genel Bilgiler
                </Typography>
                <Typography><strong>Tarih:</strong> {format(new Date(detayDialog.kayit.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}</Typography>
                <Typography><strong>Kullanıcı:</strong> {detayDialog.kayit.kullanici_id}</Typography>
                <Typography><strong>IP Adresi:</strong> {detayDialog.kayit.kullanici_ip}</Typography>
                <Typography><strong>Açıklama:</strong> {detayDialog.kayit.aciklama}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Parça Bilgileri
                </Typography>
                <Typography><strong>Tutulan Parça:</strong> {detayDialog.kayit.tutulan_parca_kodu}</Typography>
                <Typography><strong>Silinen Parçalar:</strong></Typography>
                <Box sx={{ pl: 2 }}>
                  {detayDialog.kayit.silinen_parca_kodlari.map((kod, index) => (
                    <Typography key={index}>• {kod}</Typography>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Transfer Edilen Veriler
                </Typography>
                <Typography>• İş Emirleri: {detayDialog.kayit.transfer_detaylari.is_emirleri}</Typography>
                <Typography>• BOM Kayıtları: {detayDialog.kayit.transfer_detaylari.bom_kayitlari}</Typography>
                <Typography>• Parça Kayıtları: {detayDialog.kayit.transfer_detaylari.parca_kayitlari}</Typography>
                <Typography>• Stok Adeti: {detayDialog.kayit.transfer_detaylari.stok_adeti}</Typography>
              </Grid>

              {detayDialog.kayit.rollback_tarihi && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Geri Alma Bilgileri
                  </Typography>
                  <Typography><strong>Geri Alma Tarihi:</strong> {format(new Date(detayDialog.kayit.rollback_tarihi), 'dd.MM.yyyy HH:mm:ss', { locale: tr })}</Typography>
                  <Typography><strong>Geri Alan Kullanıcı:</strong> {detayDialog.kayit.rollback_kullanici_id}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetayDialog({ acik: false, kayit: null })}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Onay Dialog */}
      <Dialog 
        open={rollbackDialog.acik} 
        onClose={() => setRollbackDialog({ acik: false, kayit: null })}
      >
        <DialogTitle>Birleştirme İşlemini Geri Al</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Dikkat!</strong> Bu işlem geri alınamaz. Birleştirme işlemi 
            tersine çevrilerek silinen parçalar tekrar oluşturulacaktır.
          </Alert>
          
          {rollbackDialog.kayit && (
            <>
              <Typography gutterBottom>
                <strong>Tutulan Parça:</strong> {rollbackDialog.kayit.tutulan_parca_kodu}
              </Typography>
              <Typography gutterBottom>
                <strong>Geri Oluşturulacak Parçalar:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                {rollbackDialog.kayit.silinen_parca_kodlari.map((kod, index) => (
                  <Typography key={index}>• {kod}</Typography>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRollbackDialog({ acik: false, kayit: null })}
            disabled={rollbackLoading}
          >
            İptal
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleRollback(rollbackDialog.kayit)}
            disabled={rollbackLoading}
            startIcon={rollbackLoading ? <CircularProgress size={20} /> : <UndoIcon />}
          >
            {rollbackLoading ? 'Geri Alınıyor...' : 'Geri Al'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParcaBirlestirmeGecmisi;