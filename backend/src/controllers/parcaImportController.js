const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Parca = require('../models/Parca');
const Grup = require('../models/Grup');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// ===== ESKİ EXCEL İÇE AKTARMA İŞLEMİ =====
const importDir = path.join(__dirname, '../../importlar');
if (!fs.existsSync(importDir)) fs.mkdirSync(importDir, { recursive: true });

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, importDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const excelUpload = multer({ 
  storage: excelStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (Excel dosyaları için)
  }
});

exports.importExcel = [
  excelUpload.single('excel'),
  async (req, res) => {
    try {
      const filePath = req.file.path;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const ws = workbook.worksheets[0];

      // Resimleri çıkar
      const images = {};
      try {
        ws.getImages().forEach(img => {
          try {
            const image = workbook.getImage(img.imageId);
            const ext = image.extension || 'jpeg';
            const buffer = image.buffer;
            const rowIdx = img.range.tl.nativeRow + 1;
            const parcaAdi = ws.getRow(rowIdx).getCell(2).value || `bilinmeyen_${rowIdx}`; // 2. sütun: parça adı
            const timestamp = Date.now();
            const fileName = `${parcaAdi}_${timestamp}.${ext}`;
            const imgPath = path.join(importDir, fileName);
            fs.writeFileSync(imgPath, buffer);
            images[rowIdx] = { fileName, imgPath };
          } catch (imgErr) {
            console.error('Resim işlenirken hata:', imgErr);
          }
        });
      } catch (imagesErr) {
        console.error('Resimler çıkarılırken hata:', imagesErr);
      }

      // Satırları işle
      const parcaList = [];
      try {
        ws.eachRow((row, rowNumber) => {
          try {
            if (rowNumber === 1) return; // başlık
            const adet = parseInt(row.getCell(1).value) || 0;
            const parcaAdi = row.getCell(2).value?.toString() || `Parça-${rowNumber}`;
            const malzeme = row.getCell(3).value?.toString() || '';
            const img = images[rowNumber];
            
            parcaList.push({
              adet,
              parcaAdi,
              malzeme,
              resim: img ? img.fileName : null
            });
            
            // NOT: Veritabanına kaydetme işlemi artık burada yapılmıyor
            // Veriler önce kullanıcıya gösterilecek ve onay alındıktan sonra kaydedilecek
          } catch (rowErr) {
            console.error(`Satır ${rowNumber} işlenirken hata:`, rowErr);
          }
        });
      } catch (rowsErr) {
        console.error('Satırlar işlenirken hata:', rowsErr);
      }

      res.json({ parcalar: parcaList });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

// ===== YENİ JSON VE RESİM İÇE AKTARMA İŞLEMİ =====

// Dosyaları uploads/parcalar dizinine kaydet
const parcaStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/parcalar');
    
    // Hedef klasör yoksa oluştur
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    // İsim değişikliği client tarafında yapılmıştı, gelen dosya adını olduğu gibi kullan
    cb(null, file.originalname);
  }
});

// Sadece görüntü dosyalarını kabul et
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir.'), false);
  }
};

const parcaUpload = multer({ 
  storage: parcaStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limitlik dosya boyutu (10MB'den artırıldı)
  }
});

