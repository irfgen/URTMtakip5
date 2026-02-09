const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { Op } = require('sequelize');
const db = require('../models');

const dizinTaramaController = {
  // Dizin analizi yapma
  async analizDizin(req, res) {
    try {
      const { dizinYolu } = req.body;

      if (!dizinYolu) {
        return res.status(400).json({
          success: false,
          message: 'Dizin yolu belirtilmesi gerekiyor'
        });
      }

      console.log('Dizin analizi başlatılıyor:', dizinYolu);

      // Dosyaları find ile bul (IPTAL klasörleri hariç)
      const findCommand = `find "${dizinYolu}" -type f \\( -iname "*.sldprt" -o -iname "*.slddrw" -o -iname "*.pdf" \\) ! -path "*/IPTAL/*" 2>/dev/null || true`;

      let dosyalar = [];
      try {
        const findResult = execSync(findCommand, { encoding: 'utf8', timeout: 30000 });
        dosyalar = findResult.trim().split('\n').filter(f => f.trim());
      } catch (findError) {
        console.error('Find komutu hatası:', findError.message);
        // Hata durumunda boş array ile devam et
      }

      console.log(`Toplam ${dosyalar.length} dosya bulundu`);

      // Dosyaları parça adına göre gruplandır
      const parcalar = {};

      dosyalar.forEach(dosyaYolu => {
        if (!dosyaYolu.trim()) return;

        const dosyaAdi = path.basename(dosyaYolu);
        const uzanti = path.extname(dosyaAdi).toLowerCase();
        const parcaAdi = path.parse(dosyaAdi).name;

        if (!parcalar[parcaAdi]) {
          parcalar[parcaAdi] = {
            parcaAdi: parcaAdi,
            sldprt: [],
            slddrw: [],
            pdf: []
          };
        }

        if (uzanti === '.sldprt') {
          parcalar[parcaAdi].sldprt.push(dosyaYolu);
        } else if (uzanti === '.slddrw') {
          parcalar[parcaAdi].slddrw.push(dosyaYolu);
        } else if (uzanti === '.pdf') {
          parcalar[parcaAdi].pdf.push(dosyaYolu);
        }
      });

      // Parça listesini array'e çevir ve sırala
      const parcaListesi = Object.values(parcalar)
        .sort((a, b) => a.parcaAdi.localeCompare(b.parcaAdi))
        .map(parca => ({
          ...parca,
          has3D: parca.sldprt.length > 0,
          hasDrawing: parca.slddrw.length > 0,
          hasPDF: parca.pdf.length > 0,
          toplamDosya: parca.sldprt.length + parca.slddrw.length + parca.pdf.length
        }));

      // İstatistikleri hesapla
      const istatistikler = {
        toplamParca: parcaListesi.length,
        toplamSLDPRT: parcaListesi.reduce((sum, p) => sum + p.sldprt.length, 0),
        toplamSLDDRW: parcaListesi.reduce((sum, p) => sum + p.slddrw.length, 0),
        toplamPDF: parcaListesi.reduce((sum, p) => sum + p.pdf.length, 0),
        toplamDosya: dosyalar.length,
        eksikDrawing: parcaListesi.filter(p => p.has3D && !p.hasDrawing).length,
        eksikPDF: parcaListesi.filter(p => p.has3D && !p.hasPDF).length,
        tamDosyalar: parcaListesi.filter(p => p.has3D && p.hasDrawing && p.hasPDF).length
      };

      console.log('Analiz tamamlandı:', istatistikler);

      res.json({
        success: true,
        data: {
          dizinYolu: dizinYolu,
          parcaListesi: parcaListesi,
          istatistikler: istatistikler
        }
      });

    } catch (error) {
      console.error('Dizin analizi hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Dizin analizi sırasında hata oluştu: ' + error.message
      });
    }
  },

  // Dizin varlığını kontrol et
  async kontrolDizin(req, res) {
    try {
      const { dizinYolu } = req.body;

      if (!dizinYolu) {
        return res.status(400).json({
          success: false,
          message: 'Dizin yolu belirtilmesi gerekiyor'
        });
      }

      try {
        // Dizin varlığını ve erişilebilirliğini kontrol et
        await fs.access(dizinYolu, fs.constants.R_OK);
        const stats = await fs.stat(dizinYolu);

        if (!stats.isDirectory()) {
          return res.json({
            success: false,
            message: 'Belirtilen yol bir dizin değil'
          });
        }

        res.json({
          success: true,
          message: 'Dizin erişilebilir durumda'
        });

      } catch (accessError) {
        res.json({
          success: false,
          message: 'Dizine erişim sağlanamıyor: ' + accessError.message
        });
      }

    } catch (error) {
      console.error('Dizin kontrol hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Dizin kontrolü sırasında hata oluştu: ' + error.message
      });
    }
  },

  // Alt dizinleri listele (dizin seçici için)
  async listeDizinler(req, res) {
    try {
      const { parentPath = '/' } = req.body;

      try {
        const items = await fs.readdir(parentPath);
        const dizinler = [];

        for (const item of items) {
          const itemPath = path.join(parentPath, item);
          try {
            const stats = await fs.stat(itemPath);
            if (stats.isDirectory()) {
              dizinler.push({
                name: item,
                path: itemPath,
                isDirectory: true
              });
            }
          } catch (statError) {
            // Erişim hatalarını yok say
            continue;
          }
        }

        // Dizinleri sırala
        dizinler.sort((a, b) => a.name.localeCompare(b.name));

        res.json({
          success: true,
          data: {
            parentPath: parentPath,
            directories: dizinler
          }
        });

      } catch (readdirError) {
        res.json({
          success: false,
          message: 'Dizin okunamıyor: ' + readdirError.message
        });
      }

    } catch (error) {
      console.error('Dizin listeleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Dizin listeleme sırasında hata oluştu: ' + error.message
      });
    }
  },

  // Client'tan gelen tarama sonuçlarını işle
  async clientSonucuAl(req, res) {
    try {
      const taramaSonucu = req.body;

      if (!taramaSonucu || !taramaSonucu.data) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz tarama sonucu verisi'
        });
      }

      const { data } = taramaSonucu;

      const scanMode = data.scanMode || 'legacy';

      // Gelişmiş istatistikleri formatla
      let statistics = {};
      if (scanMode === 'enhanced') {
        statistics = {
          scanMode: 'enhanced',
          totalAssemblies: data.istatistikler?.totalAssemblies || 0,
          totalParts: data.istatistikler?.totalParts || 0,
          assembliesWithFiles: data.istatistikler?.assembliesWithFiles || 0,
          assembliesWithDrawings: data.istatistikler?.assembliesWithDrawings || 0,
          assembliesWithChildren: data.istatistikler?.assembliesWithChildren || 0,
          partsWith3D: data.istatistikler?.partsWith3D || 0,
          partsWithDrawings: data.istatistikler?.partsWithDrawings || 0,
          partsWithPDF: data.istatistikler?.partsWithPDF || 0,
          standaloneParts: data.istatistikler?.standaloneParts || 0,
          completeAssemblies: data.istatistikler?.completeAssemblies || 0,
          totalFiles: data.istatistikler?.totalFiles || 0
        };
      } else {
        statistics = {
          scanMode: 'legacy',
          toplamParca: data.istatistikler?.toplamParca || 0,
          toplamSLDPRT: data.istatistikler?.toplamSLDPRT || 0,
          toplamSLDDRW: data.istatistikler?.toplamSLDDRW || 0,
          toplamPDF: data.istatistikler?.toplamPDF || 0,
          toplamDosya: data.istatistikler?.toplamDosya || 0,
          eksikDrawing: data.istatistikler?.eksikDrawing || 0,
          eksikPDF: data.istatistikler?.eksikPDF || 0,
          tamDosyalar: data.istatistikler?.tamDosyalar || 0
        };
      }

      console.log('Client tarama sonucu alındı:', {
        scanMode: scanMode,
        dizinYolu: data.dizinYolu,
        toplamParca: data.parcaListesi?.length || 0,
        toplamDosya: statistics.totalFiles || 0,
        clientVersion: taramaSonucu.clientVersion || 'bilinmiyor',
        istatistikler: statistics
      });

      // Burada sonuçları veritabanına kaydedebilir veya başka işlemler yapabilirsiniz
      // Örneğin: tarama geçmişini kaydetme, raporlama vs.

      // Socket.IO ile frontend'e bildirim gönder (eğer aktif ise)
      if (req.app.get('io')) {
        req.app.get('io').emit('dizinTaramaSonucu', {
          type: 'client-scan-complete',
          data: data
        });
      }

      res.json({
        success: true,
        message: 'Tarama sonucu başarıyla alındı',
        data: {
          alinanParca: data.istatistikler?.toplamParca || 0,
          alinanDosya: data.istatistikler?.toplamDosya || 0,
          taramaZamani: data.taramaZamani || new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Client sonuç alma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Client sonuç alma sırasında hata oluştu: ' + error.message
      });
    }
  },

  // 🆕 v1.2.0 - Tek parça bilgisi getir
  async getPartInfo(req, res) {
    try {
      const { partName } = req.body;

      if (!partName) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PART_NAME',
            message: 'Parça adı belirtilmesi gerekiyor'
          }
        });
      }

      console.log('Parça bilgisi sorgulanıyor:', partName);

      // Parçayı veritabanında ara (parcaKodu veya parcaAdi ile eşleşme)
      // SQLite uyumlu case-insensitive arama
      const parca = await db.Parca.findOne({
        where: {
          [Op.or]: [
            db.sequelize.where(
              db.sequelize.fn('UPPER', db.sequelize.col('parcaKodu')),
              'LIKE',
              `%${partName.toUpperCase()}%`
            ),
            db.sequelize.where(
              db.sequelize.fn('UPPER', db.sequelize.col('parcaAdi')),
              'LIKE',
              `%${partName.toUpperCase()}%`
            )
          ]
        },
        include: [
          {
            model: db.StokKarti,
            as: 'stokKarti',
            required: false
          }
        ]
      });

      if (!parca) {
        // Parça bulunamadı, benzer parça öner
        const similarParts = await db.Parca.findAll({
          where: {
            [Op.or]: [
              db.sequelize.where(
                db.sequelize.fn('UPPER', db.sequelize.col('parcaKodu')),
                'LIKE',
                `%${partName.substring(0, 5).toUpperCase()}%`
              ),
              db.sequelize.where(
                db.sequelize.fn('UPPER', db.sequelize.col('parcaAdi')),
                'LIKE',
                `%${partName.substring(0, 5).toUpperCase()}%`
              )
            ]
          },
          limit: 3,
          attributes: ['parcaKodu', 'parcaAdi']
        });

        return res.json({
          success: true,
          data: {
            partName: partName,
            found: false,
            suggestions: similarParts.map(p => ({
              code: p.parcaKodu,
              name: p.parcaAdi
            })),
            reason: 'Parça sistemde bulunamadı'
          }
        });
      }

      // Eksik alanları tespit et
      const missingFields = [];

      if (!parca.foto_path) {
        missingFields.push({
          field: 'foto_path',
          description: 'Parça resmi',
          severity: 'medium'
        });
      }

      if (!parca.teknik_resim_path) {
        missingFields.push({
          field: 'teknik_resim_path',
          description: 'Teknik resim dosyası',
          severity: 'high'
        });
      }

      if (!parca.setupSayisi || parca.setupSayisi === 0) {
        missingFields.push({
          field: 'setupSayisi',
          description: 'Setup sayısı',
          severity: 'low'
        });
      }

      if (!parca.cncIslemeSuresi || parca.cncIslemeSuresi === 0) {
        missingFields.push({
          field: 'cncIslemeSuresi',
          description: 'CNC işleme süresi',
          severity: 'low'
        });
      }

      // Tamamlanma oranını hesapla
      const totalFields = 10; // Toplam önemli alan sayısı
      const completionRate = (totalFields - missingFields.length) / totalFields;

      // Yanıt formatı
      const partData = {
        exists: true,
        id: parca.id,
        parcaKodu: parca.parcaKodu,
        parcaAdi: parca.parcaAdi,
        stokAdeti: parca.stokAdeti || 0,
        kritik_stok: parca.kritik_stok || 0,
        tedarikBedeli: parca.tedarikBedeli || 0,
        imalMi: parca.imalMi || false,
        fasonMaliyeti: parca.fasonMaliyeti || 0,
        sirketIciMaliyeti: parca.sirketIciMaliyeti || 0,
        foto_path: parca.foto_path,
        teknik_resim_path: parca.teknik_resim_path,
        setupSayisi: parca.setupSayisi || 0,
        cncIslemeSuresi: parca.cncIslemeSuresi || 0,
        siyah: parca.siyah || false,
        stokKarti: parca.stokKarti ? {
          id: parca.stokKarti.id,
          malzeme_cinsi: parca.stokKarti.malzeme_cinsi,
          kesit: parca.stokKarti.kesit,
          boy: parca.stokKarti.boy,
          birim: parca.stokKarti.birim
        } : null
      };

      res.json({
        success: true,
        data: {
          partName: partName,
          found: true,
          partData: partData,
          missingFields: missingFields,
          completionRate: completionRate,
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Parça bilgisi getirme hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PART_INFO_ERROR',
          message: 'Parça bilgisi getirilirken hata oluştu: ' + error.message,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  },

  // 🆕 v1.2.0 - Toplu parça bilgisi getir
  async getBulkPartInfo(req, res) {
    try {
      const { partNames } = req.body;

      if (!partNames || !Array.isArray(partNames) || partNames.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PART_NAMES',
            message: 'Geçerli parça adları listesi gerekli'
          }
        });
      }

      // Max 1.000.000 parça limiti
      if (partNames.length > 1000000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_PARTS',
            message: 'En fazla 1.000.000 parça bilgisi aynı anda sorgulanabilir'
          }
        });
      }

      console.log(`Toplu parça bilgisi sorgulanıyor: ${partNames.length} parça`);

      const startTime = Date.now();
      const results = [];

      // Tüm parçaları tek sorguda bul - SQLite uyumlu
      const parcalar = await db.Parca.findAll({
        where: {
          [Op.or]: partNames.map(name => ({
            [Op.or]: [
              db.sequelize.where(
                db.sequelize.fn('UPPER', db.sequelize.col('parcaKodu')),
                'LIKE',
                `%${name.toUpperCase()}%`
              ),
              db.sequelize.where(
                db.sequelize.fn('UPPER', db.sequelize.col('parcaAdi')),
                'LIKE',
                `%${name.toUpperCase()}%`
              )
            ]
          }))
        },
        include: [
          {
            model: db.StokKarti,
            as: 'stokKarti',
            required: false
          }
        ]
      });

      // Her parça adı için sonuç oluştur
      for (const partName of partNames) {
        const parca = parcalar.find(p =>
          p.parcaKodu?.toLowerCase().includes(partName.toLowerCase()) ||
          p.parcaAdi?.toLowerCase().includes(partName.toLowerCase())
        );

        if (!parca) {
          results.push({
            partName: partName,
            found: false,
            reason: 'Parça sistemde bulunamadı'
          });
          continue;
        }

        // Eksik alanları tespit et (getPartInfo ile aynı mantık)
        const missingFields = [];

        if (!parca.foto_path) missingFields.push({ field: 'foto_path', description: 'Parça resmi', severity: 'medium' });
        if (!parca.teknik_resim_path) missingFields.push({ field: 'teknik_resim_path', description: 'Teknik resim dosyası', severity: 'high' });
        if (!parca.setupSayisi || parca.setupSayisi === 0) missingFields.push({ field: 'setupSayisi', description: 'Setup sayısı', severity: 'low' });
        if (!parca.cncIslemeSuresi || parca.cncIslemeSuresi === 0) missingFields.push({ field: 'cncIslemeSuresi', description: 'CNC işleme süresi', severity: 'low' });

        const completionRate = (10 - missingFields.length) / 10;

        results.push({
          partName: partName,
          found: true,
          partData: {
            exists: true,
            id: parca.id,
            parcaKodu: parca.parcaKodu,
            parcaAdi: parca.parcaAdi,
            stokAdeti: parca.stokAdeti || 0,
            kritik_stok: parca.kritik_stok || 0,
            tedarikBedeli: parca.tedarikBedeli || 0,
            imalMi: parca.imalMi || false,
            fasonMaliyeti: parca.fasonMaliyeti || 0,
            sirketIciMaliyeti: parca.sirketIciMaliyeti || 0,
            foto_path: parca.foto_path,
            teknik_resim_path: parca.teknik_resim_path,
            setupSayisi: parca.setupSayisi || 0,
            cncIslemeSuresi: parca.cncIslemeSuresi || 0,
            siyah: parca.siyah || false,
            stokKarti: parca.stokKarti ? {
              id: parca.stokKarti.id,
              malzeme_cinsi: parca.stokKarti.malzeme_cinsi,
              kesit: parca.stokKarti.kesit,
              boy: parca.stokKarti.boy,
              birim: parca.stokKarti.birim
            } : null
          },
          missingFields: missingFields,
          completionRate: completionRate
        });
      }

      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      // İstatistikleri hesapla
      const foundCount = results.filter(r => r.found).length;
      const notFoundCount = results.length - foundCount;
      const averageCompletionRate = foundCount > 0 ?
        results.filter(r => r.found).reduce((sum, r) => sum + r.completionRate, 0) / foundCount : 0;
      const totalMissingFields = results
        .filter(r => r.found)
        .reduce((sum, r) => sum + r.missingFields.length, 0);

      res.json({
        success: true,
        data: {
          requestedCount: partNames.length,
          foundCount: foundCount,
          notFoundCount: notFoundCount,
          parts: results,
          statistics: {
            averageCompletionRate: averageCompletionRate,
            totalMissingFields: totalMissingFields,
            queryExecutionTime: `${executionTime}s`
          }
        }
      });

    } catch (error) {
      console.error('Toplu parça bilgisi getirme hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_PART_INFO_ERROR',
          message: 'Toplu parça bilgisi getirilirken hata oluştu: ' + error.message,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  },

  // 🆕 v1.2.0 - Parça adına göre arama
  async searchPartByName(req, res) {
    try {
      const { searchTerm, limit = 10 } = req.body;

      if (!searchTerm || searchTerm.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SEARCH_TERM',
            message: 'Arama terimi en az 2 karakter olmalı'
          }
        });
      }

      console.log('Parça arama yapılıyor:', searchTerm);

      const parcalar = await db.Parca.findAll({
        where: {
          [Op.or]: [
            db.sequelize.where(
              db.sequelize.fn('UPPER', db.sequelize.col('parcaKodu')),
              'LIKE',
              `%${searchTerm.toUpperCase()}%`
            ),
            db.sequelize.where(
              db.sequelize.fn('UPPER', db.sequelize.col('parcaAdi')),
              'LIKE',
              `%${searchTerm.toUpperCase()}%`
            )
          ]
        },
        limit: Math.min(limit, 1000000),
        attributes: ['parcaKodu', 'parcaAdi', 'stokAdeti', 'imalMi'],
        order: [['parcaKodu', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          searchTerm: searchTerm,
          resultCount: parcalar.length,
          parts: parcalar.map(p => ({
            parcaKodu: p.parcaKodu,
            parcaAdi: p.parcaAdi,
            stokAdeti: p.stokAdeti || 0,
            imalMi: p.imalMi || false
          }))
        }
      });

    } catch (error) {
      console.error('Parça arama hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PART_SEARCH_ERROR',
          message: 'Parça arama sırasında hata oluştu: ' + error.message
        }
      });
    }
  },

  // 🆕 v1.2.3 - Parça CAD dosya yollarını güncelle
  async updatePartCADPaths(req, res) {
    try {
      const { parcaKodu } = req.params;
      const { sldprt_yolu, slddrw_yolu } = req.body;

      if (!parcaKodu) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PART_CODE',
            message: 'Parça kodu belirtilmesi gerekiyor'
          }
        });
      }

      console.log('Parça CAD yolları güncelleniyor:', parcaKodu);

      // Parçayı bul
      const parca = await db.Parca.findByPk(parcaKodu);
      if (!parca) {
        return res.json({
          success: false,
          data: {
            partCode: parcaKodu,
            found: false,
            reason: 'Parça sistemde bulunamadı'
          }
        });
      }

      // Güncellenecek verileri hazırla
      const updateData = {};
      if (sldprt_yolu !== undefined) updateData.sldprt_yolu = sldprt_yolu;
      if (slddrw_yolu !== undefined) updateData.slddrw_yolu = slddrw_yolu;

      // Eğer güncellenecek veri yoksa başarılı response dön
      if (Object.keys(updateData).length === 0) {
        return res.json({
          success: true,
          data: {
            partCode: parcaKodu,
            found: true,
            updated: false,
            reason: 'Güncellenecek CAD dosya yolu bilgisi belirtilmedi',
            currentData: {
              sldprt_yolu: parca.sldprt_yolu,
              slddrw_yolu: parca.slddrw_yolu
            }
          }
        });
      }

      // Parçayı güncelle
      await parca.update(updateData);

      // Güncellenmiş parçayı döndür
      const updatedParca = await db.Parca.findByPk(parcaKodu, {
        attributes: ['parcaKodu', 'parcaAdi', 'sldprt_yolu', 'slddrw_yolu', 'updatedAt']
      });

      console.log('Parça CAD yolları güncellendi:', {
        parcaKodu: parcaKodu,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: {
          partCode: parcaKodu,
          found: true,
          updated: true,
          updatedFields: Object.keys(updateData),
          partData: {
            parcaKodu: updatedParca.parcaKodu,
            parcaAdi: updatedParca.parcaAdi,
            sldprt_yolu: updatedParca.sldprt_yolu,
            slddrw_yolu: updatedParca.slddrw_yolu,
            updatedAt: updatedParca.updatedAt
          },
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Parça CAD yolları güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_CAD_PATHS_ERROR',
          message: 'Parça CAD yolları güncellenirken hata oluştu: ' + error.message,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  },

  // 🆕 v1.2.3 - Toplu parça CAD dosya yollarını güncelle
  async updateBulkPartCADPaths(req, res) {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_UPDATES_DATA',
            message: 'Geçerli güncelleme verileri gerekli'
          }
        });
      }

      // Max 1.000.000 parça limiti
      if (updates.length > 1000000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_UPDATES',
            message: 'En fazla 1.000.000 parça aynı anda güncellenebilir'
          }
        });
      }

      console.log(`Toplu parça CAD yolları güncelleniyor: ${updates.length} parça`);

      const results = [];
      const startTime = Date.now();

      for (const update of updates) {
        const { parcaKodu, sldprt_yolu, slddrw_yolu } = update;

        try {
          // Parçayı bul
          const parca = await db.Parca.findByPk(parcaKodu);

          if (!parca) {
            results.push({
              partCode: parcaKodu,
              found: false,
              updated: false,
              reason: 'Parça bulunamadı'
            });
            continue;
          }

          // Güncellenecek verileri hazırla
          const updateData = {};
          if (sldprt_yolu !== undefined) updateData.sldprt_yolu = sldprt_yolu;
          if (slddrw_yolu !== undefined) updateData.slddrw_yolu = slddrw_yolu;

          if (Object.keys(updateData).length === 0) {
            results.push({
              partCode: parcaKodu,
              found: true,
              updated: false,
              reason: 'Güncellenecek veri yok'
            });
            continue;
          }

          // Parçayı güncelle
          await parca.update(updateData);

          results.push({
            partCode: parcaKodu,
            found: true,
            updated: true,
            updatedFields: Object.keys(updateData)
          });

        } catch (error) {
          console.error(`Parça güncelleme hatası (${parcaKodu}):`, error);
          results.push({
            partCode: parcaKodu,
            found: false,
            updated: false,
            error: error.message
          });
        }
      }

      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      // İstatistikleri hesapla
      const foundCount = results.filter(r => r.found).length;
      const updatedCount = results.filter(r => r.updated).length;
      const errorCount = results.filter(r => r.error).length;

      res.json({
        success: true,
        data: {
          requestedCount: updates.length,
          foundCount: foundCount,
          updatedCount: updatedCount,
          errorCount: errorCount,
          results: results,
          statistics: {
            executionTime: `${executionTime}s`,
            successRate: foundCount > 0 ? (updatedCount / foundCount) * 100 : 0
          }
        }
      });

    } catch (error) {
      console.error('Toplu parça CAD yolları güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_UPDATE_CAD_PATHS_ERROR',
          message: 'Toplu parça CAD yolları güncellenirken hata oluştu: ' + error.message,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  },

  // 🆕 YENİ - Toplu parça kaydetme (dizin tarama sonuçlarını veritabanına aktar)
  async savePartsToDatabase(req, res) {
    try {
      const { parts } = req.body;

      if (!parts || !Array.isArray(parts) || parts.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARTS_DATA',
            message: 'Geçerli parça verileri listesi gerekli'
          }
        });
      }

      // Max 10.000 parça limiti (veritabanı performansı için)
      if (parts.length > 10000) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_PARTS_TO_SAVE',
            message: 'En fazla 10.000 parça aynı anda kaydedilebilir'
          }
        });
      }

      console.log(`Toplu parça kaydetme işlemi başlatılıyor: ${parts.length} parça`);

      const startTime = Date.now();
      const results = [];

      // Her parçayı kaydet/güncelle
      for (const part of parts) {
        try {
          const {
            fileName,
            parcaKodu,
            parcaAdi,
            sldprt_yolu,
            slddrw_yolu,
            pdf_yolu,
            has3D,
            hasDrawing,
            hasPDF
          } = part;

          // Dosya adından parça kodu çıkar (eğer belirtilmemişse)
          const finalParcaKodu = parcaKodu || path.parse(fileName).name;
          const finalParcaAdi = parcaAdi || finalParcaKodu;

          if (!finalParcaKodu || finalParcaKodu.trim() === '') {
            results.push({
              fileName: fileName || 'Bilinmeyen',
              success: false,
              error: 'Geçerli parça kodu belirtilmedi'
            });
            continue;
          }

          // Önce parçayı ara (parcaKodu ile eşleşme)
          let existingPart = await db.Parca.findOne({
            where: {
              [Op.or]: [
                { parcaKodu: finalParcaKodu },
                { parcaAdi: finalParcaKodu }
              ]
            }
          });

          let savedPart;
          let operation;

          if (existingPart) {
            // Mevcut parçayı güncelle (sadece eksik alanları)
            const updates = {};

            // Parça adı boşsa doldur
            if (!existingPart.parcaAdi || existingPart.parcaAdi.trim() === '') {
              updates.parcaAdi = finalParcaAdi;
            }

            // Parça kodu boşsa doldur
            if (!existingPart.parcaKodu || existingPart.parcaKodu.trim() === '') {
              updates.parcaKodu = finalParcaKodu;
            }

            // CAD dosyaları (eğer boşsa ve client'tan geldiyse)
            if ((!existingPart.sldprt_yolu || existingPart.sldprt_yolu.trim() === '') && sldprt_yolu) {
              updates.sldprt_yolu = sldprt_yolu;
            }
            if ((!existingPart.slddrw_yolu || existingPart.slddrw_yolu.trim() === '') && slddrw_yolu) {
              updates.slddrw_yolu = slddrw_yolu;
            }

            // Diğer varsayılan değerler (eğer boşsa)
            if (!existingPart.stokAdeti) updates.stokAdeti = 0;
            if (!existingPart.imalMi) updates.imalMi = true;
            if (!existingPart.birim) updates.birim = 'ADET';

            // Metadata
            updates.kayitKaynagi = 'dizin_tarama';
            updates.kayitTarihi = new Date();
            updates.guncellemeTarihi = new Date();

            if (Object.keys(updates).length > 0) {
              await existingPart.update(updates);
              operation = 'updated';
            } else {
              operation = 'no_change_needed';
            }

            savedPart = existingPart;

          } else {
            // Yeni parça oluştur
            savedPart = await db.Parca.create({
              parcaKodu: finalParcaKodu,
              parcaAdi: finalParcaAdi,
              stokAdeti: 0,
              tedarikBedeli: 0,  // Zorunlu alan, varsayılan değer
              imalMi: true,
              birim: 'ADET',
              kayitKaynagi: 'dizin_tarama',
              kayitTarihi: new Date(),
              guncellemeTarihi: new Date(),
              aciklama: `Dizin tarama ile otomatik kaydedildi - ${fileName}`,
              // CAD dosyaları
              sldprt_yolu: sldprt_yolu || null,
              slddrw_yolu: slddrw_yolu || null
            });
            operation = 'created';
          }

          results.push({
            fileName: fileName,
            parcaKodu: finalParcaKodu,
            parcaAdi: finalParcaAdi,
            success: true,
            operation: operation,
            partId: savedPart.id,
            databaseId: savedPart.parcaKodu
          });

        } catch (error) {
          console.error(`Parça kaydetme hatası (${part.fileName}):`, error);
          results.push({
            fileName: part.fileName || 'Bilinmeyen',
            parcaKodu: part.parcaKodu || 'Bilinmeyen',
            success: false,
            error: error.message
          });
        }
      }

      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      // İstatistikleri hesapla
      const successCount = results.filter(r => r.success).length;
      const createdCount = results.filter(r => r.operation === 'created').length;
      const updatedCount = results.filter(r => r.operation === 'updated').length;
      const errorCount = results.filter(r => !r.success).length;

      res.json({
        success: true,
        data: {
          requestedCount: parts.length,
          successCount: successCount,
          createdCount: createdCount,
          updatedCount: updatedCount,
          errorCount: errorCount,
          executionTime: `${executionTime.toFixed(2)}s`,
          results: results,
          statistics: {
            successRate: (successCount / parts.length) * 100,
            newPartsRate: (createdCount / parts.length) * 100,
            updatedPartsRate: (updatedCount / parts.length) * 100
          }
        }
      });

    } catch (error) {
      console.error('Toplu parça kaydetme hatası:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_SAVE_PARTS_ERROR',
          message: 'Parçalar veritabanına kaydedilirken hata oluştu: ' + error.message,
          details: {
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  }
};

module.exports = dizinTaramaController;