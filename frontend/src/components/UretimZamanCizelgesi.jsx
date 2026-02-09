import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, Slider } from '@mui/material';
import dayjs from 'dayjs';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

// Yardımcı: Tarihleri saat olarak farkını bul
function saatFarki(t1, t2) {
  const d1 = dayjs(t1);
  const d2 = dayjs(t2);
  return d2.diff(d1, 'hour');
}

// Yardımcı: Tarih aralığındaki tüm günleri dizi olarak döndür
function tarihAraligiGunler(baslangic, bitis) {
  const gunler = [];
  let d = dayjs(baslangic).startOf('day');
  const son = dayjs(bitis).endOf('day');
  while (d.isBefore(son) || d.isSame(son, 'day')) {
    gunler.push(d.format('YYYY-MM-DD'));
    d = d.add(1, 'day');
  }
  return gunler;
}

// Yardımcı: Bir gün için o gün aktif olan vardiyaları döndür
function gunIcinAktifVardiyalar(vardiyalar, gun) {
  // gun: 'YYYY-MM-DD' formatında, dayjs ile haftanın günü alınır (Pazartesi=1, ... Pazar=7)
  let haftaninGunu = dayjs(gun).day(); // Pazar=0, Pazartesi=1, ... Cumartesi=6
  haftaninGunu = haftaninGunu === 0 ? 7 : haftaninGunu; // Pazar=7 olarak düzelt
  return vardiyalar.filter(v => {
    if (!v.haftalik_calisma_gunleri) return true;
    let gunler = v.haftalik_calisma_gunleri;
    if (typeof gunler === 'string') {
      try { gunler = JSON.parse(gunler); } catch { return true; }
    }
    return Array.isArray(gunler) && gunler.includes(haftaninGunu);
  });
}

const renkBelirle = (emri) => {
  if (emri.durum === 'tamamlandı') return '#43a047';
  if (emri.durum === 'beklemede') return '#bdbdbd';
  if (!emri.bitis && dayjs().isAfter(dayjs(emri.baslangic))) return '#1976d2';
  if (!emri.bitis && dayjs().isAfter(dayjs(emri.beklenen_bitis || emri.baslangic).add(1, 'day'))) return '#e53935';
  return '#1976d2';
};