// Excel'den içe aktarılan parça verilerini ve resimleri kaydet
exports.importParcalar = async (req, res) => {
  try {
    // Önce dosya yükleme middleware'ini çalıştır (çoklu dosya)
    const uploadFiles = parcaUpload.array('images');
    
    uploadFiles(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        // Multer hatası (dosya boyutu sınırı aşıldı vb.)
        return res.status(400).json({ error: `Dosya yükleme hatası: ${err.message}` });
      } else if (err) {
        // Diğer beklenmeyen hatalar
        return res.status(400).json({ error: `Dosya yükleme sırasında hata oluştu: ${err.message}` });
      }
      
      // Yüklenen veri JSON'ını parse et
      let rowsData;
      try {
        rowsData = JSON.parse(req.body.data);
      } catch (error) {
        return res.status(400).json({ error: 'Data formatı geçersiz, JSON bekleniyordu.' });
      }
      
      // Yüklenen parçaları veritabanına ekle/güncelle
      const sonuclar = [];
      
      for (const row of rowsData) {
        try {
          // Her kayıt için temel bilgileri al
          const parcaKodu = row['parça adı'] || '';
          const adet = parseInt(row['adet']) || 0;
          const malzeme = row['malzeme'] || '';
          const imageName = row.imageName || null;
          
          // Veritabanında bu kodla parça var mı kontrolü
          let parca = await Parca.findByPk(parcaKodu);
          
          // Yükleme sonucunu kaydet
          const sonuc = {
            parcaKodu,
            islem: 'Hata',
            mesaj: ''
          };
          
          // Eğer parça yoksa oluştur
          if (!parca) {
            parca = await Parca.create({
              parcaKodu: parcaKodu,
              parcaAdi: parcaKodu,
              stokAdeti: adet,
              kategori: 'İçe aktarılan',
              hamMalzemeCinsi: malzeme,
              imalMi: true,
              tedarikBedeli: 0,
              hamMalzemeOlculeri: '-',
              foto_path: imageName ? `/uploads/parcalar/${imageName}` : null
            });
            
            sonuc.islem = 'Eklendi';
            sonuc.mesaj = 'Yeni parça başarıyla oluşturuldu';
          } else {
            // Parça zaten varsa güncelle
            await parca.update({
              stokAdeti: parca.stokAdeti + adet,
              hamMalzemeCinsi: malzeme || parca.hamMalzemeCinsi,
              foto_path: imageName ? `/uploads/parcalar/${imageName}` : parca.foto_path
            });
            
            sonuc.islem = 'Güncellendi';
            sonuc.mesaj = 'Mevcut parça güncellendi';
          }
          
          sonuclar.push(sonuc);
        } catch (error) {
          console.error('Parça işlenirken hata:', error);
          sonuclar.push({
            parcaKodu: row['parça adı'] || 'Bilinmeyen',
            islem: 'Hata',
            mesaj: error.message
          });
        }
      }
      
      res.status(201).json({ 
        mesaj: `${sonuclar.length} parça içeri aktarıldı.`,
        sonuclar,
        yüklenenResimSayisi: req.files ? req.files.length : 0
      });
    });
  } catch (error) {
    console.error('İçe aktarma hatası:', error);
    res.status(500).json({ error: 'İçe aktarma sırasında bir hata oluştu', details: error.message });
  }
};

