/**
 * Vardiya Özeti Component
 *
 * Bu component, bir vardiya için toplam çalışma süresi,
 * duruş süresi ve verimlilik oranını gösterir.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-08
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Pause as PauseIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const VardiyaOzeti = ({ toplamCalisma, toplamDurus, verimlilikOrani }) => {
  const theme = useTheme();

  /**
   * Dakikayı "X saat Y dakika" formatına çevirir
   */
  const formatSure = (dakika) => {
    if (!dakika || dakika === 0) return '0 dk';

    const saat = Math.floor(dakika / 60);
    const dk = dakika % 60;

    if (saat > 0 && dk > 0) {
      return `${saat}s ${dk}dk`;
    } else if (saat > 0) {
      return `${saat} saat`;
    } else {
      return `${dk} dk`;
    }
  };

  const items = [
    {
      label: 'Toplam Çalışma',
      value: formatSure(toplamCalisma),
      icon: <AccessTimeIcon />,
      color: theme.palette.success.main,
      bgColor: theme.palette.success.light + '40'
    },
    {
      label: 'Toplam Duruş',
      value: formatSure(toplamDurus),
      icon: <PauseIcon />,
      color: theme.palette.warning.main,
      bgColor: theme.palette.warning.light + '40'
    },
    {
      label: 'Verimlilik',
      value: verimlilikOrani !== undefined ? `%${verimlilikOrani}` : '-',
      icon: <TrendingUpIcon />,
      color: theme.palette.info.main,
      bgColor: theme.palette.info.light + '40'
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={4} key={index}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: item.bgColor,
              borderLeft: `4px solid ${item.color}`,
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            <Box
              sx={{
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: item.color + '20'
              }}
            >
              {item.icon}
            </Box>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {item.label}
              </Typography>
              <Typography variant="h6" color="text.primary" fontWeight={600}>
                {item.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default VardiyaOzeti;
