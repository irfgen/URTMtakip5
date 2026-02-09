
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Parça resim yolunu normalize eden fonksiyon (Parcalar.jsx ile aynı mantık)
const getFotoPath = (foto_path) => {
  if (!foto_path) return '';
  if (foto_path.startsWith('/uploads/')) return foto_path;
  if (foto_path.startsWith('/fotograflar/')) return '/uploads' + foto_path;
  if (foto_path.includes('/')) return '/uploads/fotograflar/' + foto_path.split('/').pop();
  return '/uploads/fotograflar/' + foto_path;
};

const ExceldenBomUret = () => {
  const [bomName, setBomName] = useState('');
  const [parcaList, setParcaList] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupImage, setPopupImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // BOM'u kaydetme işlemi
  const handleSaveBom = async () => {
    if (!bomName || parcaList.length === 0) return;
    setSaving(true);
    try {
      // BOM item formatı: { id, name, type, quantity }
      const items = parcaList.map(p => ({
        id: p.parcaKodu || p.parcaAdi,
        name: p.parcaAdi,
        type: 'PART',
        quantity: Number(p.adet) || 1,
        position: '' // pozisyon bilgisini de ekle
      }));

      const bomData = {
        name: bomName,
        bom_aciklamasi: `Excel'den oluşturuldu - ${new Date().toLocaleString('tr-TR')}`,
        items: items
      };

      const response = await axios.post('/api/boms', bomData);

      // Başarılı mesajında detaylı bilgi göster
      alert(`BOM başarıyla kaydedildi!\n\nBOM Adı: ${bomName}\nParça Sayısı: ${items.length}\nBOM Kodu: ${response.data.bom_kodu}`);

      // Formu temizle
      setBomName('');
      setParcaList([]);
      setExcelData([]);
    } catch (err) {
      console.error('BOM kaydetme hatası:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen hata';
      alert(`BOM kaydedilirken hata oluştu!\n\nHata: ${errorMessage}`);
    }
    setSaving(false);
  };

  // İptal işlemi
  const handleCancel = () => {
    setBomName('');
    setParcaList([]);
    setExcelData([]);
  };

  // Excel dosyasını okuma
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      setExcelData(data);
      processExcelData(data);
    };
    reader.readAsBinaryString(file);
  };

  // Excel verisini işle ve parça kartlarını getir
  const processExcelData = async (data) => {
    setLoading(true);
    const header = data[0].map(h => (h || '').toString().trim().toLowerCase().replace(/ı/g, 'i').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/[^a-z0-9 ]/g, ''));
    // "parca adi" ve "adet" başlıklarını normalize ederek bul
    const parcaAdiIdx = header.findIndex(h => h.replace(/\s+/g, '').includes('parcaadi'));
    const adetIdx = header.findIndex(h => h.replace(/\s+/g, '').includes('adet'));
    if (parcaAdiIdx === -1 || adetIdx === -1) {
      alert('Excelde "Parça Adı" ve "Adet" kolonları olmalı!\nBaşlıklar: ' + data[0].join(', '));
      setLoading(false);
      return;
    }
    const newList = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const parcaAdi = row[parcaAdiIdx];
      const adet = row[adetIdx];
      if (!parcaAdi) continue;
      try {
        // Parça adı ile API'den arama yap
        const response = await axios.get(`/api/parcalar?aramaMetni=${encodeURIComponent(parcaAdi)}`);
        let parcaData = [];
        if (response.data && response.data.parcalar && Array.isArray(response.data.parcalar)) {
          parcaData = response.data.parcalar;
        } else if (Array.isArray(response.data)) {
          parcaData = response.data;
        }
        // Eşleşen ilk parça kartını al
        const matched = parcaData.find(p => p.parcaAdi === parcaAdi || p.parcaKodu === parcaAdi) || parcaData[0];
        if (matched) {
          newList.push({
            parcaAdi: matched.parcaAdi || parcaAdi,
            parcaKodu: matched.parcaKodu,
            adet,
            resim: getFotoPath(matched.foto_path),
          });
        }
        // Eşleşme yoksa listeye ekleme
      } catch (err) {
        // API hatası olursa da ekleme
      }
    }
    setParcaList(newList);
    setLoading(false);
  };

  // Parça kartı popup açma
  const handleImagePopup = (img) => setPopupImage(img);
  const closePopup = () => setPopupImage(null);

  return (
    <div style={{ padding: 24 }}>
      <h2>Excelden BOM Üret</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label>BOM İsmi: </label>
        <input
          type="text"
          value={bomName}
          onChange={e => setBomName(e.target.value)}
          placeholder="BOM ismini girin"
          style={{ marginRight: 16, flex: 1, minWidth: 200 }}
        />
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleExcelImport}
          style={{ marginRight: 16 }}
        />
        <button
          onClick={handleSaveBom}
          disabled={parcaList.length === 0 || !bomName || saving}
          style={{ marginRight: 8, padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4, cursor: parcaList.length === 0 || !bomName ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Kaydediliyor...' : 'BOM Kaydet'}
        </button>
        <button
          onClick={handleCancel}
          style={{ padding: '8px 16px', background: '#eee', color: '#333', border: '1px solid #bbb', borderRadius: 4, cursor: 'pointer' }}
        >
          İptal
        </button>
      </div>
      {loading && <div>Yükleniyor...</div>}
      <div>
        <h3>Parça Listesi</h3>
        {parcaList.length === 0 && <div>Henüz parça yok.</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {parcaList.map((parca, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              {/* Parça resmi */}
              <div style={{ marginRight: 12 }}>
                {parca.resim ? (
                  <img
                    src={parca.resim}
                    alt={parca.parcaAdi}
                    style={{ width: 40, height: 40, objectFit: 'cover', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}
                    onMouseEnter={() => handleImagePopup(parca.resim)}
                    onMouseLeave={closePopup}
                  />
                ) : (
                  <div style={{ width: 40, height: 40, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #ccc' }}>-</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {parca.parcaAdi}
                {parca.parcaKodu && (
                  <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>[{parca.parcaKodu}]</span>
                )}
              </div>
              <div>Adet: {parca.adet}</div>
            </li>
          ))}
        </ul>
      </div>
      {/* Popup büyük resim */}
      {popupImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closePopup}
        >
          <img src={popupImage} alt="Büyük Resim" style={{ maxWidth: '80vw', maxHeight: '80vh', border: '4px solid white' }} />
        </div>
      )}
    </div>
  );
};

export default ExceldenBomUret;
