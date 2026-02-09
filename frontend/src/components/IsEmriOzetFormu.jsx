import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { tezgahAPI } from '../services/api';
import UygunsuzlukRaporuFormu from './UygunsuzlukRaporuFormu';

const IsEmriOzetFormu = ({ 
  open, 
  onClose, 
  isEmriId, 
  isEmriNo,
  isAdi,
  tezgahAdi,
  tezgahId
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState(null);
  
  // Uygunsuzluk raporu modal'ı için state
  const [uygunsuzlukModalOpen, setUygunsuzlukModalOpen] = useState(false);
  
  // Form verileri
  const [formData, setFormData] = useState({
    hurda_sayisi: 0,
    operator_notu: '',
    setup_sayisi: 0,
    cnc_suresi: 0,
    islenen_adet: 0,
    cnc_toplam_calisma_suresi: 0
  });
  
  // İş emri özet verilerini yükle
  useEffect(() => {
    if (open && isEmriId) {
      fetchData();
    }
  }, [open, isEmriId]);

  // Otomatik hesaplama fonksiyonu - kullanıcı değiştirdiğinde tüm alanları hesaplar
  const performCalculations = (currentFormData) => {
    const updatedFormData = { ...currentFormData };
    
    // Sayısal değerleri al ve güvenli hale getir
    const hurdaSayisi = parseInt(updatedFormData.hurda_sayisi) || 0;
    const setupSayisi = Math.max(1, parseInt(updatedFormData.setup_sayisi) || 1); // Minimum 1
    
    // 1. Setup sayısı değiştiğinde İşlenen Parça Adeti'ni güncelle (sadece setup değişikliğinde)
    let islenenAdet = parseInt(updatedFormData.islenen_adet) || 0;
    
    // Eğer setup değiştirilmişse, işlenen parça adedini yeniden hesapla
    if (data && data.calisma_durus_dongu_sayisi) {
      const calismaDurusDonguSayisi = data.calisma_durus_dongu_sayisi || 0;
      const setupBasedParcaAdeti = setupSayisi > 0 ? Math.floor(calismaDurusDonguSayisi / setupSayisi) : 0;
      
      // Sadece setup değiştiriliyorsa parça adedini güncelle, diğer durumlarda kullanıcının girdiği değeri koru
      if (updatedFormData._setupChanged) {
        updatedFormData.islenen_adet = setupBasedParcaAdeti;
        islenenAdet = setupBasedParcaAdeti;
        delete updatedFormData._setupChanged; // Flag'i temizle
      }
    }
    
    // 2. İşlenen parça adedi kullanıcı tarafından da değiştirilebilir
    
    console.log('Hesaplama güncellendi:', {
      islenenAdet,
      hurdaSayisi,
      toplamUretilen: islenenAdet + hurdaSayisi,
      setupSayisi
    });
    
    // 3. CNC Toplam Çalışma Süresi ve CNC İşleme Süresi hesaplama
    const istatistiktenToplamSure = data ? (data.toplam_calisma_suresi || 0) : 0;
    const cncSuresiInput = parseFloat(updatedFormData.cnc_suresi) || 0;
    const cncSuresiOverridden = !!updatedFormData._cncSuresiOverridden;
    
    if (cncSuresiOverridden) {
      // Kullanıcı CNC süresini manuel giriyor → Toplam süreyi bundan türet
      const yeniToplamSure = islenenAdet > 0 ? (cncSuresiInput * islenenAdet) : 0;
      updatedFormData.cnc_toplam_calisma_suresi = Math.round(yeniToplamSure * 100) / 100;
      updatedFormData.cnc_suresi = Math.round(cncSuresiInput * 100) / 100;
    } else {
      // Manuel değil → istatistikten gelen toplam süreye göre parça başı süreyi hesapla
      updatedFormData.cnc_toplam_calisma_suresi = istatistiktenToplamSure;
      if (istatistiktenToplamSure > 0 && islenenAdet > 0) {
        updatedFormData.cnc_suresi = Math.round((istatistiktenToplamSure / islenenAdet) * 100) / 100; // 2 ondalık basamak
      } else {
        updatedFormData.cnc_suresi = 0;
      }
    }
    
    // 4. Kalite hesaplamaları (görüntüleme için)
    const toplamUretilen = islenenAdet + hurdaSayisi; // İşlenen + Hurda = Toplam
    const basariOrani = toplamUretilen > 0 ? ((islenenAdet / toplamUretilen) * 100) : 0;
    const hurdaOrani = toplamUretilen > 0 ? ((hurdaSayisi / toplamUretilen) * 100) : 0;
    const efektifToplamSure = parseFloat(updatedFormData.cnc_toplam_calisma_suresi) || 0;
    const parcaBasinaOrtalamaSure = islenenAdet > 0 ? (efektifToplamSure / islenenAdet) : 0;
    
    // Hesaplanan değerleri state'e kaydet (görüntüleme için)
    updatedFormData._calculated = {
      toplamUretilen,
      basariOrani: Math.round(basariOrani * 100) / 100,
      hurdaOrani: Math.round(hurdaOrani * 100) / 100,
      parcaBasinaOrtalamaSure: Math.round(parcaBasinaOrtalamaSure * 100) / 100
    };
    
    console.log('Otomatik hesaplamalar - tüm alanlar:', {
      islenenAdet,
      hurdaSayisi,
      setupSayisi,
      istatistiktenToplamSure,
      cncSuresi: updatedFormData.cnc_suresi,
      cncToplamSure: updatedFormData.cnc_toplam_calisma_suresi,
      cncSuresiOverridden,
      hesaplananDegerler: updatedFormData._calculated
    });
    
    setFormData(updatedFormData);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Varsayılan değerlerle başla
      let isEmri = { is_adi: isAdi };
      let istatistikData = {
        baslangic_tarihi: new Date().toISOString(),
        bitis_tarihi: new Date().toISOString(),
        toplam_calisma_suresi: 0,
        toplam_durus_suresi: 0,
        toplam_uretilen: 0,
        ortalama_parca_suresi: 0,
        durus_detaylari: []
      };
      
      // İş emri bilgilerini al
      try {
        console.log("İş emri bilgileri alınıyor:", isEmriId);
        const isEmriResponse = await axios.get(`/api/is-emirleri/${isEmriId}`);
        isEmri = isEmriResponse.data;
        console.log("İş emri bilgileri alındı:", isEmri);
      } catch (isEmriErr) {
        console.error("İş emri bilgileri alınamadı:", isEmriErr);
      }
      
      // İş emri istatistiklerini API'den al
      try {
        console.log("İstatistikler alınıyor");
        const response = await axios.get(`/api/islem-kayitlari/is-emri/${isEmriId}/istatistikler`);
        istatistikData = response.data;
        console.log("İstatistikler alındı:", istatistikData);
      } catch (statsErr) {
        console.warn("İstatistikler alınamadı, varsayılan değerler kullanılacak:", statsErr);
      }
      
      setData(istatistikData);
      
      // Parça bilgilerini al (iş emrinin parça kodunu veya iş adını kullanarak)
      let parcaKodu = isEmri.parca_kodu;
      let setupSayisi = isEmri.setup_sayisi || 0;
      let cncSuresi = isEmri.cnc_suresi || 0;
      
      console.log("İş Emri Bilgileri:", { 
        isEmriId, 
        is_adi: isEmri.is_adi, 
        parca_kodu: isEmri.parca_kodu, 
        setup_sayisi: isEmri.setup_sayisi,
        cnc_suresi: isEmri.cnc_suresi
      });
      
      // Önce parca_kodu ile dene, yoksa is_adi ile dene
      if (parcaKodu) {
        try {
          console.log("Parça koduna göre sorgulama yapılıyor:", parcaKodu);
          const parcaResponse = await axios.get(`/api/parcalar/${parcaKodu}`);
          const parca = parcaResponse.data;
          console.log("Parça bulundu:", parca);
          
          if (parca) {
            // Parçadan gelen setup değerini kullan (CNC süresi hesaplanacak)
            setupSayisi = parca.setup_sayisi !== undefined ? parca.setup_sayisi : 
                         (parca.setupSayisi !== undefined ? parca.setupSayisi : setupSayisi);
                       
            console.log("Parçadan alınan setup sayısı:", { setupSayisi });
          }
        } catch (parcaErr) {
          console.warn(`Parça bilgileri parca_kodu ile alınamadı (${parcaKodu}):`, parcaErr);
          
          // parca_kodu ile bulunamadıysa, is_adi ile dene
          if (isEmri.is_adi) {
            try {
              const parcaResponse = await axios.get(`/api/parcalar/${isEmri.is_adi}`);
              const parca = parcaResponse.data;
              if (parca) {
                // Parçadan gelen setup değerini kullan
                setupSayisi = parca.setup_sayisi !== undefined ? parca.setup_sayisi : 
                            (parca.setupSayisi !== undefined ? parca.setupSayisi : setupSayisi);
                            
                console.log(`Parça bilgileri is_adi ile alındı: ${isEmri.is_adi}`);
              }
            } catch (isAdiErr) {
              console.warn(`Parça bilgileri is_adi ile de alınamadı (${isEmri.is_adi}):`, isAdiErr);
            }
          }
        }
      } else if (isEmri.is_adi) {
        // parca_kodu yoksa, direkt is_adi ile dene
        try {
          const parcaResponse = await axios.get(`/api/parcalar/${isEmri.is_adi}`);
          const parca = parcaResponse.data;
          if (parca) {
            // Parçadan gelen setup değerini kullan
            setupSayisi = parca.setup_sayisi !== undefined ? parca.setup_sayisi : 
                        (parca.setupSayisi !== undefined ? parca.setupSayisi : setupSayisi);
                      
            console.log(`Parça bilgileri is_adi ile alındı: ${isEmri.is_adi}`);
          }
        } catch (parcaErr) {
          console.warn(`Parça bilgileri is_adi ile alınamadı (${isEmri.is_adi}):`, parcaErr);
        }
      }
      
      // Hesaplanmış değerler - 0 olan setup sayısını 1 olarak kabul et
      const calismaDurusDonguSayisi = istatistikData.calisma_durus_dongu_sayisi || 0;
      const gercekSetupSayisi = Math.max(1, setupSayisi || 1); // 0 olan setup sayısını 1 olarak kabul et
      const gercekParcaAdeti = gercekSetupSayisi > 0 ? Math.floor(calismaDurusDonguSayisi / gercekSetupSayisi) : 0;
      const cncIslemeSuresi = gercekParcaAdeti > 0 ? Math.round(istatistikData.toplam_calisma_suresi / gercekParcaAdeti) : 0;
      
      console.log("Hesaplanmış değerler:", {
        calismaDurusDonguSayisi,
        setupSayisi,
        gercekSetupSayisi,
        gercekParcaAdeti,
        cncIslemeSuresi
      });
      
      // Form alanlarını ilk değerlerle doldur ve hesaplamaları yap
      const initialFormData = {
        ...formData,
        islenen_adet: gercekParcaAdeti, // API'den gelen hesaplanmış parça adeti
        setup_sayisi: gercekSetupSayisi, // API'den gelen setup sayısı
        hurda_sayisi: 0, // Varsayılan değer
        operator_notu: '' // Varsayılan değer
      };
      
      // Form state'ini güncelle ve hesaplamaları yap
      performCalculations(initialFormData);
    } catch (apiErr) {
      console.log('İş emri özet verileri alınamadı, varsayılan değerler kullanılacak.', apiErr);
      // API hata verirse varsayılan verileri kullan
      const currentDate = new Date().toISOString();
      setData({
        baslangic_tarihi: currentDate,
        bitis_tarihi: currentDate,
        toplam_calisma_suresi: 0,
        toplam_durus_suresi: 0,
        ara_verme_sayisi: 0,
        toplam_uretilen: 0,
        ortalama_parca_suresi: 0,
        verimlilik: 0,
        durus_detaylari: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Sadece toplam süre alanı düzenlenemez
    if (name === 'cnc_toplam_calisma_suresi') {
      return; // Bu alan değiştirilemez
    }
    
    // Ensure value is never null - convert to empty string for text fields and 0 for numbers
    const processedValue = value === null ? 
      (name === 'operator_notu' ? '' : 0) : 
      value;
    
    // Yeni form verilerini oluştur
    const newFormData = {
      ...formData,
      [name]: processedValue
    };
    
    // Setup değişikliği flagı ekle
    if (name === 'setup_sayisi') {
      newFormData._setupChanged = true;
    }
    
    // CNC süresi manuel girildi flag'i ekle/kaldır
    if (name === 'cnc_suresi') {
      newFormData._cncSuresiOverridden = true;
    }
    
    // Otomatik hesaplamalar - değerler değiştiğinde tüm hesaplamaları yeniden yap
    performCalculations(newFormData);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Log parameters for debugging
      console.log("İş tamamlama parametreleri:", { 
        isEmriId, 
        tezgahId,
        is_adi: isAdi,
        tezgah_adi: tezgahAdi,
        operator_notu: formData.operator_notu
      });

      // Gönderilecek veriyi güvenli şekilde hazırla
      const formPayload = {
        is_emri_id: isEmriId,
        is_adi: isAdi, // İş emri adı eklendi
        baslangic_tarihi: data?.baslangic_tarihi || new Date().toISOString(),
        bitis_tarihi: data?.bitis_tarihi || new Date().toISOString(),
        toplam_calisma_suresi: parseInt(formData.cnc_toplam_calisma_suresi) || 0,
        toplam_durus_suresi: data?.toplam_durus_suresi || 0,
        toplam_uretilen: parseInt(formData.islenen_adet) || 0,
        hurda_sayisi: parseInt(formData.hurda_sayisi) || 0,
        ortalama_parca_suresi: data?.ortalama_parca_suresi || 0,
        operator_notu: formData.operator_notu || '',
        durus_detaylari: Array.isArray(data?.durus_detaylari) ? data.durus_detaylari : [],
        setup_sayisi: parseInt(formData.setup_sayisi) || 0,
        cnc_suresi: parseFloat(formData.cnc_suresi) || 0
      };

      // İş emri özeti kaydetme
      console.log("İş emri özeti kaydediliyor...", formPayload);
      const ozetResponse = await axios.post('/api/is-emri-ozet', formPayload);
      console.log("İş emri özeti kaydedildi:", ozetResponse.data);
      
      // İş emrini tamamla API çağrısı
      if (tezgahId && isEmriId) {
        try {
          console.log(`İş emri ${isEmriId} tezgah ${tezgahId} üzerinde tamamlanıyor...`);
          
          // ID'lerin tanımlı olduğundan emin ol
          if (!isEmriId || !tezgahId) {
            throw new Error(`Eksik parametreler: isEmriId=${isEmriId}, tezgahId=${tezgahId}`);
          }
          
          console.log("API çağrısı öncesi değerler:", { tezgahId, isEmriId });
          
          // Operatör notunu ve işlenen adet bilgisini tamamlama API'sine gönderelim
          const completeResponse = await tezgahAPI.completeIsEmri(
            tezgahId, 
            isEmriId, 
            formData.operator_notu,
            parseInt(formData.islenen_adet) || 0
          );
          console.log(`İş emri başarıyla tamamlandı:`, completeResponse);
        } catch (completeErr) {
          console.error('İş emri tamamlanırken hata:', completeErr);
          if (completeErr.response) {
            console.error('API yanıt hatası:', completeErr.response.status, completeErr.response.data);
          } else if (completeErr.request) {
            console.error('API yanıt alınamadı:', completeErr.request);
          } else {
            console.error('Hata mesajı:', completeErr.message);
          }
          throw completeErr; // Hata olursa üst seviyeye taşı
        }
      } else {
        console.warn('Tezgah ID veya İş Emri ID eksik, tamamlama işlemi yapılamadı.', { 
          tezgahId: tezgahId || 'eksik', 
          isEmriId: isEmriId || 'eksik' 
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose(true); // Kayıt başarılı bilgisi ile kapat
      }, 1500);
    } catch (err) {
      console.error('İş emri özeti kaydedilirken veya iş tamamlanırken hata:', err);
      console.error('Hata detayları:', err.response?.data || err.message);
      
      // 413 Payload Too Large hatası için özel mesaj
      let errorMessage = 'İş emri işlemleri yapılırken bir hata oluştu.';
      if (err.response?.status === 413) {
        errorMessage = 'Veri boyutu çok büyük. Lütfen daha az veri ile tekrar deneyin.';
      } else {
        errorMessage += ' Detay: ' + (err.response?.data?.error || err.message);
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "-";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} saat ${mins} dk`;
    }
    return `${mins} dk`;
  };

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        İş Emri Tamamlama Özeti
        {isEmriNo && ` - ${isEmriNo}`}
        {tezgahAdi && ` (${tezgahAdi})`}
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : success ? (
          <Alert severity="success" sx={{ mt: 2 }}>İş emri özeti başarıyla kaydedildi.</Alert>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* İstatistik Bilgileri */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  İstatistikler
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Başlangıç Tarihi</Typography>
                  <Typography variant="body1">{formatDateTime(data.baslangic_tarihi)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Bitiş Tarihi</Typography>
                  <Typography variant="body1">{formatDateTime(data.bitis_tarihi)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Toplam Çalışma Süresi</Typography>
                  <Typography variant="body1">{formatDuration(data.toplam_calisma_suresi)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Toplam Duruş Süresi</Typography>
                  <Typography variant="body1">{formatDuration(data.toplam_durus_suresi)}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Toplam Üretilen Parça</Typography>
                  <Typography variant="body1">{data.toplam_uretilen || 0} adet</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Ortalama Parça Süresi</Typography>
                  <Typography variant="body1">
                    {data.ortalama_parca_suresi ? `${data.ortalama_parca_suresi} dakika/parça` : '-'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Kullanıcı Giriş Alanları */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Üretim Bilgileri
                </Typography>
                
                {/* Hesaplanan Değerler Bilgi Kutusu - Değişiklikleri Görmek İçin */}
                {formData._calculated && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                      📊 Anlık Hesaplanan Değerler (Değişiklikleri Görmek İçin)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" display="block">Toplam Üretilen</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formData._calculated.toplamUretilen} adet
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" display="block">Başarı Oranı</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          %{formData._calculated.basariOrani}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" display="block">Hurda Oranı</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: formData._calculated.hurdaOrani > 5 ? 'error.main' : 'warning.main' }}>
                          %{formData._calculated.hurdaOrani}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" display="block">Parça Başına Ortalama</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formData._calculated.parcaBasinaOrtalamaSure} dk
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="islenen_adet"
                      label="İşlenen Parça Adeti"
                      type="number"
                      fullWidth
                      value={formData.islenen_adet || 0}
                      onChange={handleInputChange}
                      InputProps={{ 
                        inputProps: { min: 0 }
                      }}
                      helperText="Setup değiştiğinde güncellenir, manuel olarak da değiştirilebilir"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="hurda_sayisi"
                      label="Hurda Sayısı"
                      type="number"
                      fullWidth
                      value={formData.hurda_sayisi || 0}
                      onChange={handleInputChange}
                      InputProps={{ 
                        inputProps: { min: 0 }
                      }}
                      helperText="Hurda parça sayısını girin → Toplam üretilen artar (İşlenen sabit kalır)"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="setup_sayisi"
                      label="Setup Sayısı"
                      type="number"
                      fullWidth
                      value={formData.setup_sayisi || 0}
                      onChange={handleInputChange}
                      InputProps={{ 
                        inputProps: { min: 0 }
                      }}
                      helperText="Setup sayısını girin → İşlenen parça adedi güncellenir"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="cnc_suresi"
                      label="CNC İşleme Süresi (dk)"
                      type="number"
                      fullWidth
                      value={formData.cnc_suresi || 0}
                      onChange={handleInputChange}
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.1 }
                      }}
                      helperText="Otomatik (Toplam Süre ÷ Parça Adeti). Değiştirirseniz Toplam Süre = Parça Adedi × CNC Süresi olur."
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="cnc_toplam_calisma_suresi"
                      label="CNC Toplam Çalışma Süresi (dk)"
                      type="number"
                      fullWidth
                      value={formData.cnc_toplam_calisma_suresi || 0}
                      InputProps={{ 
                        inputProps: { min: 0, step: 0.1 },
                        readOnly: true
                      }}
                      helperText="İstatistiklerden alınır veya CNC Süresi × Parça Adedi olarak güncellenir"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="operator_notu"
                      label="Operatör Notu"
                      multiline
                      rows={3}
                      fullWidth
                      value={formData.operator_notu || ''}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={() => onClose()} 
          disabled={submitting}
        >
          İptal
        </Button>
        
        {/* Uygunsuzluk Raporu butonu - sadece hurda sayısı > 0 ise aktif */}
        <Button 
          onClick={() => setUygunsuzlukModalOpen(true)}
          variant="outlined"
          color="warning"
          disabled={loading || submitting || !formData.hurda_sayisi || formData.hurda_sayisi === 0}
          sx={{ mr: 1 }}
        >
          Uygunsuzluk Raporu Doldur
        </Button>
        
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || submitting || success}
        >
          {submitting ? <CircularProgress size={24} /> : "Kaydet ve Tamamla"}
        </Button>
      </DialogActions>
      
      {/* Uygunsuzluk Raporu Modal'ı */}
      <UygunsuzlukRaporuFormu
        open={uygunsuzlukModalOpen}
        onClose={() => setUygunsuzlukModalOpen(false)}
        isEmriId={isEmriId}
        isEmriNo={isEmriNo}
        hurdaSayisi={formData.hurda_sayisi}
        onSave={(raporData) => {
          console.log('Uygunsuzluk raporu kaydedildi:', raporData);
          // Burada uygunsuzluk raporu kaydedildikten sonra yapılacak işlemler olabilir
        }}
      />
    </Dialog>
  );
};

export default IsEmriOzetFormu;
