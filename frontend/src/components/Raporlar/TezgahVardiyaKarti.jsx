/**
 * Tezgah Vardiya Kartı Component
 *
 * Bu component, tek bir tezgah için gündüz ve gece
 * vardiya bölümlerini gösteren karttır.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-06
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Divider,
  Grid,
  useTheme
} from '@mui/material';
import {
  Build as BuildIcon
} from '@mui/icons-material';
import VardiyaBolmesi from './VardiyaBolmesi';

const TezgahVardiyaKarti = ({ tezgah, gunduzVardiya, geceVardiya }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: 3,
        overflow: 'hidden'
      }}
    >
      {/* Tezgah Header */}
      <CardHeader
        avatar={
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2
            }}
          >
            <BuildIcon />
          </Box>
        }
        title={
          <Typography variant="h5" component="div">
            {tezgah.tezgah_adi}
          </Typography>
        }
        subheader={`Tezgah ID: ${tezgah.tezgah_id}`}
      />

      <CardContent>
        <Grid container spacing={2}>
          {/* Gündüz Vardiyası */}
          <Grid item xs={12} sm={6}>
            {gunduzVardiya ? (
              <VardiyaBolmesi
                vardiya={gunduzVardiya}
                calismaSuresi={gunduzVardiya.calisma_suresi_dakika}
                isEmirleri={gunduzVardiya.is_emirleri}
                tur="gunduz"
                // YENİ PROPS
                isEmriCalismalar={gunduzVardiya.is_emri_calismalar}
                toplamCalisma={gunduzVardiya.toplam_calisma}
                toplamDurus={gunduzVardiya.toplam_durus}
                verimlilikOrani={gunduzVardiya.verimlilik_orani}
              />
            ) : (
              // Gündüz vardiya tanımı yoksa
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  textAlign: 'center',
                  color: 'text.disabled',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2">
                  Gündüz vardiya tanımı bulunmuyor
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Gece Vardiyası */}
          <Grid item xs={12} sm={6}>
            {geceVardiya ? (
              <VardiyaBolmesi
                vardiya={geceVardiya}
                calismaSuresi={geceVardiya.calisma_suresi_dakika}
                isEmirleri={geceVardiya.is_emirleri}
                tur="gece"
                // YENİ PROPS
                isEmriCalismalar={geceVardiya.is_emri_calismalar}
                toplamCalisma={geceVardiya.toplam_calisma}
                toplamDurus={geceVardiya.toplam_durus}
                verimlilikOrani={geceVardiya.verimlilik_orani}
              />
            ) : (
              // Gece vardiya tanımı yoksa
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  textAlign: 'center',
                  color: 'text.disabled',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2">
                  Gece vardiya tanımı bulunmuyor
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TezgahVardiyaKarti;
