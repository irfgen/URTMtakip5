import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Grid, TextField, MenuItem, Button, CircularProgress } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import GaugeChart from 'react-gauge-chart'; // Gauge chart library
import { DataGrid } from '@mui/x-data-grid'; // DataGrid import edildi
import 'chart.js/auto';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Helper: OEE renk kodu
const getOeeColor = (oee) => {
  if (oee >= 85) return '#4caf50'; // yeşil (iyi)
  if (oee >= 60) return '#ff9800'; // turuncu (orta)
  return '#f44336'; // kırmızı (düşük)
};

const TezgahPerformansDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    baslangic: '',
    bitis: '',
    tezgah_id: '',
  });
  const [tezgahlar, setTezgahlar] = useState([]);

  // Fetch tezgah list for filter dropdown
  useEffect(() => {
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
      .catch(() => {
        setError('Tezgah listesi alınamadı');
        setTezgahlar([]);
      });
  }, []);

  // Fetch performance data based on filters
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.baslangic) params.baslangic = filters.baslangic;
      if (filters.bitis) params.bitis = filters.bitis;
      if (filters.tezgah_id) params.tezgah_id = filters.tezgah_id;
      const res = await axios.get('/api/raporlar/tezgah-performans', { params });
      setData(res.data);
    } catch (err) {
      console.error("API Error:", err);
      setError(`Veri alınamadı: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only once on mount initially

  // --- Chart Data Preparation ---

  // OEE Gauge Chart (shows selected or first tezgah)
  const selectedTezgahData = data?.tezgahlar?.find(t => t.tezgah_id === filters.tezgah_id) || data?.tezgahlar?.[0];
  const oeeGaugeValue = selectedTezgahData ? parseFloat(selectedTezgahData.oee) : 0;

  // OEE Comparison Bar Chart
  const oeeBarData = {
    labels: data?.tezgahlar?.map(t => t.tezgah_tanimi) || [],
    datasets: [
      {
        label: 'OEE (%)',
        data: data?.tezgahlar?.map(t => parseFloat(t.oee)) || [],
        backgroundColor: data?.tezgahlar?.map(t => getOeeColor(parseFloat(t.oee))) || [],
      },
    ],
  };
  const oeeBarOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.y.toFixed(2)}%` } }
    },
    scales: { y: { min: 0, max: 100, title: { display: true, text: 'OEE (%)' } } },
    responsive: true,
    maintainAspectRatio: false,
  };

  // Duruş Nedenleri Pareto Chart (Placeholder Data)
  // TODO: Replace with actual data from backend when available
  const paretoData = {
    labels: ['Bakım', 'Arıza', 'Malzeme Bekleme', 'Operatör Yok', 'Setup', 'Diğer'],
    datasets: [
      {
        label: 'Duruş Süresi (dk)',
        data: [120, 95, 60, 45, 30, 15].sort((a, b) => b - a), // Sorted for Pareto
        backgroundColor: '#1976d2',
      },
      // TODO: Add cumulative percentage line for true Pareto
    ],
  };
  const paretoOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Duruş Süresi (dk)' } } },
    responsive: true,
    maintainAspectRatio: false,
  };

  // --- DataGrid Columns Definition ---
  const columns = [
    { field: 'tezgah_tanimi', headerName: 'Tezgah', flex: 1.5 },
    {
      field: 'oee',
      headerName: 'OEE (%)',
      type: 'number',
      flex: 1,
      valueFormatter: (params) => parseFloat(params.value).toFixed(2),
      cellClassName: (params) => `oee-color--${getOeeColor(parseFloat(params.value)).substring(1)}`, // Renk kodlaması için sınıf
    },
    {
      field: 'toplam_calisma_suresi',
      headerName: 'Çalışma (dk)',
      type: 'number',
      flex: 1,
      valueFormatter: (params) => params.value?.toFixed(0) || 0,
    },
    {
      field: 'toplam_durus_suresi',
      headerName: 'Duruş (dk)',
      type: 'number',
      flex: 1,
      valueFormatter: (params) => params.value?.toFixed(0) || 0,
    },
    { field: 'toplam_uretilen', headerName: 'Üretilen', type: 'number', flex: 0.8 },
    { field: 'toplam_hurda', headerName: 'Hurda', type: 'number', flex: 0.8 },
    { field: 'toplam_is_emri', headerName: 'İş Emri Sayısı', type: 'number', flex: 1 },
    {
      field: 'availability',
      headerName: 'Kullanılabilirlik (%)',
      type: 'number',
      flex: 1,
      valueGetter: (params) => (params.row.detay?.availability * 100),
      valueFormatter: (params) => params.value?.toFixed(1) || 0,
    },
    {
      field: 'performance',
      headerName: 'Performans (%)',
      type: 'number',
      flex: 1,
      valueGetter: (params) => (params.row.detay?.performance * 100),
       valueFormatter: (params) => params.value?.toFixed(1) || 0,
    },
    {
      field: 'quality',
      headerName: 'Kalite (%)',
      type: 'number',
      flex: 1,
      valueGetter: (params) => (params.row.detay?.quality * 100),
       valueFormatter: (params) => params.value?.toFixed(1) || 0,
    },
  ];

  // Prepare rows for DataGrid, adding 'id' based on 'tezgah_id'
  const rows = data?.tezgahlar?.map(t => ({ ...t, id: t.tezgah_id })) || [];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom component="div">
        Tezgah Performans Raporu
      </Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              size="small"
              fullWidth
              value={filters.baslangic}
              onChange={e => setFilters(f => ({ ...f, baslangic: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Bitiş Tarihi"
              type="date"
              size="small"
              fullWidth
              value={filters.bitis}
              onChange={e => setFilters(f => ({ ...f, bitis: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Tezgah Seç"
              select
              size="small"
              fullWidth
              value={filters.tezgah_id}
              onChange={e => setFilters(f => ({ ...f, tezgah_id: e.target.value }))}
            >
              <MenuItem value="">Tüm Tezgahlar</MenuItem>
              {Array.isArray(tezgahlar) && tezgahlar.map(t => (
                <MenuItem key={t.tezgah_id} value={t.tezgah_id}>{t.tezgah_tanimi}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" onClick={fetchData} fullWidth disabled={loading}>
              Raporu Getir
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Content Area */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : !data || !data.tezgahlar || data.tezgahlar.length === 0 ? (
         <Typography align="center">Seçili kriterlere uygun veri bulunamadı.</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* OEE Gauge */}
          {selectedTezgahData && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  {selectedTezgahData.tezgah_tanimi} - OEE
                </Typography>
                <GaugeChart
                  id={`gauge-${selectedTezgahData.tezgah_id}`}
                  nrOfLevels={3}
                  colors={["#f44336", "#ff9800", "#4caf50"]} // Red, Orange, Green
                  arcWidth={0.3}
                  percent={oeeGaugeValue / 100}
                  textColor="#333"
                  needleColor="#e0e0e0"
                  needleBaseColor="#9e9e9e"
                  formatTextValue={value => `${oeeGaugeValue.toFixed(1)}%`}
                  style={{ width: '80%' }} // Adjust size as needed
                />
                 <Typography variant="caption" display="block" mt={1}>
                   Kullanılabilirlik: {(selectedTezgahData.detay?.availability * 100).toFixed(1)}% |
                   Performans: {(selectedTezgahData.detay?.performance * 100).toFixed(1)}% |
                   Kalite: {(selectedTezgahData.detay?.quality * 100).toFixed(1)}%
                 </Typography>
              </Paper>
            </Grid>
          )}

          {/* OEE Comparison Bar */}
          <Grid item xs={12} md={selectedTezgahData ? 8 : 12}>
             <Paper sx={{ p: 2, height: 350 }}> {/* Fixed height for consistency */}
               <Typography variant="h6" gutterBottom>Tezgah OEE Karşılaştırması</Typography>
               <Box sx={{ height: 'calc(100% - 40px)' }}> {/* Adjust height for title */}
                 <Bar data={oeeBarData} options={oeeBarOptions} />
               </Box>
             </Paper>
           </Grid>

          {/* Pareto Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 350 }}>
              <Typography variant="h6" gutterBottom>Duruş Nedenleri Analizi (Örnek Veri)</Typography>
               <Box sx={{ height: 'calc(100% - 40px)' }}>
                 <Bar data={paretoData} options={paretoOptions} />
               </Box>
            </Paper>
          </Grid>

          {/* Placeholder for Timeline */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                Tezgah Durumu Zaman Çizelgesi (Geliştirilecek)
              </Typography>
            </Paper>
          </Grid>

           {/* Data Table for Details */}
           <Grid item xs={12}>
             <Paper sx={{ p: 2, height: 400, width: '100%' }}> {/* Yükseklik ve genişlik ayarlandı */}
               <Typography variant="h6" gutterBottom>Detaylı Veriler</Typography>
               {/* DataGrid eklendi */}
               <DataGrid
                 rows={rows}
                 columns={columns}
                 initialState={{
                    pagination: {
                      paginationModel: { pageSize: 5 }, // Sayfa başına satır sayısı
                    },
                  }}
                 pageSizeOptions={[5, 10, 20]} // Sayfa seçenekleri
                 autoHeight // İçeriğe göre yüksekliği ayarlar
                 density="compact" // Daha sıkı satırlar
                 // checkboxSelection // Satır seçimi istenirse (isteğe bağlı)
                 disableRowSelectionOnClick // Satıra tıklayınca seçimi engelle (isteğe bağlı)
                 sx={{
                   // OEE renk kodlaması için stiller
                   '& .oee-color--4caf50': { color: '#4caf50', fontWeight: 'bold' },
                   '& .oee-color--ff9800': { color: '#ff9800', fontWeight: 'bold' },
                   '& .oee-color--f44336': { color: '#f44336', fontWeight: 'bold' },
                   border: 0, // Kenarlığı kaldır
                 }}
               />
             </Paper>
           </Grid>

        </Grid>
      )}
    </Box>
  );
};

export default TezgahPerformansDashboard;
