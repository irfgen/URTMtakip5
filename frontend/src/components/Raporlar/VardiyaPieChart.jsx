/**
 * Vardiya Pie Chart Component
 *
 * Bu component, iş emri bazlı çalışma sürelerini
 * pie chart ile görselleştirir.
 *
 * @author PM Agent
 * @version 1.0.0
 * @since 2026-01-08
 */

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Box,
  Typography,
  useTheme,
  Paper
} from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const VardiyaPieChart = ({ isEmriCalismalar, toplamCalisma }) => {
  const theme = useTheme();

  // Veri yoksa boş gösterim
  if (!isEmriCalismalar || isEmriCalismalar.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          color: 'text.disabled',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Typography variant="body2">
          Bu vardiyada iş emri çalışması yok
        </Typography>
      </Box>
    );
  }

  // Chart renk paleti
  const chartColors = [
    theme.palette.primary.main,     // #3f51b5
    theme.palette.secondary.main,   // #f44336
    theme.palette.success.main,     // #4caf50
    theme.palette.warning.main,     // #ff9800
    theme.palette.info.main,        // #2196f3
    '#9c27b0',                     // purple
    '#00bcd4',                     // cyan
    '#ffeb3b',                     // yellow
    '#795548',                     // brown
    '#607d8b',                     // blue grey
    '#e91e63'                      // pink
  ];

  // Chart.js veri hazırlığı
  const labels = isEmriCalismalar.map(ie => ie.is_emri_no);
  const data = isEmriCalismalar.map(ie => ie.sure_dakika);
  const backgroundColors = isEmriCalismalar.map((_, i) =>
    chartColors[i % chartColors.length]
  );

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: backgroundColors,
      borderWidth: 2,
      borderColor: theme.palette.background.paper,
      hoverOffset: 10
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = toplamCalisma > 0
                  ? ((value / toplamCalisma) * 100).toFixed(1)
                  : '0.0';

                return {
                  text: `${label}: ${value} dk (%${percentage})`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          },
          padding: 15,
          font: {
            size: 12,
            family: theme.typography.fontFamily
          },
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = toplamCalisma > 0
              ? ((value / toplamCalisma) * 100).toFixed(1)
              : '0.0';

            return `${label}: ${value} dakika (%${percentage})`;
          }
        }
      },
      title: {
        display: false
      }
    },
    layout: {
      padding: {
        right: 20
      }
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '280px', width: '100%' }}>
      <Pie data={chartData} options={chartOptions} />
    </Box>
  );
};

export default VardiyaPieChart;