// Parçaları toplu olarak kaydet (Excel önizlemeden sonra)
exports.saveExcelParcalar = async (req, res) => {
  try {
    const { parcalar, createGroup, groupData } = req.body;
    
    if (!Array.isArray(parcalar) || parcalar.length === 0) {
      return res.status(400).json({ error: 'Geçerli parça verileri bulunamadı' });
    }
    
    const sonuclar = [];
    const fotograflarDir = path.join(__dirname, '../../uploads/fotograflar');
    
    // Fotograflar klasörünün varlığını kontrol et ve gerekirse oluştur
    if (!fs.existsSync(fotograflarDir)) {
      fs.mkdirSync(fotograflarDir, { recursive: true });
    }
    
    // Kayıt edilen parçaların kodlarını sakla (grup oluşturma için)
    const kaydedilenParcaKodlari = [];
    
    // Tüm parçaları işle
    for (const parca of parcalar) {
      try {
        const { parcaAdi, adet, malzeme, resim } = parca;
        let yeniResimYolu = null;

        // Eğer resim varsa, importlar'dan uploads/fotograflar klasörüne taşı
        if (resim) {
          const kaynak = path.join(importDir, resim);
          const hedefDosyaAdi = `parca_${parcaAdi.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${resim.split('.').pop()}`;
          const hedef = path.join(fotograflarDir, hedefDosyaAdi);

          // Resim dosyasını taşı
          if (fs.existsSync(kaynak)) {
            fs.copyFileSync(kaynak, hedef);
            // Veritabanında kullanılacak yol
            yeniResimYolu = `/uploads/fotograflar/${hedefDosyaAdi}`;
            console.log(`Resim taşındı: ${kaynak} -> ${hedef}`);
          } else {
            console.error(`Resim dosyası bulunamadı: ${kaynak}`);
          }
        }

        // Parça veritabanında var mı kontrol et
        const mevcutParca = await Parca.findByPk(parcaAdi);
        let kaydedilenParca;

        if (mevcutParca) {
          // Parça varsa güncelle
          const guncellemeVerisi = {
            hamMalzemeCinsi: malzeme || mevcutParca.hamMalzemeCinsi
          };

          // Resim atama mantığı:
          // 1. Mevcut parçada resim yoksa ve Excel'den resim geldiyse → ata
          // 2. Mevcut parçada resim varsa ve Excel'den resim geldiyse → güncelle
          // 3. Mevcut parçada resim varsa ve Excel'den resim yoksa → koru
          const mevcutResimVarmi = mevcutParca.foto_path && mevcutParca.foto_path !== '' && mevcutParca.foto_path !== null;

          if (!mevcutResimVarmi && yeniResimYolu) {
            // Mevcut resim yok, Excel'den gelen resim ata
            guncellemeVerisi.foto_path = yeniResimYolu;
          } else if (mevcutResimVarmi && yeniResimYolu) {
            // Mevcut resim var, Excel'den gelen resim ile güncelle
            guncellemeVerisi.foto_path = yeniResimYolu;
          }
          // Mevcut resim var ve Excel'den resim yoksa -> foto_path eklenmez, mevcut resim korunur

          await mevcutParca.update(guncellemeVerisi);
          kaydedilenParca = mevcutParca;

          const resimDurumu = (!mevcutResimVarmi && yeniResimYolu) ? ' (resim eklendi)' :
                              (mevcutResimVarmi && yeniResimYolu) ? ' (resim güncellendi)' : '';

          sonuclar.push({
            parcaAdi,
            durum: 'Başarılı',
            mesaj: 'Mevcut parça güncellendi' + resimDurumu
          });
        } else {
          // Parça yoksa yeni oluştur
          kaydedilenParca = await Parca.create({
            parcaKodu: parcaAdi,
            parcaAdi,
            stokAdeti: parseInt(adet) || 0,
            kategori: 'İçe aktarılan',
            hamMalzemeCinsi: malzeme || '',
            imalMi: true,
            tedarikBedeli: 0,
            hamMalzemeOlculeri: '-',
            foto_path: yeniResimYolu
          });

          sonuclar.push({
            parcaAdi,
            durum: 'Başarılı',
            mesaj: 'Yeni parça kaydedildi'
          });
        }

        // Başarılı kayıt edilen parça kodunu listeye ekle
        kaydedilenParcaKodlari.push(kaydedilenParca.parcaKodu);
      } catch (error) {
        console.error(`Parça kaydederken hata: ${error.message}`);
        sonuclar.push({
          parcaAdi: parca.parcaAdi || 'Bilinmeyen parça',
          durum: 'Hata',
          mesaj: error.message
        });
      }
    }
    
    // Eğer grup oluşturma seçeneği aktifse ve başarılı kaydedilen parça varsa
    let grupId = null;
    let grupMesaji = '';
    let bomId = null;
    
    if (createGroup && groupData && kaydedilenParcaKodlari.length > 0) {
      try {
        // Sadece BOM oluşturulacak, adet bilgisi Excel/frontend'den alınacak
        const Bom = require('../models/Bom');
        // parcalar: [{ parcaAdi, adet, ... }]
        const parcaItems = parcalar
          .filter(p => kaydedilenParcaKodlari.includes(p.parcaAdi))
          .map(p => ({
            id: p.parcaAdi,
            name: p.parcaAdi,
            type: 'PART',
            quantity: parseInt(p.adet) || 1
          }));

        const yeniBom = await Bom.create({
          name: groupData.grup_adi,
          description: groupData.aciklama || `Excel'den içe aktarılan parçalardan oluşturulan BOM - ${new Date().toLocaleDateString()}`,
          items: parcaItems
        });

        bomId = yeniBom.bom_id;
        grupMesaji = `"${groupData.grup_adi}" adlı BOM başarıyla oluşturuldu ve ${kaydedilenParcaKodlari.length} parça eklendi.`;
        console.log(grupMesaji);
        console.log(`Oluşturulan BOM: ID=${bomId}, Adı=${groupData.grup_adi}`);
        console.log(`Eklenen parçalar: ${kaydedilenParcaKodlari.join(', ')}`);
      } catch (grupError) {
        console.error('BOM oluştururken hata:', grupError);
        grupMesaji = `Parçalar kaydedildi ancak BOM oluşturulurken hata: ${grupError.message}`;
      }
    }
    
    res.json({
      mesaj: `${parcalar.length} parçadan ${sonuclar.filter(s => s.durum === 'Başarılı').length} tanesi başarıyla kaydedildi.`,
      grupMesaji,
      grupId,
      bomId,
      sonuclar
    });
    
  } catch (error) {
    console.error('Parçaları kaydederken hata:', error);
    res.status(500).json({ error: 'Parçalar kaydedilirken bir hata oluştu', details: error.message });
  }
};
