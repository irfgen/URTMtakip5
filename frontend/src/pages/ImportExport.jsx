import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  GetApp as DownloadIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayIcon,
  Computer as ComputerIcon,
  Engineering as EngineeringIcon,
  Description as DocumentIcon,
  CloudSync as SyncIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
  PhonelinkSetup as SetupIcon,
  Psychology as AnalysisIcon
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function ImportExport() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [screenshotDialog, setScreenshotDialog] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const openScreenshot = (screenshot) => {
    setCurrentScreenshot(screenshot);
    setScreenshotDialog(true);
  };

  // v3.0 Zero-Configuration Kurulum adımları
  const installationSteps = [
    {
      label: 'Ön Koşullar',
      description: 'Sadece FreeCAD kurulumu gerekli',
      icon: <ComputerIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>🎆 v3.0 Minimal Gereksinimler</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Zero Configuration:</strong> Sadece FreeCAD kurulumu yeterli! Geri kalan herşey otomatik.
            </Typography>
          </Alert>
          
          <List>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText 
                primary="FreeCAD 0.20+ (herhangi bir versiyon)" 
                secondary="📍 Windows Store, resmi site, Chocolatey - hepsi çalışır" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText 
                primary="Windows 10/11 (64-bit)" 
                secondary="KURULUM.bat otomatik sistem algılaması" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
              <ListItemText 
                primary="4GB+ RAM (önerili 8GB+)" 
                secondary="Büyük STEP dosyaları için performans optimizasyonu" 
              />
            </ListItem>
          </List>
          
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
            ℹ️ Python, bağımlılıklar, konfigürasyon - hepsi KURULUM.bat tarafından otomatik halledilir.
          </Typography>
        </Box>
      )
    },
    {
      label: 'FreeCAD Kurulumu',
      description: 'Tek manual adım - FreeCAD indirin',
      icon: <EngineeringIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>FreeCAD Kurulumu</Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ Tek Manual Adım:</strong> FreeCAD kurulumu dışında herşey otomatik!
            </Typography>
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>📍 FreeCAD İndirme Seçenekleri:</Typography>
          <List>
            <ListItem>
              <ListItemIcon><Typography>1.</Typography></ListItemIcon>
              <ListItemText 
                primary="Resmi Site (Önerilen)" 
                secondary="https://www.freecadweb.org → Download → Windows 64-bit" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography>2.</Typography></ListItemIcon>
              <ListItemText 
                primary="Windows Store" 
                secondary="Microsoft Store'dan 'FreeCAD' araması" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography>3.</Typography></ListItemIcon>
              <ListItemText 
                primary="Package Manager (İleri seviye)" 
                secondary="winget install FreeCAD.FreeCAD veya choco install freecad" 
              />
            </ListItem>
          </List>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.light' }}>
            <Typography variant="body2">
              <strong>🎆 v3.0 Smart Detection:</strong> KURULUM.bat tüm FreeCAD kurulumlarını otomatik bulur:<br/>
              • Registry tarama<br/>
              • PATH çevresel değişkeni<br/>
              • Standart kurulum dizinleri<br/>
              • Python API testi
            </Typography>
          </Paper>
        </Box>
      )
    },
    {
      label: 'ZIP Dosyası İndirme',
      description: 'STEP BOM Analyzer v3.0 paketi',
      icon: <DownloadIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>v3.0 Production Package İndirme</Typography>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>🎆 Hazır Paket:</strong> Tüm core modüller, GUI, Windows scriptleri dahil!
            </Typography>
          </Alert>
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<DownloadIcon />}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main', 
                '&:hover': { bgcolor: 'grey.100' },
                mb: 1,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
              onClick={() => window.open('/api/download/step-bom-analyzer-v3-windows', '_blank')}
            >
              STEP BOM Analyzer v3.0 İndir
            </Button>
            <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
              🎆 Enterprise Ready | 🔧 KURULUM.bat + ÇALIŞTIR.bat + TEST.bat
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>📦 Paket İçeriği:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="7 Core Module" secondary="workflow_orchestrator, error_handler, batch_processor, vb." />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Advanced GUI" secondary="Professional tkinter interface" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Windows Scripts" secondary="KURULUM.bat, ÇALIŞTIR.bat, TEST.bat" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Template System" secondary="Custom BOM templates ve parts library" />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      label: 'Otomatik Kurulum',
      description: 'KURULUM.bat ile zero-configuration setup',
      icon: <SetupIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>🔧 KURULUM.bat - Zero Configuration Setup</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Magic Script:</strong> KURULUM.bat herşeyi otomatik halleder - sadece çift tıklama!
            </Typography>
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>🎆 KURULUM.bat Otomatik Adımları:</Typography>
          
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50', border: '1px dashed grey' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
              Çift tıklama: KURULUM.bat
            </Typography>
          </Paper>
          
          <List dense>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>1️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="FreeCAD Detection" 
                secondary="Registry + PATH + manual scan ile FreeCAD bulur" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>2️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Version Validation" 
                secondary="FreeCAD 0.20+ kontrolü ve Python API testi" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>3️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Dependency Installation" 
                secondary="Python paketleri otomatik kurulum (psutil, openpyxl, jinja2, vb.)" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>4️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Macro Installation" 
                secondary="FreeCAD macro dosyalarını %APPDATA%\\FreeCAD\\Macro\\ kopyalar" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>5️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Configuration Setup" 
                secondary="config.ini dosyası oluşturur ve sistem yollarını ayarlar" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>6️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Test Workflow" 
                secondary="Core modülleri test eder ve çalışırlığını doğrular" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'primary.main', fontWeight: 'bold' }}>7️⃣</Typography></ListItemIcon>
              <ListItemText 
                primary="Desktop Shortcut" 
                secondary="(Opsiyonel) Masaüstü kısayolu oluşturur" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>✅</Typography></ListItemIcon>
              <ListItemText 
                primary="Ready to Launch!" 
                secondary="ÇALIŞTIR.bat ile GUI başlatma seçeneği" 
                sx={{ color: 'success.main' }}
              />
            </ListItem>
          </List>
          
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.light' }}>
            <Typography variant="body2">
              <strong>🎆 Kurulum Sonuçu:</strong><br/>
              • Tüm sistem testleri geçildi<br/>
              • config.ini oluşturuldu<br/>
              • FreeCAD entegrasyonu aktif<br/>
              • GUI kullanıma hazır<br/>
              • ÇALIŞTIR.bat ile başlatabilirsiniz!
            </Typography>
          </Paper>
        </Box>
      )
    },
    {
      label: 'Bağımlılık Kurulumu',
      description: 'Python paketlerini yükleyin',
      icon: <BuildIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>Python Bağımlılıkları</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🎆 <strong>v3.0 ile Otomatik:</strong> KURULUM.bat tüm bağımlılıkları otomatik kurar!
            </Typography>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Manual kurulum gerekirse (sadece debug amaçlı):
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace' }}>
            <Typography component="pre">{`# v3.0 için basitleştirilmiş test
cd STEP_BOM_Analyzer_v3.0

# Sistem testi (KURULUM.bat yerine)
TEST.bat

# Manual test (opsiyonel)
python -c "from core.workflow_orchestrator import WorkflowOrchestrator; print('✅ Sistem hazır!')"
`}</Typography>
          </Paper>
          
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              TEST.bat ile 10 farklı sistem kontrolü otomatik yapılır!
            </Typography>
          </Alert>
        </Box>
      )
    },
    {
      label: 'Başlatma',
      description: 'ÇALIŞTIR.bat ile GUI başlatın',
      icon: <PlayIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom>🚀 ÇALIŞTIR.bat - GUI Launcher</Typography>
          
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tek Tıklama:</strong> Kurulum tamamlandıktan sonra ÇALIŞTIR.bat ile GUI başlatın!
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
              🎉 Kurulum Tamamlandı!
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Artık ÇALIŞTIR.bat ile uygulamayı başlatabilirsiniz
            </Typography>
          </Paper>
          
          <Typography variant="subtitle1" gutterBottom>🖥️ Başlatma Seçenekleri:</Typography>
          <List>
            <ListItem>
              <ListItemIcon><PlayIcon color="primary" /></ListItemIcon>
              <ListItemText 
                primary="ÇALIŞTIR.bat (Önerilen)" 
                secondary="Çift tıklama → Otomatik GUI başlatma" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><SettingsIcon color="secondary" /></ListItemIcon>
              <ListItemText 
                primary="Masaüstü Kısayolu" 
                secondary="KURULUM.bat sırasında oluşturulan kısayol" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><BuildIcon color="info" /></ListItemIcon>
              <ListItemText 
                primary="Command Line (Debug)" 
                secondary="python gui/workflow_gui.py (geliştiriciler için)" 
              />
            </ListItem>
          </List>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>🎯 İlk Kullanım Önerileri:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="TEST.bat çalıştırarak sistem sağlığını kontrol edin" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="Küçük bir test STEP dosyası ile Standard workflow deneyin" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
              <ListItemText primary="config.ini dosyasını ihtiyacınıza göre düzenleyin (opsiyonel)" />
            </ListItem>
          </List>
          
          <Typography variant="body2" sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, fontStyle: 'italic' }}>
            💡 <strong>Pro İpucu:</strong> config.ini dosyası KURULUM.bat tarafından otomatik oluşturulur. 
            Manuel düzenleme sadece özel gereksinimler için gereklidir.
          </Typography>
        </Box>
      )
    }
  ];

  // Özellikler listesi
  const features = [
    {
      title: 'STEP Dosya İşleme',
      description: 'FreeCAD native engine ile gelişmiş analiz',
      icon: <EngineeringIcon />,
      details: [
        'Large file handling - 2GB+ dosya desteği',
        'Streaming ve chunked processing',
        'Memory optimization ve resource management',
        'Concurrent multi-file processing'
      ]
    },
    {
      title: 'Hiyerarşik BOM',
      description: 'Detaylı malzeme listesi oluşturma',
      icon: <DocumentIcon />,
      details: [
        'Tree structure BOM generation',
        'Otomatik part numarası atama',
        'Miktar hesaplama',
        'Multi-format export (JSON, Excel, CSV, HTML)'
      ]
    },
    {
      title: 'Template Sistemi',
      description: 'Jinja2-based custom template engine',
      icon: <ViewIcon />,
      details: [
        'Custom BOM templates (HTML, JSON, CSV, Excel)',
        'User-defined report formats',
        'Template filtreleme ve styling',
        'Multi-format export engine'
      ]
    },
    {
      title: 'Parts Library',
      description: 'SQLite-based intelligent parts matching',
      icon: <AnalysisIcon />,
      details: [
        'Standard parts database',
        'Intelligent fuzzy matching',
        'Parts search ve filtering',
        'CSV import/export capability'
      ]
    },
    {
      title: 'Performance Monitoring',
      description: 'Real-time sistem performansı takibi',
      icon: <SyncIcon />,
      details: [
        'Memory usage tracking',
        'Resource cleanup automation',
        'Performance optimization',
        'Error recovery systems'
      ]
    },
    {
      title: 'Advanced Workflow Engine',
      description: 'Predefined ve custom workflow desteği',
      icon: <PlayIcon />,
      details: [
        'Standard, Quick, Batch analysis workflows',
        'Real-time progress tracking',
        'Threading support ve callback system',
        'Workflow orchestration ve step coordination'
      ]
    }
  ];

  // Kullanım senaryoları
  const useCases = [
    {
      title: 'Standard Workflow',
      time: '3-5 dakika',
      steps: [
        'STEP dosyası seç',
        'Standard workflow ön tanımlı',
        'Start Workflow',
        'HTML + JSON + CSV raporlar hazır'
      ]
    },
    {
      title: 'Batch Processing',
      time: '10-30 dakika',
      steps: [
        'Klasör seç (multiple STEP files)',
        'Batch workflow ayarla',
        'Concurrent processing başlat',
        'Tüm dosyalar için raporlar oluşur'
      ]
    },
    {
      title: 'Custom Templates',
      time: '5-15 dakika',
      steps: [
        'Custom template seç/oluştur',
        'Template parameters ayarla',
        'Advanced workflow çalıştır',
        'Custom format raporlar hazır'
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          🔩 STEP BOM Analyzer v3.0
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          FreeCAD Native Edition - Profesyonel Windows Uygulaması
        </Typography>
        <Chip label="100% FreeCAD Native" color="primary" size="large" sx={{ mr: 1 }} />
        <Chip label="Zero Configuration" color="success" size="large" sx={{ mr: 1 }} />
        <Chip label="Enterprise Ready" color="warning" size="large" sx={{ mr: 1 }} />
        <Chip label="Windows Optimized" color="info" size="large" />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="📋 Genel Bakış" />
          <Tab label="🛠️ Kurulum Kılavuzu" />
          <Tab label="🚀 Kullanım Rehberi" />
          <Tab label="🐛 Sorun Giderme" />
        </Tabs>
      </Box>

      {/* Genel Bakış Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={4}>
          {/* Sistem Tanıtımı */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                🎯 STEP BOM Analyzer Nedir?
              </Typography>
              <Typography variant="body1" paragraph>
                STEP BOM Analyzer v3.0 FreeCAD Native Edition, Windows kullanıcıları için sıfır konfigürasyon ile 
                çalışan profesyonel bir STEP dosya analiz ve BOM üretim sistemidir. İleri seviye performans optimizasyonu, 
                batch processing, custom template desteği ve kapsamlı hata yönetimi ile kurumsal kullanıma hazırdır.
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  🎆 Sıfır Konfigürasyon: FreeCAD kurulumu → ZIP indirme → KURULUM.bat → ÇALIŞTIR.bat ile tek tıklama kullanım!
                </Typography>
              </Alert>
            </Paper>
          </Grid>

          {/* Özellikler Grid */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              ⭐ Ana Özellikler
            </Typography>
            <Grid container spacing={3}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {feature.icon}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {feature.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {feature.description}
                      </Typography>
                      <List dense>
                        {feature.details.map((detail, idx) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={detail}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* 7-Fazlı İş Akışı */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                🔄 7-Fazlı İş Akışı
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Sistemin çalışma prensibi 7 aşamalı profesyonel iş akışına dayanır:
              </Typography>
              
              <Grid container spacing={2}>
                {[
                  { phase: '1️⃣ STEP Import & Analysis', desc: 'FreeCAD native STEP processing' },
                  { phase: '2️⃣ Data Extraction', desc: 'BOM structure ve metadata extraction' },
                  { phase: '3️⃣ Template Processing', desc: 'Custom template rendering' },
                  { phase: '4️⃣ Parts Matching', desc: 'Standard parts library integration' },
                  { phase: '5️⃣ Report Generation', desc: 'Multi-format report creation' },
                  { phase: '6️⃣ Performance Optimization', desc: 'Memory cleanup ve resource management' },
                  { phase: '7️⃣ Quality Assurance', desc: 'Error handling ve validation' }
                ].map((step, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ bgcolor: index % 2 === 0 ? 'primary.light' : 'secondary.light', color: 'white' }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {step.phase}
                        </Typography>
                        <Typography variant="body2">
                          {step.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Kurulum Kılavuzu Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            🛠️ Windows Kurulum Kılavuzu
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Önemli:</strong> Kurulum adımlarını sırasıyla takip edin. Özellikle FreeCAD kurulumu kritiktir.
            </Typography>
          </Alert>
        </Box>

        <Stepper orientation="vertical" activeStep={activeStep}>
          {installationSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel 
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
                icon={step.icon}
              >
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper sx={{ p: 2, ml: 2 }}>
                  {step.content}
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleStepClick(index + 1)}
                    sx={{ mr: 1 }}
                    disabled={index === installationSteps.length - 1}
                  >
                    {index === installationSteps.length - 1 ? 'Kurulum Tamamlandı' : 'Devam Et'}
                  </Button>
                  <Button
                    onClick={() => handleStepClick(index - 1)}
                    disabled={index === 0}
                  >
                    Geri
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === installationSteps.length && (
          <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
            <Typography variant="h6" gutterBottom>
              🎉 Kurulum Başarıyla Tamamlandı!
            </Typography>
            <Typography variant="body1" paragraph>
              Artık STEP BOM Analyzer'ı kullanmaya başlayabilirsiniz.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setActiveTab(2)}
              startIcon={<PlayIcon />}
            >
              Kullanım Rehberine Geç
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* Kullanım Rehberi Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={4}>
          {/* Hızlı Başlangıç */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                🚀 Hızlı Başlangıç
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                1. Uygulamayı Başlatma
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace' }}>
                <Typography>{`# Command Prompt'ta proje klasöründe
python gui/workflow_gui.py`}</Typography>
              </Paper>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                2. Temel Kullanım Adımları
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Typography>1.</Typography></ListItemIcon>
                  <ListItemText primary='"Browse" ile STEP dosyanızı seçin' />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Typography>2.</Typography></ListItemIcon>
                  <ListItemText primary='"Output Dir" klasörünü belirleyin' />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Typography>3.</Typography></ListItemIcon>
                  <ListItemText primary='İş akışı seçeneklerini ayarlayın' />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Typography>4.</Typography></ListItemIcon>
                  <ListItemText primary='"🚀 Start Workflow" butonuna tıklayın' />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Typography>5.</Typography></ListItemIcon>
                  <ListItemText primary='Progress barlarında ilerlemeyi takip edin' />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Typography>6.</Typography></ListItemIcon>
                  <ListItemText primary='Results sekmelerinde sonuçları inceleyin' />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Kullanım Senaryoları */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              📋 Kullanım Senaryoları
            </Typography>
            <Grid container spacing={3}>
              {useCases.map((scenario, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {scenario.title}
                      </Typography>
                      <Chip 
                        label={`⏱️ ${scenario.time}`} 
                        color="primary" 
                        size="small" 
                        sx={{ mb: 2 }} 
                      />
                      <List dense>
                        {scenario.steps.map((step, idx) => (
                          <ListItem key={idx} sx={{ py: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <Typography variant="body2">{idx + 1}.</Typography>
                            </ListItemIcon>
                            <ListItemText 
                              primary={step}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Çıktı Dosyaları */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                📂 Üretilen Dosyalar
              </Typography>
              <Typography variant="body1" paragraph>
                İşlem tamamlandıktan sonra çıktı klasöründe aşağıdaki dosyalar oluşur:
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <Typography component="pre">{`workflow_output/
├── bom_reports/
│   ├── Assembly_BOM.html      # Görsel BOM raporu
│   ├── Assembly_BOM.xlsx      # Excel BOM tablosu
│   └── part_gallery.html      # Part resim galerisi
├── part_renders/
│   ├── PART001_front.png      # Part resimleri
│   ├── PART001_back.png
│   ├── PART001_thumbnail.png
│   └── ...
└── bom_exports/
    ├── bom_structure.json     # JSON BOM verisi
    ├── bom_table.csv         # CSV BOM tablosu
    └── bom_statistics.xml    # İstatistik verileri`}</Typography>
              </Paper>
            </Paper>
          </Grid>

          {/* GUI Arayüzü */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                🖥️ GUI Arayüz Bölümleri
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    🔧 Input Configuration
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="STEP dosyası seçimi" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Çıktı klasörü belirleme" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="İş akışı seçenekleri" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    📊 Workflow Progress
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="7 fazlı iş akışı takibi" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Gerçek zamanlı progress barları" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Her faz için detaylı durum" />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    📋 Results Display
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <Chip label="Summary: Genel sonuçlar" variant="outlined" />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip label="BOM: Hiyerarşik BOM tablosu" variant="outlined" />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip label="Files: Üretilen dosyalar" variant="outlined" />
                    </Grid>
                    <Grid item xs={3}>
                      <Chip label="Logs: Detaylı işlem logları" variant="outlined" />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Sorun Giderme Tab */}
      <TabPanel value={activeTab} index={3}>
        <Typography variant="h5" gutterBottom>
          🐛 Sorun Giderme
        </Typography>

        <Grid container spacing={3}>
          {/* Yaygın Sorunlar */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">❌ FreeCAD Bulunamıyor Hatası</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Hata:</strong> "FreeCAD is not available. Please install FreeCAD and ensure it's in Python path."
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Kontrol Komutları:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace', mb: 2 }}>
                  <Typography component="pre">{`# FreeCAD kurulum kontrolü
dir "C:\\Program Files\\FreeCAD*"

# Python'dan FreeCAD test
python -c "import sys; print(sys.path)"
python -c "import FreeCAD; print(FreeCAD.__version__)"`}</Typography>
                </Paper>
                
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Çözüm:</strong> FreeCAD'ı yeniden kurun ve Python API seçeneğini aktifleştirin.
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">❌ Tkinter Hatası</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Hata:</strong> "No module named 'tkinter'"
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Test Komutu:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace', mb: 2 }}>
                  <Typography>{`python -c "import tkinter; print('GUI hazır')"`}</Typography>
                </Paper>
                
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Çözüm:</strong> Python kurulumunda tkinter dahil değilse, Python'ı yeniden kurun.
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">⚠️ Büyük STEP Dosyası Sorunları</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Sorun:</strong> Büyük STEP dosyalarında memory hatası veya yavaşlık
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>config.ini Ayarları:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', mb: 2 }}>
                  <Typography component="pre">{`[FREECAD_PROCESSING]
max_file_size_mb = 200
screenshot_resolution = 1280x720
memory_limit_mb = 2000
batch_size = 5`}</Typography>
                </Paper>
                
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>İpucu:</strong> Dosya boyutunu kısıtlayın ve çözünürlüğü düşürün.
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">🌐 Server Bağlantı Sorunları</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  <strong>Sorun:</strong> ÜRTM Takip server'a bağlanamıyor
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>Kontrol Listesi:</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText primary="ÜRTM Takip server'ının çalıştığından emin olun" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText primary="Network bağlantısını kontrol edin" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText primary="config.ini'deki server URL'ini doğrulayın" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckIcon /></ListItemIcon>
                    <ListItemText primary="GUI'de &quot;Test Connection&quot; butonunu kullanın" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Performans İpuçları */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🚀 Performans İpuçları
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Büyük STEP Dosyaları İçin:
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="8GB+ RAM kullanın" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="SSD disk tercih edin" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="FreeCAD GUI modunu açık tutun" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText primary="config.ini'de batch_size ayarlayın" />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Hızlı BOM Çıkarma İçin:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    <Typography component="pre">{`[BOM_GENERATION]
include_images = false      # Resimleri atla
export_formats = json,csv   # Sadece gerekli formatlar`}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Test Komutları */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ✅ Sistem Test Komutları
              </Typography>
              <Typography variant="body2" paragraph>
                Kurulumunuzun doğruluğunu test etmek için aşağıdaki komutları çalıştırın:
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'white', fontFamily: 'monospace' }}>
                <Typography component="pre">{`# Kapsamlı sistem testi
python -c "
import FreeCAD
import tkinter
from core.workflow_orchestrator import WorkflowOrchestrator
print('✅ Sistem hazır!')
"

# Test scriptleri (proje klasöründe)
python test_full_workflow.py
python test_workflow_gui.py`}</Typography>
              </Paper>
              
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Başarılı Sonuç:</strong> Bu komutlar hatasız çalışırsa sistem kullanıma hazırdır!
                </Typography>
              </Alert>
            </Paper>
          </Grid>

          {/* İletişim */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'info.light' }}>
              <Typography variant="h6" gutterBottom>
                📞 Destek ve İletişim
              </Typography>
              <Typography variant="body1">
                Sorun yaşamaya devam ediyorsanız:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><DocumentIcon /></ListItemIcon>
                  <ListItemText primary="Log dosyalarını kontrol edin: step_bom_analyzer.log" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BuildIcon /></ListItemIcon>
                  <ListItemText primary="Test fonksiyonlarını çalıştırın" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Config ayarlarınızı doğrulayın" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EngineeringIcon /></ListItemIcon>
                  <ListItemText primary="FreeCAD sürümünüzü kontrol edin (0.20+ önerili)" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Screenshot Dialog */}
      <Dialog 
        open={screenshotDialog} 
        onClose={() => setScreenshotDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Ekran Görüntüsü</DialogTitle>
        <DialogContent>
          {currentScreenshot && (
            <img 
              src={currentScreenshot} 
              alt="Screenshot" 
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScreenshotDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ImportExport;