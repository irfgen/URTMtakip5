import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';

const UretimIstatistikleri = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchUretimIstatistikleri();
  }, []);

  const fetchUretimIstatistikleri = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/raporlar/uretim-istatistikleri');
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Üretim istatistikleri alınırken hata:', err);
      setError('Üretim istatistikleri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Üretim istatistikleri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Gösterilecek veri bulunamadı.</Alert>
      </Box>
    );
  }

  // Grafik verilerini hazırla
  const chartData = data.haftalik_veriler.map(hafta => ({
    hafta: hafta.hafta,
    islenenParcaAdedi: hafta.islenen_parca_adedi,
    bitenIsEmriSayisi: hafta.biten_is_emri_sayisi,
    farkliParcaSayisi: hafta.farkli_parca_sayisi
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Üretim İstatistikleri
      </Typography>

      {/* Tarih Aralığı Bilgisi */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="body1" color="text.secondary">
          <strong>Raporlama Dönemi:</strong> {formatDate(data.baslangic_tarihi)} - {formatDate(data.bitis_tarihi)}
        </Typography>
      </Paper>

      {/* Genel İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Hafta
              </Typography>
              <Typography variant="h4" component="div">
                {data.genel_istatistikler.toplam_hafta}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam İşlenen Parça
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {formatNumber(data.genel_istatistikler.toplam_islenen_parca)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Toplam Biten İş Emri
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {formatNumber(data.genel_istatistikler.toplam_biten_is_emri)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ortalama Haftalık Üretim
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {formatNumber(data.genel_istatistikler.ortalama_haftalik_parca)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grafikler */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Haftalık Üretim Grafiği */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Haftalık İşlenen Parca Adedi
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hafta"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => `Hafta: ${value}`}
                    formatter={(value, name) => [
                      formatNumber(value),
                      name === 'islenenParcaAdedi' ? 'İşlenen Parça' : 'Biten İş Emri'
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'islenenParcaAdedi' ? 'İşlenen Parça Adedi' : 'Biten İş Emri Sayısı'
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="islenenParcaAdedi"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Haftalık Biten İş Emri Grafiği */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Haftalık Biten İş Emri Sayısı
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hafta"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatNumber(value), 'İş Emri Sayısı']}
                  />
                  <Bar dataKey="bitenIsEmriSayisi" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detaylı Haftalık Tablo */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Haftalık Detaylar
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Hafta</TableCell>
                  <TableCell align="right">İşlenen Parça Adedi</TableCell>
                  <TableCell align="right">Biten İş Emri Sayısı</TableCell>
                  <TableCell align="right">Farklı Parca Sayısı</TableCell>
                  <TableCell align="right">Ortalama Parça/İş Emri</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.haftalik_veriler.map((hafta, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {hafta.hafta}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatNumber(hafta.islenen_parca_adedi)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatNumber(hafta.biten_is_emri_sayisi)}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={hafta.farkli_parca_sayisi}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {hafta.ortalama_parca_basina_is_emri}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UretimIstatistikleri;