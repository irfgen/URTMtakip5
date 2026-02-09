/**
 * Vardiya Bölmesi Component
 *
 * Bu component, günlük vardiya raporunda gündüz veya gece
 * vardiya bölümünü gösterir. İlgili vardiya için çalışma süresi,
 * iş emri bazlı süre dağılımı (pie chart) ve iş emri kartlarını listeler.
 *
 * @author PM Agent
 * @version 2.0.0
 * @since 2026-01-08
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import {
  WbSunny as WbSunnyIcon,
  Bedtime as BedtimeIcon,
  AccessTime as AccessTimeIcon,
  Snooze as SnoozeIcon
} from '@mui/icons-material';
import IsEmriRaporKarti from './IsEmriRaporKarti';
import VardiyaOzeti from './VardiyaOzeti';
import VardiyaPieChart from './VardiyaPieChart';

const VardiyaBolmesi = ({
  vardiya,
  calismaSuresi,
  isEmirleri,
  tur = 'gunduz',
  // YENİ PROPS
  isEmriCalismalar,
  toplamCalisma,
  toplamDurus,
  verimlilikOrani
}) => {
  // Vardiya icon ve renkleri
  const vardiyaConfig = {
    gunduz: {
      icon: <WbSunnyIcon />,
      title: 'Gündüz Vardiyası',
      color: '#ff9800',
      bgColor: '#fff3e0'
    },
    gece: {
      icon: <BedtimeIcon />,
      title: 'Gece Vardiyası',
      color: '#3f51b5',
      bgColor: '#e8eaf6'
    }
  };

  const config = vardiyaConfig[tur] || vardiyaConfig.gunduz;

  // Çalışma süresi formatlı text
  const getCalismaSuresiText = () => {
    if (!calismaSuresi || calismaSuresi === 0) {
      return '0 dakika';
    }

    const saat = Math.floor(calismaSuresi / 60);
    const dakika = calismaSuresi % 60;

    if (saat > 0 && dakika > 0) {
      return `${saat} saat ${dakika} dakika`;
    } else if (saat > 0) {
      return `${saat} saat`;
    } else {
      return `${dakika} dakika`;
    }
  };

  // Yeni props varsa vardiya özetini göster
  const showOzet = isEmriCalismalar && toplamCalisma !== undefined && toplamDurus !== undefined;

  return (
    <Paper
      sx={{
        height: '100%',
        p: 2,
        backgroundColor: config.bgColor,
        borderRadius: 2
      }}
    >
      {/* Vardiya Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ color: config.color }}>
            {config.icon}
          </Box>
          <Typography variant="h6" color="text.primary">
            {vardiya.vardiya_adi}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {vardiya.baslangic_saati} - {vardiya.bitis_saati}
        </Typography>
      </Box>

      {/* Çalışma Süresi (Eski - Geriye dönük uyumluluk) */}
      {!showOzet && (
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <AccessTimeIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {getCalismaSuresiText()}
          </Typography>
        </Box>
      )}

      {/* YENİ: Vardiya Özet Bilgileri */}
      {showOzet && (
        <VardiyaOzeti
          toplamCalisma={toplamCalisma}
          toplamDurus={toplamDurus}
          verimlilikOrani={verimlilikOrani}
        />
      )}

      <Divider sx={{ my: showOzet ? 2 : 0 }} />

      {/* YENİ: Pie Chart - İş Emri Çalışma Dağılımı */}
      {showOzet && isEmriCalismalar.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
            İş Emri Çalışma Dağılımı
          </Typography>
          <VardiyaPieChart
            isEmriCalismalar={isEmriCalismalar}
            toplamCalisma={toplamCalisma}
          />
        </Box>
      )}

      <Divider sx={{ my: showOzet && isEmriCalismalar.length > 0 ? 2 : 0 }} />

      {/* İş Emri Kartları */}
      {!isEmirleri || isEmirleri.length === 0 ? (
        // Boş durum
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={4}
          gap={1}
        >
          <SnoozeIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary" align="center">
            Bu vardiyada iş emri bulunmuyor
          </Typography>
        </Box>
      ) : (
        // İş emirleri listesi
        <Grid container spacing={2}>
          {isEmirleri.map((isEmri) => {
            // İlgili iş emrinin çalışma bilgisini bul
            const calismaBilgisi = isEmriCalismalar?.find(
              (c) => c.is_emri_id === isEmri.is_emri_id
            );

            return (
              <Grid item xs={12} sm={6} md={4} key={isEmri.is_emri_id}>
                <IsEmriRaporKarti
                  isEmri={isEmri}
                  calismaBilgileri={calismaBilgisi}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );
};

export default VardiyaBolmesi;
