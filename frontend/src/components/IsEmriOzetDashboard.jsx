import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Grid, TextField, MenuItem, Button } from '@mui/material';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const IsEmriOzetDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    baslangic: '',
    bitis: '',
    tezgah_id: '',
  });

  // Tezgah listesi için (opsiyonel)
  const [tezgahlar, setTezgahlar] = useState([]);

  useEffect(() => {
    // Tezgah listesi çek
    axios.get('/api/tezgahlar')
      .then(res => {
        let tezgahlarData = [];
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          tezgahlarData = res.data.data;
        } else if (Array.isArray(res.data)) {
          tezgahlarData = res.data;
        }
        setTezgahlar(tezgahlarData);
      })
      .catch(() => setTezgahlar([]));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.baslangic) params.baslangic = filters.baslangic;
      if (filters.bitis) params.bitis = filters.bitis;
      if (filters.tezgah_id) params.tezgah_id = filters.tezgah_id;
      const res = await axios.get('/api/raporlar/is-emri-ozet', { params });
      setData(res.data);
    } catch (err) {
      setError('Veri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Grafik verileri hazırlama (örnek)
  const trendData = {
    labels: data?.detaylar?.map(o => o.bitis_tarihi?.slice(0, 10)) || [],
    datasets: [
      {
        label: 'Üretilen Parça',
        data: data?.detaylar?.map(o => o.toplam_uretilen) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  // Tezgah başına iş dağılımı
  const tezgahCounts = {};
  data?.detaylar?.forEach(o => {
    const t = o.is_emri?.tezgah_id || 'Bilinmiyor';
    tezgahCounts[t] = (tezgahCounts[t] || 0) + 1;
  });
  const tezgahPieData = {
    labels: Object.keys(tezgahCounts),
    datasets: [
      {
        data: Object.values(tezgahCounts),
        backgroundColor: [
          '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF',
        ],
      },
    ],
  };

  // İş emri durumlarına göre dağılım
  const durumCounts = {};
  data?.detaylar?.forEach(o => {
    const d = o.is_emri?.durum || 'Bilinmiyor';
    durumCounts[d] = (durumCounts[d] || 0) + 1;
  });
  const durumPieData = {
    labels: Object.keys(durumCounts),
    datasets: [
      {
        data: Object.values(durumCounts),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF',
        ],
      },
    ],
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        İş Emirleri Özeti Raporu
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.baslangic}
              onChange={e => setFilters(f => ({ ...f, baslangic: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Bitiş Tarihi"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.bitis}
              onChange={e => setFilters(f => ({ ...f, bitis: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Tezgah"
              select
              fullWidth
              value={filters.tezgah_id}
              onChange={e => setFilters(f => ({ ...f, tezgah_id: e.target.value }))}
            >
              <MenuItem value="">Tümü</MenuItem>
              {Array.isArray(tezgahlar) && tezgahlar.map(t => (
                <MenuItem key={t.tezgah_id} value={t.tezgah_id}>{t.tezgah_tanimi}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="contained" onClick={fetchData} fullWidth>
              Filtrele
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {loading ? (
        <Typography>Yükleniyor...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : data ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Üretim Trendleri</Typography>
              <Bar data={trendData} options={{ responsive: true }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6">Tezgah Başına İş Dağılımı</Typography>
              <Pie data={tezgahPieData} />
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">İş Emri Durum Dağılımı</Typography>
              <Pie data={durumPieData} />
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default IsEmriOzetDashboard;
