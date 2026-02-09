import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  IconButton,
  Divider,
  Collapse,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import debounce from 'lodash.debounce';

const FiltrePaneli = ({
  filtreler = {},
  kategoriler = [],
  onFiltreUygula,
  onKategoriYonetimi,
  isMobile = false
}) => {
  const theme = useTheme();
  
  // Local state
  const [localFiltreler, setLocalFiltreler] = useState(filtreler);
  const [aramaMetni, setAramaMetni] = useState(filtreler.arama || '');
  const [genisletilmis, setGenisletilmis] = useState(!isMobile);

  // Debounced arama fonksiyonu
  const debouncedArama = debounce((metin) => {
    const yeniFiltreler = { ...localFiltreler, arama: metin };
    setLocalFiltreler(yeniFiltreler);
    onFiltreUygula(yeniFiltreler);
  }, 500);

  // Props'tan gelen filtreleri local state'e senkronize et
  useEffect(() => {
    setLocalFiltreler(filtreler);
    setAramaMetni(filtreler.arama || '');
  }, [filtreler]);

  // Arama metni değişikliği
  const handleAramaChange = (event) => {
    const yeniMetin = event.target.value;
    setAramaMetni(yeniMetin);
    debouncedArama(yeniMetin);
  };

  // Filtre değişiklik handler'ı
  const handleFiltreChange = (key, value) => {
    const yeniFiltreler = { ...localFiltreler, [key]: value };
    setLocalFiltreler(yeniFiltreler);
    onFiltreUygula(yeniFiltreler);
  };

  // Tüm filtreleri temizle
  const handleFiltreleriTemizle = () => {
    const temizFiltreler = {
      arama: '',
      kategori_id: null,
      baslangic_tarihi: null,
      bitis_tarihi: null,
      resimli: null,
      siralama: 'olusturma_tarihi',
      siralama_yonu: 'DESC'
    };
    setLocalFiltreler(temizFiltreler);
    setAramaMetni('');
    onFiltreUygula(temizFiltreler);
  };

  // Aktif filtre sayısını hesapla
  const getAktifFiltreSayisi = () => {
    let sayac = 0;
    if (localFiltreler.arama) sayac++;
    if (localFiltreler.kategori_id) sayac++;
    if (localFiltreler.baslangic_tarihi) sayac++;
    if (localFiltreler.bitis_tarihi) sayac++;
    if (localFiltreler.resimli !== null) sayac++;
    return sayac;
  };

  const aktifFiltreSayisi = getAktifFiltreSayisi();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box>
        {/* Mobile Header */}
        {isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              cursor: 'pointer'
            }}
            onClick={() => setGenisletilmis(!genisletilmis)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Filtreler
              </Typography>
              {aktifFiltreSayisi > 0 && (
                <Chip
                  label={aktifFiltreSayisi}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
            {genisletilmis ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              Filtreler
              {aktifFiltreSayisi > 0 && (
                <Chip
                  label={aktifFiltreSayisi}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <IconButton size="small" onClick={onKategoriYonetimi}>
              <SettingsIcon />
            </IconButton>
          </Box>
        )}

        <Collapse in={genisletilmis} timeout="auto">
          <Box sx={{ space: 2 }}>
            {/* Arama */}
            <TextField
              fullWidth
              label="Notlarda ara..."
              value={aramaMetni}
              onChange={handleAramaChange}
              placeholder="Başlık veya içerikte ara"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: aramaMetni && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setAramaMetni('');
                      handleFiltreChange('arama', '');
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )
              }}
              sx={{ mb: 2 }}
            />

            {/* Kategori Seçimi */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={localFiltreler.kategori_id || ''}
                onChange={(e) => handleFiltreChange('kategori_id', e.target.value || null)}
                label="Kategori"
              >
                <MenuItem value="">
                  <em>Tüm kategoriler</em>
                </MenuItem>
                <MenuItem value="null">
                  <em>Kategorisiz notlar</em>
                </MenuItem>
                {kategoriler.map((kategori) => (
                  <MenuItem key={kategori.id} value={kategori.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: kategori.renk_kodu,
                          mr: 1
                        }}
                      />
                      {kategori.kategori_adi}
                      {kategori.not_sayisi !== undefined && (
                        <Chip
                          label={kategori.not_sayisi}
                          size="small"
                          sx={{ ml: 1, minWidth: 'auto', height: 20 }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tarih Aralığı */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Tarih Aralığı
            </Typography>
            
            <DatePicker
              label="Başlangıç Tarihi"
              value={localFiltreler.baslangic_tarihi ? new Date(localFiltreler.baslangic_tarihi) : null}
              onChange={(date) => handleFiltreChange('baslangic_tarihi', date?.toISOString())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { mb: 1 }
                }
              }}
            />

            <DatePicker
              label="Bitiş Tarihi"
              value={localFiltreler.bitis_tarihi ? new Date(localFiltreler.bitis_tarihi) : null}
              onChange={(date) => handleFiltreChange('bitis_tarihi', date?.toISOString())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { mb: 2 }
                }
              }}
            />

            {/* Resim Filtresi */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Resim Durumu
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={localFiltreler.resimli === null ? '' : localFiltreler.resimli.toString()}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : e.target.value === 'true';
                  handleFiltreChange('resimli', value);
                }}
                displayEmpty
                size="small"
              >
                <MenuItem value="">
                  <em>Tüm notlar</em>
                </MenuItem>
                <MenuItem value="true">Resimli notlar</MenuItem>
                <MenuItem value="false">Resimsiz notlar</MenuItem>
              </Select>
            </FormControl>

            {/* Sıralama */}
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Sıralama
            </Typography>
            <FormControl fullWidth sx={{ mb: 1 }}>
              <Select
                value={localFiltreler.siralama || 'olusturma_tarihi'}
                onChange={(e) => handleFiltreChange('siralama', e.target.value)}
                size="small"
              >
                <MenuItem value="olusturma_tarihi">Oluşturma Tarihi</MenuItem>
                <MenuItem value="guncelleme_tarihi">Güncelleme Tarihi</MenuItem>
                <MenuItem value="baslik">Başlık</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={localFiltreler.siralama_yonu || 'DESC'}
                onChange={(e) => handleFiltreChange('siralama_yonu', e.target.value)}
                size="small"
              >
                <MenuItem value="DESC">Azalan (Yeni → Eski)</MenuItem>
                <MenuItem value="ASC">Artan (Eski → Yeni)</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
              <Button
                variant="outlined"
                onClick={handleFiltreleriTemizle}
                disabled={aktifFiltreSayisi === 0}
                startIcon={<ClearIcon />}
                fullWidth={isMobile}
              >
                Temizle
              </Button>
              <Button
                variant="contained"
                onClick={onKategoriYonetimi}
                startIcon={<SettingsIcon />}
                fullWidth={isMobile}
              >
                Kategoriler
              </Button>
            </Box>

            {/* Aktif Filtreler */}
            {aktifFiltreSayisi > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Aktif Filtreler
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {localFiltreler.arama && (
                    <Chip
                      label={`Arama: "${localFiltreler.arama}"`}
                      size="small"
                      onDelete={() => {
                        setAramaMetni('');
                        handleFiltreChange('arama', '');
                      }}
                    />
                  )}
                  {localFiltreler.kategori_id && (
                    <Chip
                      label={`Kategori: ${kategoriler.find(k => k.id === localFiltreler.kategori_id)?.kategori_adi || 'Bilinmeyen'}`}
                      size="small"
                      onDelete={() => handleFiltreChange('kategori_id', null)}
                    />
                  )}
                  {localFiltreler.resimli !== null && (
                    <Chip
                      label={localFiltreler.resimli ? 'Resimli' : 'Resimsiz'}
                      size="small"
                      onDelete={() => handleFiltreChange('resimli', null)}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </LocalizationProvider>
  );
};

export default FiltrePaneli;