const UretimZamanCizelgesi = () => {
  // Tarih aralığı ve zoom state
  const [baslangic, setBaslangic] = useState(dayjs().subtract(3, 'day').format('YYYY-MM-DD'));
  const [bitis, setBitis] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [zoom, setZoom] = useState(30); // 1 saat = 30px
  // Veri, yükleniyor ve hata durumları
  const [veri, setVeri] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vardiyalar, setVardiyalar] = useState([]);
  const theme = useTheme();

  // Vardiya listesini çek
  useEffect(() => {
    const fetchVardiyalar = async () => {
      try {
        const response = await axios.get('/api/raporlar/aktif-vardiyalar');
        setVardiyalar(response.data || []);
      } catch (err) {
        setVardiyalar([]);
      }
    };
    fetchVardiyalar();
  }, []);

  // API'den veri çekme fonksiyonu
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/raporlar/tezgah-uretim-zaman-cizelgesi', {
        params: { baslangic, bitis }
      });
      setVeri(response.data || []);
    } catch (err) {
      setError('Veri alınırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa açıldığında ve tarih/zoom değiştiğinde veri çek
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [baslangic, bitis]);

  // Grid için günler ve vardiyalar
  const gunler = tarihAraligiGunler(baslangic, bitis);
  // gridWidth dinamik olacak, her gün için aktif vardiya sayısı kadar sütun
  const toplamVardiyaSutun = gunler.reduce((sum, gun) => sum + gunIcinAktifVardiyalar(vardiyalar, gun).length, 0);
  const gridWidth = toplamVardiyaSutun * zoom + 160;

  // Yardımcı: İş emri bir vardiya aralığına denk geliyor mu?
  function emriVardiyaAraligindaMi(emri, gun, vardiya) {
    if (!emri.baslangic) return false;
    const bas = dayjs(emri.baslangic);
    const bit = emri.bitis ? dayjs(emri.bitis) : null;
    const gunBas = dayjs(gun + 'T' + vardiya.baslangic_saati);
    let gunBit = dayjs(gun + 'T' + vardiya.bitis_saati);
    if (gunBit.isBefore(gunBas)) gunBit = gunBit.add(1, 'day'); // Gece vardiyası
    if (bit) {
      return (
        (bas.isBefore(gunBit) && bit.isAfter(gunBas)) ||
        bas.isSame(gunBas) || bit.isSame(gunBit)
      );
    } else {
      return bas.isBefore(gunBit) && bas.isAfter(gunBas.subtract(1, 'minute'));
    }
  }

  return (
    <Paper sx={{ p: 2, overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Tezgah Bazlı Üretim Zaman Çizelgesi
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Başlangıç Tarihi"
          type="date"
          value={baslangic}
          onChange={e => setBaslangic(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="Bitiş Tarihi"
          type="date"
          value={bitis}
          onChange={e => setBitis(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Box sx={{ minWidth: 200, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Zoom:</Typography>
          <Slider
            min={10}
            max={60}
            step={2}
            value={zoom}
            onChange={(_, v) => setZoom(v)}
            valueLabelDisplay="auto"
            sx={{ width: 120 }}
          />
        </Box>
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {!loading && !error && veri.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Seçilen aralıkta veri bulunamadı.
        </Typography>
      )}
      {!loading && !error && veri.length > 0 && (
        <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1, bgcolor: '#fafbfc', pb: 2 }}>
          {/* Zaman ekseni: günler ve alt satırda sadece o gün aktif olan vardiyalar */}
          {vardiyalar.length > 0 && (
            <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: '#fafbfc', display: 'flex', minWidth: gridWidth }}>
              <Box sx={{ width: 160, minWidth: 160, borderRight: '1px solid #ddd', bgcolor: '#fff', position: 'sticky', left: 0, zIndex: 3 }} />
              {gunler.map(gun => {
                const aktifVardiyalar = gunIcinAktifVardiyalar(vardiyalar, gun);
                return (
                  <Box key={gun} sx={{ display: 'flex' }}>
                    {aktifVardiyalar.map((vardiya, vdx) => (
                      <Box key={vardiya.id} sx={{ width: zoom, textAlign: 'center', fontSize: 11, color: 'text.secondary', borderRight: '1px solid #eee', py: 0.5, borderBottom: vdx === aktifVardiyalar.length-1 ? '2px solid '+theme.palette.primary.main : 'none', bgcolor: vdx%2===0 ? '#f5f5f5' : '#fff' }}>
                        <div>{dayjs(gun).format('DD.MM')}</div>
                        <div style={{ fontWeight: 600 }}>{vardiya.vardiya_adi.split(' ')[0]}</div>
                        <div style={{ fontSize: 10 }}>{vardiya.baslangic_saati?.substring(0,5)}-{vardiya.bitis_saati?.substring(0,5)}</div>
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Box>
          )}
          {/* Tezgah satırları ve barlar */}
          {veri.map((tezgah, idx) => (
            <Box key={tezgah.tezgah_id} sx={{ display: 'flex', alignItems: 'center', minWidth: gridWidth, borderBottom: '1px solid #eee', height: 44, position: 'relative' }}>
              {/* Tezgah adı sticky */}
              <Box sx={{ width: 160, minWidth: 160, fontWeight: 500, fontSize: 15, color: 'primary.main', borderRight: '1px solid #ddd', bgcolor: '#fff', position: 'sticky', left: 0, zIndex: 2, height: 44, display: 'flex', alignItems: 'center', pl: 1 }}>
                {tezgah.tezgah_adi}
              </Box>
              {/* Barlar */}
              <Box sx={{ position: 'relative', flex: 1, height: 44 }}>
                {gunler.map((gun, gdx) => {
                  const aktifVardiyalar = gunIcinAktifVardiyalar(vardiyalar, gun);
                  return aktifVardiyalar.map((vardiya, vdx) => (
                    <React.Fragment key={gun+vardiya.id}>
                      {tezgah.is_emirleri.map((emri, i) => {
                        if (!emriVardiyaAraligindaMi(emri, gun, vardiya)) return null;
                        // Barı ilgili kutucuğa yerleştir
                        // Her gün için aktif vardiya sayısı kadar sütun olduğu için left hesaplaması değişti
                        const left = gunler.slice(0, gdx).reduce((sum, g) => sum + gunIcinAktifVardiyalar(vardiyalar, g).length, 0) * zoom + vdx * zoom;
                        const width = zoom;
                        const color = renkBelirle(emri);
                        return (
                          <Tooltip key={emri.is_emri_no + i + gun + vdx} title={
                            <Box>
                              <div><b>İş Emri No:</b> {emri.is_emri_no}</div>
                              <div><b>İş Adı:</b> {emri.is_adi}</div>
                              <div><b>Parça Kodu:</b> {emri.parca_kodu}</div>
                              <div><b>Başlangıç:</b> {emri.baslangic ? new Date(emri.baslangic).toLocaleString('tr-TR') : '-'}</div>
                              <div><b>Bitiş:</b> {emri.bitis ? new Date(emri.bitis).toLocaleString('tr-TR') : '-'}</div>
                              <div><b>İşlenen Adet:</b> {emri.islenen_adet}</div>
                              <div><b>Durum:</b> {emri.durum}</div>
                            </Box>
                          } arrow>
                            <Box
                              sx={{
                                position: 'absolute',
                                left,
                                top: 8,
                                height: 28,
                                width,
                                bgcolor: color,
                                color: '#fff',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                boxShadow: 2,
                                opacity: 0.95,
                                transition: 'opacity 0.2s',
                                '&:hover': { opacity: 1 },
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                px: 1
                              }}
                            >
                              {emri.is_emri_no} - {emri.is_adi?.slice(0, 10)}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </React.Fragment>
                  ));
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default UretimZamanCizelgesi; 