const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// Latest version bilgisini al
function getLatestVersion() {
  try {
    const versionPath = path.join(__dirname, '../../../DizinTarama_Client/DZNTRM_python/version.py');
    if (fs.existsSync(versionPath)) {
      const versionContent = fs.readFileSync(versionPath, 'utf-8');
      const majorMatch = versionContent.match(/VERSION_MAJOR\s*=\s*(\d+)/);
      const minorMatch = versionContent.match(/VERSION_MINOR\s*=\s*(\d+)/);
      const patchMatch = versionContent.match(/VERSION_PATCH\s*=\s*(\d+)/);

      if (majorMatch && minorMatch && patchMatch) {
        return `${majorMatch[1]}.${minorMatch[1]}.${patchMatch[1]}`;
      }
    }
  } catch (error) {
    console.warn('Version bilgisi okunamadı, varsayılan versiyon kullanılıyor:', error.message);
  }
  return '1.2.12'; // Fallback version
}

// C# version bilgisini al
function getCSharpVersion() {
  try {
    const csprojPath = path.join(__dirname, '../../../DizinTarama_Client/DZNTRM_cs/URTM.DizinTarama.Client.csproj');
    if (fs.existsSync(csprojPath)) {
      const csprojContent = fs.readFileSync(csprojPath, 'utf-8');
      const versionMatch = csprojContent.match(/<AssemblyVersion>([^<]+)<\/AssemblyVersion>/);

      if (versionMatch) {
        return versionMatch[1];
      }
    }
  } catch (error) {
    console.warn('C# version bilgisi okunamadı, varsayılan versiyon kullanılıyor:', error.message);
  }
  return '1.0.0.0'; // Fallback version
}

// Python Client dosyalarını zip olarak indir
router.get('/dizin-tarama-python-client', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '../../..');
    const clientPath = path.join(baseDir, 'DizinTarama_Client/DZNTRM_python');

    // Version bilgisini al
    const version = getLatestVersion();

    console.log(`Python Client v${version} indiriliyor`);

    // Client klasörünün varlığını kontrol et
    if (!fs.existsSync(clientPath)) {
      return res.status(404).json({
        success: false,
        message: 'Python Client dosyaları bulunamadı'
      });
    }

    // ZIP dosyası oluştur
    const archive = archiver('zip', {
      zlib: { level: 9 } // En yüksek sıkıştırma
    });

    // Dosya adı ve headers
    const fileName = `URTM_DizinTarama_Python_Client_v${version}.zip`;
    res.attachment(fileName);
    res.setHeader('Content-Type', 'application/zip');

    // Archive'ı response'a pipe et
    archive.pipe(res);

    // Python Client dosyalarını arşive ekle
    const filesToInclude = [
      // Core files
      'main.py',
      'version.py',
      'requirements.txt',

      // Modules
      'database_client.py',
      'selection_manager.py',
      'part_detail_window.py',
      'windows_utils.py',
      'build_package.py',
      'release.py',
      'update_download_links.py',
      'bump_version.py',

      // Installation files
      'install.bat',
      'run.bat',
      'debug_install.bat',
      'fix_encoding.bat',
      'simple_install.bat',
      'quick_install.bat',
      'setup_windows.bat',
      'run_simple.bat',
      'start.bat',
      'install_pillow.bat',

      // Documentation
      'README.md',
      'README_WINDOWS.md',
      'KURULUM_REHBERI.md',
      'CHANGELOG.md',
      'SORUN_GIDERME.md',
      'VERSION_MANAGEMENT.md',
      'QUICK_FIX_GUIDE.md'
    ];

    filesToInclude.forEach(file => {
      const filePath = path.join(clientPath, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    // Arşivi sonlandır
    await archive.finalize();

    console.log(`Python Client v${version} dinamik olarak oluşturuldu ve indirildi: ${fileName}`);

  } catch (error) {
    console.error('Python Client download hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Python Client indirme hatası: ' + error.message
    });
  }
});

