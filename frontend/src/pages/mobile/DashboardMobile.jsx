// filepath: /home/irfan/Documents/PROJELER/URTMtakip/frontend/src/pages/mobile/DashboardMobile.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Paper } from '@mui/material';
import { tezgahAPI, isEmirleriAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUygunsuzlukIstatistikleri } from '../../store/slices/uygunsuzluklarSlice';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

function DashboardMobile() {
  const [tezgahDurumu, setTezgahDurumu] = useState(null);
  const [arizaliTezgahlar, setArizaliTezgahlar] = useState([]);
  const [bekleyenIsEmirleri, setBekleyenIsEmirleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { istatistikler: uygunsuzlukIstatistikleri } = useSelector(state => state.uygunsuzluklar);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        console.log('Dashboard verileri için API istekleri yapılıyor');

        // Uygunsuzluk istatistiklerini getir
        dispatch(fetchUygunsuzlukIstatistikleri());

        // Tüm tezgahları getir
        const tezgahResponse = await tezgahAPI.getAll();
        console.log('Tezgah response:', tezgahResponse);
        const tezgahlar = Array.isArray(tezgahResponse.data) ? tezgahResponse.data : [];
        
        // İş emirlerini getir
        const isEmirleriResponse = await isEmirleriAPI.getAll();
        console.log('İş emirleri response:', isEmirleriResponse);
        
        // İş emirleri verisi yapısını kontrol et
        let isEmirleri = [];
        if (Array.isArray(isEmirleriResponse.data)) {
          isEmirleri = isEmirleriResponse.data;
        } else if (typeof isEmirleriResponse.data === 'object') {
          // Eğer dönüş değeri bir obje ise, tüm durumları birleştir
          isEmirleri = Object.values(isEmirleriResponse.data).flat();
        } else {
          console.warn('İş emirleri verisi uyumsuz format');
        }
        
        // Tezgah durumunu hesapla
        const tezgahDurumuData = {
          toplam: tezgahlar.length,
          musait: tezgahlar.filter(t => t.calisma_durumu === 'musait').length,
          dolu: tezgahlar.filter(t => t.calisma_durumu === 'dolu').length,
          ariza: tezgahlar.filter(t => t.calisma_durumu === 'ariza').length,
          bakim: tezgahlar.filter(t => t.calisma_durumu === 'bakim').length,
          devre_disi: tezgahlar.filter(t => t.calisma_durumu === 'devre_disi').length
        };
        
        // Arızalı tezgahları bul
        const ariza = tezgahlar.filter(t => t.calisma_durumu === 'ariza' || t.calisma_durumu === 'bakim');
        
        // Bekleyen iş emirlerini bul
        const bekleyen = isEmirleri.filter(is => is.durum === 'bekliyor' || is.durum === 'beklemede').slice(0, 5);
        
        setTezgahDurumu(tezgahDurumuData);
        setArizaliTezgahlar(ariza);
        setBekleyenIsEmirleri(bekleyen);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard verisi alınamadı:', err);
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Genel Durum
      </Typography>
      
      {/* Tezgah Durum Özeti */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Tezgah Durumu
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Toplam</Typography>
                <Typography variant="h4">{tezgahDurumu?.toplam || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Müsait</Typography>
                <Typography variant="h4">{tezgahDurumu?.musait || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#e3f2fd' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Çalışıyor</Typography>
                <Typography variant="h4">{tezgahDurumu?.dolu || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#ffebee' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Arıza/Bakım</Typography>
                <Typography variant="h4">{(tezgahDurumu?.ariza || 0) + (tezgahDurumu?.bakim || 0)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Uygunsuzluk Özeti */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReportProblemIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Uygunsuzluklar
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card
              sx={{
                backgroundColor: '#fff3e0',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/mobile/uygunsuzluklar')}
            >
              <CardContent>
                <Typography variant="body2" color="text.secondary">Açık</Typography>
                <Typography variant="h4">{uygunsuzlukIstatistikleri?.acik || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ backgroundColor: '#ffebee', cursor: 'pointer' }} onClick={() => navigate('/mobile/uygunsuzluklar')}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Kritik</Typography>
                <Typography variant="h4">{uygunsuzlukIstatistikleri?.kritik || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card
              sx={{
                backgroundColor: '#e3f2fd',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/mobile/uygunsuzluklar')}
            >
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Toplam Rapor</Typography>
                  <Typography variant="h5">{uygunsuzlukIstatistikleri?.toplam || 0}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'primary.main' }}>
                  Detaylar →
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Arızalı Tezgahlar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Arıza/Bakım Gerektiren Tezgahlar
          </Typography>
        </Box>
        
        {arizaliTezgahlar.length > 0 ? (
          arizaliTezgahlar.map(tezgah => (
            <Card 
              key={tezgah.id} 
              sx={{ mb: 1, backgroundColor: tezgah.calisma_durumu === 'ariza' ? '#ffebee' : '#fff8e1' }}
              onClick={() => navigate(`/mobile/tezgahlar/${tezgah.id}`)}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BuildCircleIcon sx={{ mr: 1 }} color={tezgah.calisma_durumu === 'ariza' ? 'error' : 'warning'} />
                  <Typography variant="body1">
                    {tezgah.tezgah_tanimi}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Arıza/Bakım gerektiren tezgah bulunmamaktadır.
          </Typography>
        )}
      </Paper>
      
      {/* Bekleyen İş Emirleri */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AssignmentIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Bekleyen İş Emirleri
          </Typography>
        </Box>
        
        {bekleyenIsEmirleri.length > 0 ? (
          bekleyenIsEmirleri.map(isEmri => (
            <Card 
              key={isEmri.id} 
              sx={{ mb: 1 }}
              onClick={() => navigate(`/mobile/is-emirleri/${isEmri.id}`)}
            >
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="body1">
                  {isEmri.is_emri_no || `İş Emri #${isEmri.id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isEmri.parca?.parca_adi || 'Parça belirtilmemiş'}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Bekleyen iş emri bulunmamaktadır.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default DashboardMobile;
