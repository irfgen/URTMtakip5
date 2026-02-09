import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TezgahZamanCizelgesi = ({ timeline, height = 300 }) => {
  const theme = useTheme();

  // Verileri grafik formatına dönüştür
  const chartData = React.useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Her bir zaman dilimi için veri oluştur
    const labels = timeline.map((item, index) => {
      const startTime = new Date(item.start).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = new Date(item.end).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${startTime} - ${endTime}`;
    });

    // Çalışma ve durma süreleri için ayrı veri setleri
    const runData = timeline.map(item =>
      item.type === 'run' ? item.minutes : 0
    );

    const stopData = timeline.map(item =>
      item.type === 'stop' ? item.minutes : 0
    );

    return {
      labels,
      datasets: [
        {
          label: 'Çalışma (dakika)',
          data: runData,
          backgroundColor: theme.palette.success.main,
          borderColor: theme.palette.success.dark,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
        },
        {
          label: 'Durma (dakika)',
          data: stopData,
          backgroundColor: theme.palette.error.main,
          borderColor: theme.palette.error.dark,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
        }
      ]
    };
  }, [timeline, theme]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: theme.typography.fontFamily,
          },
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Tezgah Çalışma Zaman Çizelgesi',
        font: {
          size: 16,
          weight: 'bold',
          family: theme.typography.fontFamily,
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            const index = context.dataIndex;
            const item = timeline[index];
            if (item && item.type === 'run') {
              return [
                `İş Emri: ${item.is_emri_no || item.is_emri_id || '-'}`,
                `Parça: ${item.parca_kodu || '-'}`
              ];
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Zaman Aralığı',
          font: {
            size: 14,
            weight: 'bold',
            family: theme.typography.fontFamily,
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
            family: theme.typography.fontFamily,
          }
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Süre (Dakika)',
          font: {
            size: 14,
            weight: 'bold',
            family: theme.typography.fontFamily,
          }
        },
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
            family: theme.typography.fontFamily,
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: height,
        backgroundColor: theme.palette.grey[50],
        border: `2px dashed ${theme.palette.grey[300]}`,
        borderRadius: 2
      }}>
        <Typography variant="body1" color="text.secondary">
          Gösterilecek zaman çizelgesi verisi bulunamadı
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: height, width: '100%' }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export default TezgahZamanCizelgesi;