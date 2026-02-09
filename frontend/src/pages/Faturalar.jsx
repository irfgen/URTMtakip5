import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  DataGrid,
  trTR
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { faturaAPI } from '../services/api';

const Faturalar = () => {
  const navigate = useNavigate();
  const [faturalar, setFaturalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20
  });
  const [rowCount, setRowCount] = useState(0);
  const [filters, setFilters] = useState({
    tedarikci_id: '',
    durum: '',
    baslangic_tarih: '',
    bitis_tarih: '',
    arama: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [sortModel, setSortModel] = useState([
    { field: 'belge_tarih', sort: 'desc' }
  ]);

  // Faturaları yükle
  const loadFaturalar = async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize
      };

      if (filters.tedarikci_id) params.tedarikci_id = filters.tedarikci_id;
      if (filters.durum) params.durum = filters.durum;
      if (filters.baslangic_tarih) params.baslangic_tarih = filters.baslangic_tarih;
      if (filters.bitis_tarih) params.bitis_tarih = filters.bitis_tarih;

      const response = await faturaAPI.getAll(params);
      setFaturalar(response.data.data || []);
      setRowCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Faturalar yüklenirken hata:', error);
      setSnackbar({
        open: true,
        message: 'Faturalar yüklenirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaturalar();
  }, [paginationModel.page, paginationModel.pageSize, filters]);

  // Filtre değişimi
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  // Filtreleri temizle
  const handleClearFilters = () => {
    setFilters({
      tedarikci_id: '',
      durum: '',
      baslangic_tarih: '',
      bitis_tarih: '',
      arama: ''
    });
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  // DataGrid sütunları
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      sortable: true
    },
    {
      field: 'fatura_no',
      headerName: 'Fatura No',
      width: 150,
      sortable: true,
      renderCell: (params) => params.row.fatura_no || '-'
    },
    {
      field: 'belge_tarih',
      headerName: 'Belge Tarihi',
      width: 130,
      sortable: true,
      type: 'date',
      valueGetter: (params) => params.row.belge_tarih ? new Date(params.row.belge_tarih) : null,
      renderCell: (params) => params.row.belge_tarih ? new Date(params.row.belge_tarih).toLocaleDateString('tr-TR') : '-'
    },
    {
      field: 'tedarikci_adi',
      headerName: 'Tedarikçi',
      width: 200,
      sortable: false,
      renderCell: (params) => params.row.tedarikci?.firma_adi || params.row.tedarikci_adi || '-'
    },
    {
      field: 'toplam_kalem',
      headerName: 'Kalem',
      width: 80,
      sortable: false,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'toplam_miktar',
      headerName: 'Miktar',
      width: 120,
      sortable: false,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    {
      field: 'genel_toplam',
      headerName: 'Tutar',
      width: 140,
      sortable: false,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (params.value == null) return '-';
        return new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: 'TRY'
        }).format(params.value);
      }
    },
    {
      field: 'durum',
      headerName: 'Durum',
      width: 140,
      sortable: false,
      renderCell: (params) => {
        const durum = params.row.durum;
        let color = 'default';
        let label = durum;

        switch (durum) {
          case 'bekliyor':
            color = 'warning';
            label = 'Bekliyor';
            break;
          case 'kismi_eslesti':
            color = 'info';
            label = 'Kısmi Eşleşti';
            break;
          case 'tam_eslesti':
            color = 'success';
            label = 'Tam Eşleşti';
            break;
          default:
            label = durum || '-';
        }

        return <Chip label={label} color={color} size="small" />;
      }
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Eşleştir">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/faturalar/${params.row.id}/eslestirme`)}
            >
              <LinkIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Detay">
            <IconButton
              size="small"
              onClick={() => navigate(`/faturalar/${params.row.id}`)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Aktif filtre sayısı
  const activeFilterCount = Object.values(filters).filter(
    v => v !== '' && v !== null && v !== undefined
  ).length;

  return (
    <Box sx={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h4">Faturalar</Typography>

        <Grid container spacing={2} alignItems="center" sx={{ flexGrow: 1, maxWidth: { xs: '100%', md: '80%' } }}>
          {/* Arama */}
          <Grid item xs={12} md={3}>
            <TextField
              label="Arama"
              variant="outlined"
              fullWidth
              size="small"
              value={filters.arama}
              onChange={(e) => handleFilterChange('arama', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                endAdornment: filters.arama && (
                  <IconButton
                    size="small"
                    onClick={() => handleFilterChange('arama', '')}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>

          {/* Durum Filtresi */}
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Durum</InputLabel>
              <Select
                value={filters.durum}
                onChange={(e) => handleFilterChange('durum', e.target.value)}
                label="Durum"
              >
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="bekliyor">Bekliyor</MenuItem>
                <MenuItem value="kismi_eslesti">Kısmi Eşleşti</MenuItem>
                <MenuItem value="tam_eslesti">Tam Eşleşti</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Başlangıç Tarihi */}
          <Grid item xs={12} md={2}>
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              fullWidth
              size="small"
              value={filters.baslangic_tarih}
              onChange={(e) => handleFilterChange('baslangic_tarih', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Bitiş Tarihi */}
          <Grid item xs={12} md={2}>
            <TextField
              label="Bitiş Tarihi"
              type="date"
              fullWidth
              size="small"
              value={filters.bitis_tarih}
              onChange={(e) => handleFilterChange('bitis_tarih', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Filtre İşlemleri */}
          <Grid item>
            {activeFilterCount > 0 && (
              <Tooltip title={` ${activeFilterCount} filtre temizle`}>
                <IconButton onClick={handleClearFilters} color="primary">
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>

          {/* Yeni Fatura Butonu */}
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/faturalar/yeni')}
            >
              Yeni Fatura
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Aktif Filtre Uyarısı */}
      {activeFilterCount > 0 && (
        <Alert severity="info" sx={{ m: 2 }}>
          {activeFilterCount} aktif filtre mevcut
        </Alert>
      )}

      {/* DataGrid */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={faturalar}
              columns={columns}
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationMode="server"
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={setSortModel}
              disableRowSelectionOnClick
              localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(224, 224, 224, 1)'
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid rgba(224, 224, 224, 1)',
                  fontWeight: 'bold'
                }
              }}
            />
          )}
        </Paper>
      </Box>

      {/* Snackbar */}
      {/* <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar> */}
    </Box>
  );
};

export default Faturalar;
