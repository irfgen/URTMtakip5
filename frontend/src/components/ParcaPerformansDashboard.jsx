import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, MenuItem, TextField, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Collapse, IconButton } from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

function DrillDownRow({ row }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.parca_kodu}</TableCell>
        <TableCell>{row.parca_adi}</TableCell>
        <TableCell>{row.toplam_uretilen}</TableCell>
        <TableCell>{row.hurda_orani} %</TableCell>
        <TableCell>{row.ortalama_verimlilik}</TableCell>
        <TableCell>{row.ortalama_setup_suresi}</TableCell>
        <TableCell>{row.ortalama_uretim_suresi}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="subtitle2">Detaylar:</Typography>
              {/* Buraya daha fazla detay eklenebilir */}
              <pre style={{ fontSize: 12 }}>{JSON.stringify(row, null, 2)}</pre>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const ParcaPerformansDashboard = () => {
  const [data, setData] = useState(null);
  const [kategori, setKategori] = useState('');
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Kategori filtreleme için örnek kategoriler (gerçek API'den alınabilir)
  const kategoriler = [
    { value: '', label: 'Tümü' },
    { value: 'sac', label: 'Sac Parçalar' },
    { value: 'döküm', label: 'Döküm Parçalar' },
    { value: 'plastik', label: 'Plastik Parçalar' }
  ];

  useEffect(() => {
    setLoading(true);
    axios.get('/api/raporlar/parca-performans', {
      params: kategori ? { kategori } : {}
    })
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [kategori]);

  if (loading) return <Typography>Yükleniyor...</Typography>;
  if (!data) return <Typography>Veri bulunamadı.</Typography>;

  // Grafik verileri
  const verimlilikData = {
    labels: data.tum_parcalar.map(p => p.parca_adi),
    datasets: [
      {
        label: 'Verimlilik (%)',
        data: data.tum_parcalar.map(p => parseFloat(p.ortalama_verimlilik)),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }
    ]
  };
  const uretimSureData = {
    labels: data.tum_parcalar.map(p => p.parca_adi),
    datasets: [
      {
        label: 'Ortalama Üretim Süresi (dk)',
        data: data.tum_parcalar.map(p => parseFloat(p.ortalama_uretim_suresi)),
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }
    ]
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Parça Üretim Performans Raporu</Typography>
        <TextField
          select
          label="Parça Kategorisi"
          value={kategori}
          onChange={e => setKategori(e.target.value)}
          sx={{ mt: 2, minWidth: 200 }}
        >
          {kategoriler.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Paper>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        }}
      >
        <Tab label="Verimlilik Karşılaştırma" />
        <Tab label="Üretim Süresi Dağılımı" />
        <Tab label="Top 10 Listeler" />
        <Tab label="Tüm Parçalar" />
      </Tabs>
      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Parça Bazlı Verimlilik Karşılaştırma</Typography>
          <Bar data={verimlilikData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Paper>
      )}
      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Parça Bazlı Üretim Süresi Dağılımı</Typography>
          <Bar data={uretimSureData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Paper>
      )}
      {tab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">En Çok Üretilen 10 Parça</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parça Kodu</TableCell>
                      <TableCell>Parça Adı</TableCell>
                      <TableCell>Toplam Üretilen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.en_cok_uretilen.map(row => (
                      <TableRow key={row.parca_kodu}>
                        <TableCell>{row.parca_kodu}</TableCell>
                        <TableCell>{row.parca_adi}</TableCell>
                        <TableCell>{row.toplam_uretilen}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">En Yüksek Hurda Oranına Sahip 10 Parça</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Parça Kodu</TableCell>
                      <TableCell>Parça Adı</TableCell>
                      <TableCell>Hurda Oranı (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.en_yuksek_hurda.map(row => (
                      <TableRow key={row.parca_kodu}>
                        <TableCell>{row.parca_kodu}</TableCell>
                        <TableCell>{row.parca_adi}</TableCell>
                        <TableCell>{row.hurda_orani}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
      {tab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Tüm Parçalar (Drill-down Detay)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Parça Kodu</TableCell>
                  <TableCell>Parça Adı</TableCell>
                  <TableCell>Toplam Üretilen</TableCell>
                  <TableCell>Hurda Oranı (%)</TableCell>
                  <TableCell>Verimlilik (%)</TableCell>
                  <TableCell>Setup Süresi (dk)</TableCell>
                  <TableCell>Üretim Süresi (dk)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.tum_parcalar.map(row => (
                  <DrillDownRow key={row.parca_kodu} row={row} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ParcaPerformansDashboard;