// C# Client dosyalarını zip olarak indir
router.get('/dizin-tarama-csharp-client', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '../../..');
    const clientPath = path.join(baseDir, 'DizinTarama_Client/DZNTRM_cs');

    // Version bilgisini al
    const version = getCSharpVersion();

    console.log(`C# Client v${version} indiriliyor`);

    // Client klasörünün varlığını kontrol et
    if (!fs.existsSync(clientPath)) {
      return res.status(404).json({
        success: false,
        message: 'C# Client dosyaları bulunamadı'
      });
    }

    // ZIP dosyası oluştur
    const archive = archiver('zip', {
      zlib: { level: 9 } // En yüksek sıkıştırma
    });

    // Dosya adı ve headers
    const fileName = `URTM_DizinTarama_CSharp_Client_v${version}.zip`;
    res.attachment(fileName);
    res.setHeader('Content-Type', 'application/zip');

    // Archive'ı response'a pipe et
    archive.pipe(res);

    // C# Client dosyalarını arşive ekle
    const filesToInclude = [
      // Project files
      'URTM.DizinTarama.Client.csproj',
      'Program.cs',
      'appsettings.json',

      // Models
      'Models/PartData.cs',
      'Models/Settings.cs',

      // Services
      'Services/IDatabaseService.cs',
      'Services/DatabaseService.cs',
      'Services/IFileScanService.cs',
      'Services/FileScanService.cs',
      'Services/IPartDetailService.cs',
      'Services/PartDetailService.cs',

      // UI
      'UI/MainForm.cs',
      'UI/PartDetailForm.cs',
      'UI/SettingsForm.cs',

      // Scripts and documentation
      'build.bat',
      'run.bat',
      'README.md',
      '.gitignore'
    ];

    filesToInclude.forEach(file => {
      const filePath = path.join(clientPath, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    // Arşivi sonlandır
    await archive.finalize();

    console.log(`C# Client v${version} dinamik olarak oluşturuldu ve indirildi: ${fileName}`);

  } catch (error) {
    console.error('C# Client download hatası:', error);
    res.status(500).json({
      success: false,
      message: 'C# Client indirme hatası: ' + error.message
    });
  }
});

// Eski endpoint - geriye dönük uyumluluk
router.get('/dizin-tarama-client', async (req, res) => {
  // Eski endpoint'i Python client'ine yönlendir
  console.log('Eski endpoint kullanılıyor, Python client yönlendiriliyor...');
  req.url = '/api/download/dizin-tarama-python-client';
  res.locals.router = router;
  return router(req, res);
});

// Python Kurulum rehberini indir
router.get('/dizin-tarama-python-rehber', (req, res) => {
  try {
    const rehberPath = path.join(__dirname, '../../../DizinTarama_Client/DZNTRM_python/KURULUM_REHBERI.md');

    if (!fs.existsSync(rehberPath)) {
      return res.status(404).json({
        success: false,
        message: 'Python Kurulum rehberi bulunamadı'
      });
    }

    res.download(rehberPath, 'URTM_DizinTarama_Python_Kurulum_Rehberi.md', (err) => {
      if (err) {
        console.error('Python Rehber download hatası:', err);
        res.status(500).json({
          success: false,
          message: 'Dosya indirme hatası'
        });
      } else {
        console.log('Python Kurulum rehberi indirildi');
      }
    });

  } catch (error) {
    console.error('Python Rehber download hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya indirme hatası: ' + error.message
    });
  }
});

// C# Kurulum rehberini indir
router.get('/dizin-tarama-csharp-rehber', (req, res) => {
  try {
    const rehberPath = path.join(__dirname, '../../../DizinTarama_Client/DZNTRM_cs/README.md');

    if (!fs.existsSync(rehberPath)) {
      return res.status(404).json({
        success: false,
        message: 'C# Kurulum rehberi bulunamadı'
      });
    }

    res.download(rehberPath, 'URTM_DizinTarama_CSharp_Kurulum_Rehberi.md', (err) => {
      if (err) {
        console.error('C# Rehber download hatası:', err);
        res.status(500).json({
          success: false,
          message: 'Dosya indirme hatası'
        });
      } else {
        console.log('C# Kurulum rehberi indirildi');
      }
    });

  } catch (error) {
    console.error('C# Rehber download hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya indirme hatası: ' + error.message
    });
  }
});

// Eski rehber endpoint'i - geriye dönük uyumluluk
router.get('/dizin-tarama-rehber', (req, res) => {
  // Eski endpoint'i Python rehberine yönlendir
  console.log('Eski rehber endpoint kullanılıyor, Python rehberi yönlendiriliyor...');
  req.url = '/api/download/dizin-tarama-python-rehber';
  res.locals.router = router;
  return router(req, res);
});

module.exports = router;