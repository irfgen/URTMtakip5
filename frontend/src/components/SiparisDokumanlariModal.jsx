import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Grid, Card, CardMedia, CardContent, Typography, IconButton } from '@mui/material';
import { Delete, ArrowUpward, ArrowDownward, CloudUpload } from '@mui/icons-material';
import axios from 'axios';

export default function SiparisDokumanlariModal({ open, onClose, isEmriId, isEmriNo }) {
  const [dokumanlar, setDokumanlar] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchDokumanlar = async () => {
    try {
      console.log('📋 Dokümanlar getiriliyor, İş emri ID:', isEmriId);
      
      if (!isEmriId) {
        console.log('⚠️ İş emri ID yok, geçici dokümanlar kontrol ediliyor');
        // Geçici dokümanları localStorage'dan al veya boş liste göster
        const tempDokumanlar = JSON.parse(localStorage.getItem(`temp_dokuman_${isEmriNo || 'new'}`) || '[]');
        setDokumanlar(tempDokumanlar);
        return;
      }
      
      const res = await axios.get(`/api/siparis-dokumanlari/list?is_emri_id=${isEmriId}`);
      console.log('✅ Dokümanlar başarıyla getirildi:', res.data);
      setDokumanlar(res.data);
    } catch (error) {
      console.error('❌ Doküman listesi getirme hatası:', error);
      if (error.response) {
        console.error('Backend yanıtı:', error.response.data);
      }
      setDokumanlar([]);
    }
  };

  useEffect(() => {
    if (open) fetchDokumanlar();
  }, [open, isEmriId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('❌ Dosya seçilmedi');
      return;
    }
    
    console.log('📁 Dosya yüklenmeye başlanıyor:', file.name, 'İş emri ID:', isEmriId);
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // İş emri ID yoksa (yeni iş emri ekleme durumu), temporary olarak işaretle
      if (isEmriId) {
        formData.append('is_emri_id', isEmriId);
        
        console.log('📤 FormData hazırlandı, API ye gönderiliyor...');
        const response = await axios.post('/api/siparis-dokumanlari/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('✅ Dosya yükleme başarılı:', response.data);
        await fetchDokumanlar();
      } else {
        // Geçici dosya yükleme için özel bir işaret
        formData.append('temporary_upload', 'true');
        formData.append('is_emri_no', isEmriNo || 'temp');
        
        console.log('📤 Geçici FormData hazırlandı, API ye gönderiliyor...');
        const response = await axios.post('/api/siparis-dokumanlari/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('✅ Geçici dosya yükleme başarılı:', response.data);
        
        // Geçici dokümanları localStorage'a kaydet
        const tempDokumanlar = JSON.parse(localStorage.getItem(`temp_dokuman_${isEmriNo || 'new'}`) || '[]');
        const yeniDokuman = {
          id: `temp_${Date.now()}`,
          is_emri_id: null,
          dosya_yolu: response.data.dosya_yolu,
          yuklenme_tarihi: new Date().toISOString(),
          siralama: tempDokumanlar.length + 1,
          temporary: true
        };
        tempDokumanlar.push(yeniDokuman);
        localStorage.setItem(`temp_dokuman_${isEmriNo || 'new'}`, JSON.stringify(tempDokumanlar));
        
        await fetchDokumanlar();
      }
    } catch (error) {
      console.error('❌ Dosya yükleme hatası:', error);
      if (error.response) {
        console.error('Backend yanıtı:', error.response.data);
        alert(`Dosya yükleme hatası: ${error.response.data.error || error.response.data.message || 'Bilinmeyen hata'}`);
      } else {
        console.error('Network hatası:', error.message);
        alert(`Bağlantı hatası: ${error.message}`);
      }
    } finally {
      setUploading(false);
      // Input değerini temizle ki aynı dosya tekrar seçilebilsin
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!isEmriId) {
        // Geçici doküman silme
        const tempDokumanlar = JSON.parse(localStorage.getItem(`temp_dokuman_${isEmriNo || 'new'}`) || '[]');
        const filteredDokumanlar = tempDokumanlar.filter(d => d.id !== id);
        localStorage.setItem(`temp_dokuman_${isEmriNo || 'new'}`, JSON.stringify(filteredDokumanlar));
        await fetchDokumanlar();
      } else {
        // Normal doküman silme
        await axios.delete(`/api/siparis-dokumanlari/${id}`);
        await fetchDokumanlar();
      }
    } catch (error) {
      console.error('❌ Doküman silme hatası:', error);
      alert('Doküman silinirken bir hata oluştu');
    }
  };

  const move = async (idx, dir) => {
    try {
      if (!isEmriId) {
        // Geçici dokümanlar için sıralama
        const tempDokumanlar = JSON.parse(localStorage.getItem(`temp_dokuman_${isEmriNo || 'new'}`) || '[]');
        const newOrder = [...tempDokumanlar];
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= tempDokumanlar.length) return;
        [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
        // Sıralamaları güncelle
        newOrder.forEach((d, i) => {
          d.siralama = i + 1;
        });
        localStorage.setItem(`temp_dokuman_${isEmriNo || 'new'}`, JSON.stringify(newOrder));
        await fetchDokumanlar();
      } else {
        // Normal dokümanlar için sıralama
        const newOrder = [...dokumanlar];
        const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= dokumanlar.length) return;
        [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
        // Sıralamaları güncelle
        await axios.patch('/api/siparis-dokumanlari/order', {
          order: newOrder.map((d, i) => ({ id: d.id, siralama: i + 1 }))
        });
        await fetchDokumanlar();
      }
    } catch (error) {
      console.error('❌ Doküman sıralama hatası:', error);
      alert('Doküman sıralaması güncellenirken bir hata oluştu');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Sipariş ve Tedarik Dökümanları</DialogTitle>
      <DialogContent>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          disabled={uploading}
          sx={{ mb: 2 }}
          onClick={(e) => {
            // Click event'i durdurmak için
            e.stopPropagation();
            console.log('🔄 Doküman yükleme butonu tıklandı');
          }}
        >
          {uploading ? 'Yükleniyor...' : 'Doküman Yükle'}
          <input 
            type="file" 
            hidden 
            onChange={handleUpload} 
            accept="image/*,application/pdf"
            onClick={(e) => {
              // Input click event'i durdurmak için
              e.stopPropagation();
              console.log('📂 Dosya input tıklandı');
            }}
          />
        </Button>
        {!isEmriId && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ℹ️ Bu dokümanlar geçici olarak saklanmaktadır. İş emri oluşturulduktan sonra kalıcı hale gelecektir.
          </Typography>
        )}
        <Grid container spacing={2}>
          {dokumanlar.map((dok, idx) => (
            <Grid item xs={12} sm={6} key={dok.id}>
              <Card>
                <CardMedia
                  component={dok.dosya_yolu.endsWith('.pdf') ? 'iframe' : 'img'}
                  height="120"
                  image={dok.dosya_yolu}
                  src={dok.dosya_yolu}
                  alt="Döküman"
                  sx={{ objectFit: 'contain' }}
                />
                <CardContent>
                  <Typography variant="subtitle2">İş Emri No: {isEmriNo}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(dok.yuklenme_tarihi).toLocaleString('tr-TR')}
                  </Typography>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <IconButton size="small" onClick={() => move(idx, 'up')} disabled={idx === 0}><ArrowUpward /></IconButton>
                    <IconButton size="small" onClick={() => move(idx, 'down')} disabled={idx === dokumanlar.length - 1}><ArrowDownward /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(dok.id)}><Delete /></IconButton>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
