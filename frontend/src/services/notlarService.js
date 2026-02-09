import api from './api';

// NOTLAR API FUNCTIONS

/**
 * Tüm notları getir (filtreleme ile)
 */
export const getNotlar = async (params = {}) => {
  try {
    const response = await api.get('/notlar', { params });
    return response.data;
  } catch (error) {
    console.error('Notlar getirme hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir notu getir
 */
export const getNot = async (id) => {
  try {
    const response = await api.get(`/notlar/${id}`);
    return response.data;
  } catch (error) {
    console.error('Not getirme hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir notu getir (alias)
 */
export const getNotById = async (id) => {
  return await getNot(id);
};

/**
 * Yeni not oluştur
 */
export const createNot = async (notData, resimFiles = []) => {
  try {
    const formData = new FormData();
    
    // Text alanları ekle
    Object.keys(notData).forEach(key => {
      if (key !== 'resimler' && notData[key] !== null && notData[key] !== undefined) {
        formData.append(key, notData[key]);
      }
    });
    
    // Resim dosyaları varsa ekle
    if (resimFiles && Array.isArray(resimFiles)) {
      resimFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append('resimler', file);
        }
      });
    } else if (resimFiles && resimFiles instanceof File) {
      // Tek dosya da desteklensin
      formData.append('resimler', resimFiles);
    }
    
    const response = await api.post('/notlar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Not oluşturma hatası:', error);
    throw error;
  }
};

/**
 * Not güncelle
 */
export const updateNot = async (id, notData) => {
  try {
    const formData = new FormData();
    
    // Text alanları ekle
    Object.keys(notData).forEach(key => {
      if (key !== 'resim' && notData[key] !== null && notData[key] !== undefined) {
        formData.append(key, notData[key]);
      }
    });
    
    // Yeni resim dosyası varsa ekle
    if (notData.resim && notData.resim instanceof File) {
      formData.append('resim', notData.resim);
    }
    
    const response = await api.put(`/notlar/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Not sil
 */
export const deleteNot = async (id) => {
  try {
    const response = await api.delete(`/notlar/${id}`);
    return response.data;
  } catch (error) {
    console.error('Not silme hatası:', error);
    throw error;
  }
};

/**
 * Not resmini sil
 */
export const deleteNotResmi = async (notId, resimId) => {
  try {
    const response = await api.delete(`/notlar/${notId}/resim/${resimId}`);
    return response.data;
  } catch (error) {
    console.error('Not resmi silme hatası:', error);
    throw error;
  }
};

/**
 * Not resmini sil (alias)
 */
export const deleteNotResim = async (notId, resimId) => {
  return await deleteNotResmi(notId, resimId);
};

/**
 * Mevcut nota yeni resim ekle
 */
export const addNotResmi = async (notId, resimFiles) => {
  try {
    const formData = new FormData();
    
    // Resim dosyaları ekle
    if (resimFiles && Array.isArray(resimFiles)) {
      resimFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append('resimler', file);
        }
      });
    } else if (resimFiles && resimFiles instanceof File) {
      formData.append('resimler', resimFiles);
    }
    
    const response = await api.post(`/notlar/${notId}/resim`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Resim ekleme hatası:', error);
    throw error;
  }
};

/**
 * Mevcut nota yeni resim ekle (alias)
 */
export const addNotResimler = async (notId, resimFiles) => {
  return await addNotResmi(notId, resimFiles);
};

// KATEGORİLER API FUNCTIONS

/**
 * Tüm kategorileri getir
 */
export const getKategoriler = async (params = {}) => {
  try {
    const response = await api.get('/kategoriler', { params });
    return response.data;
  } catch (error) {
    console.error('Kategoriler getirme hatası:', error);
    throw error;
  }
};

/**
 * Belirli bir kategoriyi getir
 */
export const getKategori = async (id) => {
  try {
    const response = await api.get(`/kategoriler/${id}`);
    return response.data;
  } catch (error) {
    console.error('Kategori getirme hatası:', error);
    throw error;
  }
};

/**
 * Yeni kategori oluştur
 */
export const createKategori = async (kategoriData) => {
  try {
    const response = await api.post('/kategoriler', kategoriData);
    return response.data;
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    throw error;
  }
};

/**
 * Kategori güncelle
 */
export const updateKategori = async (id, kategoriData) => {
  try {
    const response = await api.put(`/kategoriler/${id}`, kategoriData);
    return response.data;
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    throw error;
  }
};

/**
 * Kategori sil
 */
export const deleteKategori = async (id) => {
  try {
    const response = await api.delete(`/kategoriler/${id}`);
    return response.data;
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    throw error;
  }
};

/**
 * Kategorinin notlarını başka kategoriye taşı
 */
export const tasiKategoriNotlari = async (kaynakKategoriId, hedefKategoriId) => {
  try {
    const response = await api.put(`/kategoriler/${kaynakKategoriId}/notlari-tasi`, {
      yeni_kategori_id: hedefKategoriId
    });
    return response.data;
  } catch (error) {
    console.error('Kategori notları taşıma hatası:', error);
    throw error;
  }
};

/**
 * Kategori istatistiklerini getir
 */
export const getKategoriIstatistikleri = async () => {
  try {
    const response = await api.get('/kategoriler/istatistikler');
    return response.data;
  } catch (error) {
    console.error('Kategori istatistikleri getirme hatası:', error);
    throw error;
  }
};

// UTIL FUNCTIONS

/**
 * Resim URL'si oluştur
 */
export const getResimUrl = (resimYolu) => {
  if (!resimYolu) return null;
  if (resimYolu.startsWith('http')) return resimYolu;
  // Proxy üzerinden erişim sağlanacak
  return resimYolu;
};

/**
 * Dosya boyutunu format et
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Resim dosyası mı kontrol et
 */
export const isImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
};

/**
 * Tarih formatla (Türkçe)
 */
export const formatTarih = (tarih, options = {}) => {
  if (!tarih) return '';
  
  const date = new Date(tarih);
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return date.toLocaleDateString('tr-TR', defaultOptions);
};

/**
 * Göreli tarih formatla (X gün önce, vb.)
 */
export const formatGoreliTarih = (tarih) => {
  if (!tarih) return '';
  
  const now = new Date();
  const date = new Date(tarih);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return formatTarih(tarih, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Renk kontrast hesapla (açık/koyu text için)
 */
export const getTextColor = (backgroundColor) => {
  if (!backgroundColor) return '#000000';
  
  // Hex rengi RGB'ye çevir
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Luminance hesapla
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Açık renklerde koyu text, koyu renklerde açık text
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Resim dosyası validasyonu
 */
export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Sadece JPEG, PNG, GIF ve WebP formatları desteklenmektedir.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Dosya boyutu ${formatFileSize(maxSize)} değerini aşamaz.`
    };
  }
  
  return { valid: true };
};

/**
 * Resim önizleme URL'si oluştur
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Resim boyutunu sıkıştır
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Oranları koru
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Resmi çiz
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob'a dönüştür
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export default {
  // Notlar
  getNotlar,
  getNot,
  createNot,
  updateNot,
  deleteNot,
  deleteNotResmi,
  addNotResmi,
  
  // Kategoriler
  getKategoriler,
  getKategori,
  createKategori,
  updateKategori,
  deleteKategori,
  tasiKategoriNotlari,
  getKategoriIstatistikleri,
  
  // Utils
  getResimUrl,
  formatFileSize,
  formatTarih,
  formatGoreliTarih,
  getTextColor,
  validateImageFile,
  createImagePreview,
  isImageFile,
  compressImage
};
