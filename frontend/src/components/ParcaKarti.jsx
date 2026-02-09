import React, { useState } from 'react';
import { Typography, Box } from '@mui/material';
import axios from 'axios';
import QRCodeDisplay from './common/QRCodeDisplay';

// Basit stiller, component içinde izole
const styles = {
  card: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 16,
    width: 220,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#fff',
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid #eee',
    background: '#f5f5f5',
  },
  popup: {
    position: 'absolute',
    top: 10,
    left: '110%',
    zIndex: 10,
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: 8,
  },
  bigImage: {
    width: 240,
    height: 240,
    objectFit: 'contain',
    borderRadius: 8,
  },
  name: {
    fontWeight: 600,
    fontSize: 18,
    margin: '12px 0 4px 0',
    textAlign: 'center',
  },
  stock: {
    fontSize: 15,
    margin: '2px 0',
  },
  critical: {
    color: '#d32f2f',
    fontWeight: 500,
  },
  techIcon: {
    marginTop: 10,
    cursor: 'pointer',
    color: '#1976d2',
    fontSize: 22,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
};

/**
 * ParcaKarti Component
 * @param {string} imageUrl - Parça küçük resmi
 * @param {string} name - Parça adı
 * @param {number} stock - Stok adedi
 * @param {number} criticalStock - Kritik stok adedi
 * @param {string} teknikResimUrl - Teknik resim linki
 * @param {string} sldprtPath - SLDPRT dosya yolu
 * @param {string} slddrwPath - SLDDRW dosya yolu
 */
function ParcaKarti({ imageUrl, name, stock, criticalStock, teknikResimUrl, sldprtPath, slddrwPath }) {
  const [showPopup, setShowPopup] = useState(false);

  // CAD dosyası URL'ini HTTP formatına dönüştür
  const getCadFileUrl = (filePath) => {
    if (!filePath) return null;

    // Eğer zaten HTTP URL ise aynı şekilde kullan
    if (filePath.startsWith('http')) {
      return filePath;
    }

    // Dosya adını al
    const filename = filePath.split(/[\\/]/).pop();
    if (!filename) return null;

    // HTTP URL oluştur
    return `/api/cad-files/${filename}`;
  };

  // CAD dosyasını aç
  const handleCadFileClick = async (filePath, fileType) => {
    try {
      const filename = filePath.split(/[\\/]/).pop();
      const response = await axios.get(`/api/cad-files/info/${filename}`);

      if (response.data.success && response.data.data.exists) {
        // Yeni sekmede aç
        window.open(response.data.data.httpUrl, '_blank');
      } else {
        // Dosya bulunamazsa veya erişilemezse kullanıcı bilgilendir
        alert(`CAD dosyasına erişilemiyor:\n\n${filePath}\n\nDosya yolu: ${response.data?.data?.filePath || 'Bilinmiyor'}\n\nÇözüm: CAD dosyalarını sunucunun erişebileceği bir dizine kopyalayın.`);
      }
    } catch (error) {
      console.error('CAD dosyası açılırken hata:', error);

      // Hata mesajını kullanıcıya göster
      const errorMessage = error.response?.data?.message || error.message || 'Bilinmeyen hata';
      alert(`CAD dosyası açılırken hata oluştu:\n\n${filePath}\n\nHata: ${errorMessage}\n\nCAD dosyasının sunucu tarafından erişilebilir olduğundan emin olun.`);
    }
  };

  // Parça kodu zorunlu, yoksa kart gösterilmesin
  if (!name) {
    return (
      <div style={{ color: 'red', padding: 16, border: '1px solid #f44336', borderRadius: 8, background: '#fff0f0', textAlign: 'center' }}>
        Parça kartı oluşturulamadı. Parça kodu eksik veya hatalı.
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        style={{ position: 'relative' }}
      >
        <img src={imageUrl} alt={name} style={styles.image} onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }} />
        {showPopup && (
          <div style={styles.popup}>
            <img src={imageUrl} alt={name} style={styles.bigImage} onError={e => { e.target.onerror = null; e.target.src = '/no-image.png'; }} />
          </div>
        )}
      </div>
      <div style={styles.name}>{name}</div>
      <div style={styles.stock}>Stok: <b>{stock}</b></div>
      <div style={{ ...styles.stock, ...styles.critical }}>
        Kritik Stok: <b>{criticalStock}</b>
      </div>

      {/* CAD Dosya Yolları */}
      {(sldprtPath || slddrwPath) && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            CAD Dosyaları:
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sldprtPath && (
              <button
                onClick={() => handleCadFileClick(sldprtPath, 'sldprt')}
                style={{
                  ...styles.techIcon,
                  fontSize: 16,
                  padding: '2px 4px',
                  cursor: 'pointer',
                  border: '1px solid #1976d2',
                  borderRadius: 4,
                  backgroundColor: '#f5f5f5',
                  transition: 'background-color 0.2s'
                }}
                title="SLDPRT Dosyasını Aç"
                onMouseOver={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: 4 }}>
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
                SLDPRT
              </button>
            )}
            {slddrwPath && (
              <button
                onClick={() => handleCadFileClick(slddrwPath, 'slddrw')}
                style={{
                  ...styles.techIcon,
                  fontSize: 16,
                  padding: '2px 4px',
                  cursor: 'pointer',
                  border: '1px solid #1976d2',
                  borderRadius: 4,
                  backgroundColor: '#f5f5f5',
                  transition: 'background-color 0.2s'
                }}
                title="SLDDRW Dosyasını Aç"
                onMouseOver={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{ marginRight: 4 }}>
                  <path d="M12.293 2.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-9 9a1 1 0 0 1-.39.242l-5 1.5a1 1 0 0 1-1.263-1.263l1.5-5a1 1 0 0 1 .242-.39l9-9zM5.13 15.37l3.5-1.05-2.45-2.45-1.05 3.5zm2.12-4.24l2.45 2.45 7.09-7.09-2.45-2.45-7.09 7.09z"/>
                </svg>
                SLDDRW
              </button>
            )}
          </div>
        </div>
      )}

      {/* QR Kod */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <QRCodeDisplay
          parcaKodu={name}
          parcaAdi={name}
          size={64}
          variant="compact"
        />
      </Box>

      {/* Teknik Resim Linki */}
      {teknikResimUrl && (
        <a
          href={teknikResimUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.techIcon}
          title="Teknik Resim Aç"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M12.293 2.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1 0 1.414l-9 9a1 1 0 0 1-.39.242l-5 1.5a1 1 0 0 1-1.263-1.263l1.5-5a1 1 0 0 1 .242-.39l9-9zM5.13 15.37l3.5-1.05-2.45-2.45-1.05 3.5zm2.12-4.24l2.45 2.45 7.09-7.09-2.45-2.45-7.09 7.09z"></path></svg>
          Teknik Resim
        </a>
      )}
    </div>
  );
}

export default ParcaKarti;
