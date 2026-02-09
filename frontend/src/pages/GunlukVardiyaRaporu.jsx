/**
 * Günlük Vardiya Raporu - Ana Sayfa Component
 *
 * Bu component, günlük vardiya raporunun ana sayfasıdır.
 * Tarih seçimi yapılmasını sağlar ve tezgah bazlı
 * vardiya raporlarını gösterir.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  IconButton
} from '@mui/material';
import {
  CalendarToday as CalendarTodayIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tr } from 'date-fns/locale';
import TezgahVardiyaKarti from '../components/Raporlar/TezgahVardiyaKarti';
import { getGunlukVardiyaRaporu } from '../api/gunlukVardiyaAPI';

const GunlukVardiyaRaporu = () => {
  // Varsayılan tarih: Dün
  const [secilenTarih, setSecilenTarih] = useState(() => {
    const dün = new Date();
    dün.setDate(dün.getDate() - 1);
    return dün;
  });

  const [raporData, setRaporData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tarih değiştiğinde raporu yenile
  useEffect(() => {
    raporuGetir(secilenTarih);
  }, [secilenTarih]);

  // Rapor verisi getir
  const raporuGetir = async (tarih) => {
    setLoading(true);
    setError(null);

    try {
      const tarihStr = tarih.toISOString().split('T')[0];
      const response = await getGunlukVardiyaRaporu(tarihStr);

      if (response.success) {
        setRaporData(response.data);
      } else {
        setError(response.error || 'Rapor getirilemedi');
      }
    } catch (err) {
      console.error('Rapor getirme hatası:', err);
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Tarih değiştiğinde
  const handleTarihDegisiklik = (yeniTarih) => {
    setSecilenTarih(yeniTarih);
  };

  // Yenile butonu
  const handleYenile = () => {
    raporuGetir(secilenTarih);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <CalendarTodayIcon fontSize="large" color="primary" />
          <Typography variant="h4" component="h1">
            Günlük Vardiya Raporu
          </Typography>
        </Box>
        <IconButton onClick={handleYenile} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tarih Seçici */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
          <DatePicker
            label="Rapor Tarihi"
            value={secilenTarih}
            onChange={handleTarihDegisiklik}
            maxDate={new Date()}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { maxWidth: 400 }
              }
            }}
          />
        </LocalizationProvider>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Rapor İçeriği */}
      {!loading && !error && raporData && (
        <>
          {/* Özet Bilgisi */}
          {raporData.ozet && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Toplam Tezgah
                  </Typography>
                  <Typography variant="h5">
                    {raporData.ozet.toplam_tezgah}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Toplam İş Emri
                  </Typography>
                  <Typography variant="h5">
                    {raporData.ozet.toplam_is_emri}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Tamamlanan
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {raporData.ozet.tamamlanan_is_emri}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Aktif
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {raporData.ozet.aktif_is_emri}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Tezgah Kartları */}
          {!raporData.tezgahlar || raporData.tezgahlar.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Bu tarih için rapor verisi bulunmuyor
              </Typography>
            </Paper>
          ) : (
            raporData.tezgahlar.map((tezgah) => (
              <TezgahVardiyaKarti
                key={tezgah.tezgah_id}
                tezgah={tezgah}
                gunduzVardiya={tezgah.gunduz_vardiya}
                geceVardiya={tezgah.gece_vardiya}
              />
            ))
          )}
        </>
      )}
    </Container>
  );
};

export default GunlukVardiyaRaporu;
