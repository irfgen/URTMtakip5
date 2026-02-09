import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Grid, TextField, MenuItem, CircularProgress, Alert } from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { DataGrid } from '@mui/x-data-grid';

Chart.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const getDelayColor = (delayMinutes) => {
  if (delayMinutes === null || delayMinutes === undefined) return '#9e9e9e';
  if (delayMinutes <= 0) return '#4caf50';
  if (delayMinutes <= 1440) return '#ff9800';
  return '#f44336';
};

const PlanlamaGerceklesmeDashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [uretimPlanlari, setUretimPlanlari] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/uretim-planlari')
      .then(res => setUretimPlanlari(res.data || []))
      .catch(() => setError('Filtre için üretim planı listesi alınamadı.'));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params = {};
      if (selectedPlanId) params.uretim_plani_id = selectedPlanId;
      const res = await axios.get('/api/raporlar/planlama-gerceklesme', { params });
      setReportData(res.data);
    } catch (err) {
      setError('Rapor verisi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedPlanId]);

  const selectedPlanDetails = reportData?.detaylar?.find(d => d.uretim_plani_id == selectedPlanId) || reportData?.detaylar?.[0];
  const planVsGerceklesmeData = {
    labels: selectedPlanDetails?.is_emri_detaylari?.map(ie => ie.is_emri_no || `Parça: ${ie.parca_kodu}`) || [],
    datasets: [
      {
        label: 'Planlanan Adet',
        data: selectedPlanDetails?.is_emri_detaylari?.map(ie => ie.planlanan_adet) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Gerçekleşen Adet',
        data: selectedPlanDetails?.is_emri_detaylari?.map(ie => ie.gerceklesen_adet ?? 0) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };
  const planVsGerceklesmeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Plan ID: ${selectedPlanDetails?.uretim_plani_id || 'Tümü'} - Planlanan vs Gerçekleşen Adet` },
    },
    scales: { y: { beginAtZero: true } },
  };

  const delayData = selectedPlanDetails?.is_emri_detaylari?.map(ie => ie.gecikme_suresi_dk ? parseInt(ie.gecikme_suresi_dk) : null).filter(delay => delay !== null && delay > 0) || [];
  const delayBins = { '0-60': 0, '61-180': 0, '181-360': 0, '361-720': 0, '721+': 0 };
  delayData.forEach(delay => {
    if (delay <= 60) delayBins['0-60']++;
    else if (delay <= 180) delayBins['61-180']++;
    else if (delay <= 360) delayBins['181-360']++;
    else if (delay <= 720) delayBins['361-720']++;
    else delayBins['721+']++;
  });
  const histogramData = {
    labels: Object.keys(delayBins),
    datasets: [{
      label: 'Geciken İş Emri Sayısı',
      data: Object.values(delayBins),
      backgroundColor: 'rgba(255, 159, 64, 0.6)',
    }],
  };
  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `Plan ID: ${selectedPlanDetails?.uretim_plani_id || 'Tümü'} - Gecikme Süresi Dağılımı (dk)` },
    },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'İş Emri Sayısı' } } },
  };

  const trendData = {
    labels: reportData?.detaylar?.map(d => `Plan ${d.uretim_plani_id}`) || [],
    datasets: [
      {
        label: 'Zamanında Tamamlanma Oranı (%)',
        data: reportData?.detaylar?.map(d => parseFloat(d.zamaninda_tamamlanma_orani)) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Adet Sapma Oranı (%)',
        data: reportData?.detaylar?.map(d => parseFloat(d.adet_sapma_orani)) || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Üretim Planı Doğruluk Trendleri' },
    },
    scales: { y: { title: { display: true, text: 'Oran (%)' } } },
  };

  const columns = [
    { field: 'is_emri_no', headerName: 'İş Emri No', flex: 1 },
    { field: 'is_adi', headerName: 'İş Adı', flex: 1.5 },
    { field: 'parca_kodu', headerName: 'Parça Kodu', flex: 1 },
    { field: 'planlanan_adet', headerName: 'Plan Adet', type: 'number', flex: 0.8 },
    { field: 'gerceklesen_adet', headerName: 'Gerç. Adet', type: 'number', flex: 0.8 },
    {
      field: 'planlanan_teslim',
      headerName: 'Plan Teslim',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params.value ? new Date(params.value) : null,
    },
    {
      field: 'gerceklesen_bitis',
      headerName: 'Gerç. Bitiş',
      flex: 1,
      type: 'date',
      valueGetter: (params) => params.value ? new Date(params.value) : null,
    },
    { field: 'durum', headerName: 'Durum', flex: 1 },
    {
      field: 'gecikme_suresi_dk',
      headerName: 'Gecikme (dk)',
      type: 'number',
      flex: 1,
      valueFormatter: (params) => params.value ?? '-',
      cellClassName: (params) => {
        const delay = params.value;
        if (delay === null || delay === undefined) return '';
        const color = getDelayColor(delay);
        if (color === '#ff9800') return 'delay-warning';
        if (color === '#f44336') return 'delay-critical';
        return '';
      },
    },
    {
      field: 'zamaninda_tamamlandi',
      headerName: 'Zamanında?',
      flex: 0.8,
      renderCell: (params) => (
        params.value === true ? <Typography color="success.main">Evet</Typography> :
        params.value === false ? <Typography color="error.main">Hayır</Typography> : '-'
      ),
    },
  ];
  const rows = selectedPlanDetails?.is_emri_detaylari?.map((ie, index) => ({
    id: ie.is_emri_no || `row-${index}`,
    ...ie
  })) || [];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom component="div">
        Üretim Planlama ve Gerçekleşme Raporu
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={8} md={6}>
            <TextField
              label="Üretim Planı Seç"
              select
              size="small"
              fullWidth
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              disabled={loading || uretimPlanlari.length === 0}
            >
              <MenuItem value="">Tüm Planlar (Genel Trend)</MenuItem>
              {uretimPlanlari.map(plan => (
                <MenuItem key={plan.id} value={plan.id}>
                  {`Plan ${plan.id}${plan.ozel_liste_adi ? ` (${plan.ozel_liste_adi})` : ''} - ${new Date(plan.teslim_tarihi).toLocaleDateString()}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : !reportData ? (
         <Typography align="center">Rapor verisi yükleniyor veya bulunamadı.</Typography>
      ) : (
        <Grid container spacing={3}>
          {selectedPlanDetails && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Box sx={{ height: '100%' }}>
                  <Bar data={planVsGerceklesmeData} options={planVsGerceklesmeOptions} />
                </Box>
              </Paper>
            </Grid>
          )}
          {selectedPlanDetails && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                 <Box sx={{ height: '100%' }}>
                   <Bar data={histogramData} options={histogramOptions} />
                 </Box>
              </Paper>
            </Grid>
          )}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: 400 }}>
               <Box sx={{ height: '100%' }}>
                 <Line data={trendData} options={trendOptions} />
               </Box>
            </Paper>
          </Grid>
          {selectedPlanId && selectedPlanDetails && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: 500, width: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Plan ID: {selectedPlanId} - İş Emri Detayları
                </Typography>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                  }}
                  pageSizeOptions={[5, 10, 25]}
                  autoHeight={false}
                  density="compact"
                  sx={{
                    border: 0,
                    '& .delay-warning': { color: '#ff9800', fontWeight: 'bold' },
                    '& .delay-critical': { color: '#f44336', fontWeight: 'bold' },
                  }}
                />
              </Paper>
            </Grid>
          )}
           <Grid item xs={12}>
             <Paper sx={{ p: 2 }}>
               <Typography variant="h6" gutterBottom>Genel Özet</Typography>
               <pre>{JSON.stringify(reportData.ozet, null, 2)}</pre>
             </Paper>
           </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PlanlamaGerceklesmeDashboard;
