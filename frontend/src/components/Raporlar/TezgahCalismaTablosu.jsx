import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

const TezgahCalismaTablosu = ({ data = [], vardiyaAdi, tarihAraligi }) => {
  // State yönetimi
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('tezgah_tanimi');
  const [order, setOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Çalışma süresini formatla (dakika -> saat:dakika)
   */
  const formatWorkingTime = (minutes) => {
    if (!minutes || minutes === 0) return '0s 0dk';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}dk`;
  };

  /**
   * Verimlilik rengini belirle
   */
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 80) return 'success';
    if (efficiency >= 60) return 'warning';
    return 'error';
  };

  /**
   * Verimlilik ikonu
   */
  const getEfficiencyIcon = (efficiency) => {
    if (efficiency >= 80) return <TrendingUpIcon fontSize="small" />;
    if (efficiency >= 60) return <RemoveIcon fontSize="small" />;
    return <TrendingDownIcon fontSize="small" />;
  };

  /**
   * Tablo sıralama
   */
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  /**
   * Sayfa değişikliği
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Sayfa başına satır sayısı değişikliği
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Arama ve sıralama işlemleri
   */
  const processedData = useMemo(() => {
    let filtered = data;

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.tezgah_tanimi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tezgah_tipi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tezgah_id?.toString().includes(searchTerm)
      );
    }

    // Sıralama
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Sayısal değerler için
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String değerler için
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [data, searchTerm, orderBy, order]);

  /**
   * Sayfalanmış veri
   */
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, page, rowsPerPage]);

  /**
   * Özet istatistikler
   */
  const stats = useMemo(() => {
    if (!data.length) return { toplam: 0, aktif: 0, ortalama: 0 };

    const aktifTezgahlar = data.filter(t => t.aktif_mi);
    const toplamVerimlilik = data.reduce((sum, t) => sum + (t.verimlilik_orani || 0), 0);

    return {
      toplam: data.length,
      aktif: aktifTezgahlar.length,
      ortalama: data.length > 0 ? (toplamVerimlilik / data.length).toFixed(1) : 0
    };
  }, [data]);

  if (!data.length) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Tezgah verisi bulunamadı
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Seçilen vardiya ve tarih aralığında tezgah çalışma verisi bulunmuyor
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Başlık ve Özet */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tezgah Çalışma Detayları
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Toplam: ${stats.toplam} tezgah`} 
            variant="outlined" 
          />
          <Chip 
            label={`Aktif: ${stats.aktif} tezgah`} 
            color="success" 
            variant="outlined" 
          />
          <Chip 
            label={`Ortalama Verimlilik: %${stats.ortalama}`} 
            color={getEfficiencyColor(parseFloat(stats.ortalama))}
            variant="outlined" 
          />
          {tarihAraligi && (
            <Chip 
              label={`${tarihAraligi.baslangic} - ${tarihAraligi.bitis}`} 
              icon={<ScheduleIcon />}
              variant="outlined" 
            />
          )}
        </Box>

        {/* Arama */}
        <TextField
          placeholder="Tezgah ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      {/* Tablo */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'tezgah_id'}
                  direction={orderBy === 'tezgah_id' ? order : 'asc'}
                  onClick={() => handleSort('tezgah_id')}
                >
                  Tezgah No
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'tezgah_tanimi'}
                  direction={orderBy === 'tezgah_tanimi' ? order : 'asc'}
                  onClick={() => handleSort('tezgah_tanimi')}
                >
                  Tezgah Adı
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'tezgah_tipi'}
                  direction={orderBy === 'tezgah_tipi' ? order : 'asc'}
                  onClick={() => handleSort('tezgah_tipi')}
                >
                  Tezgah Tipi
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'calisma_suresi'}
                  direction={orderBy === 'calisma_suresi' ? order : 'asc'}
                  onClick={() => handleSort('calisma_suresi')}
                >
                  Çalışma Süresi
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'durus_suresi'}
                  direction={orderBy === 'durus_suresi' ? order : 'asc'}
                  onClick={() => handleSort('durus_suresi')}
                >
                  Duruş Süresi
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'verimlilik_orani'}
                  direction={orderBy === 'verimlilik_orani' ? order : 'asc'}
                  onClick={() => handleSort('verimlilik_orani')}
                >
                  Verimlilik
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'toplam_islem_sayisi'}
                  direction={orderBy === 'toplam_islem_sayisi' ? order : 'asc'}
                  onClick={() => handleSort('toplam_islem_sayisi')}
                >
                  İşlem Sayısı
                </TableSortLabel>
              </TableCell>
              <TableCell>Durum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((tezgah, index) => (
              <TableRow 
                key={tezgah.tezgah_id || index}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  opacity: tezgah.aktif_mi ? 1 : 0.7
                }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {tezgah.tezgah_id}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {tezgah.tezgah_tanimi}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={tezgah.tezgah_tipi} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={tezgah.calisma_suresi > 0 ? 'success.main' : 'text.secondary'}
                    fontWeight="medium"
                  >
                    {formatWorkingTime(tezgah.calisma_suresi)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={tezgah.durus_suresi > 0 ? 'warning.main' : 'text.secondary'}
                  >
                    {formatWorkingTime(tezgah.durus_suresi)}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getEfficiencyIcon(tezgah.verimlilik_orani)}
                    <Chip 
                      label={`%${tezgah.verimlilik_orani || 0}`}
                      color={getEfficiencyColor(tezgah.verimlilik_orani || 0)}
                      size="small"
                    />
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {tezgah.toplam_islem_sayisi || 0}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip 
                    label={tezgah.aktif_mi ? 'Aktif' : 'Pasif'}
                    color={tezgah.aktif_mi ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sayfalama */}
      <TablePagination
        component="div"
        count={processedData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Sayfa başına satır:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
        }
      />
    </Box>
  );
};

export default TezgahCalismaTablosu;