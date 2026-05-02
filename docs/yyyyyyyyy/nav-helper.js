#!/usr/bin/env node

/**
 * ÜRTM Takip Dokümantasyon Navigasyon Yardımcısı
 *
 * Kullanım:
 * node nav-helper.js [rol/tip]
 *
 * Örnekler:
 * node nav-helper.js backend-dev
 * node nav-helper.js frontend
 * node nav-helper.js operator
 * node nav-helper.js devops
 * node nav-helper.js list-all
 */

const fs = require('fs');
const path = require('path');

const navigationData = {
  // Roller ve önerilen dokümanlar
  roles: {
    'backend-dev': {
      title: 'Backend Geliştiricisi',
      description: 'API, veritabanı ve sunucu tarafı geliştirme',
      priorityDocs: [
        { file: 'api-documentation.md', desc: 'API endpoint\'leri ve örnekleri' },
        { file: 'database-schema.md', desc: 'Veritabanı yapısı ve ilişkiler' },
        { file: 'backend-architecture.md', desc: 'Backend sistem mimarisi' },
        { file: 'development-environment.md', desc: 'Geliştirme ortamı kurulumu' },
        { file: 'database-migrations.md', desc: 'Veritabanı migrasyon rehberi' },
        { file: 'authentication-system.md', desc: 'Kimlik doğrulama sistemi' },
        { file: 'file-upload-system.md', desc: 'Dosya yükleme sistemi' }
      ],
      commands: {
        start: 'npm run dev',
        test: 'cd backend && npm test',
        migrate: 'cd backend && npm run migrate',
        build: 'cd backend && npm run build'
      }
    },
    'frontend-dev': {
      title: 'Frontend Geliştiricisi',
      description: 'React komponentleri, state yönetimi ve UI',
      priorityDocs: [
        { file: 'react-components.md', desc: 'React komponent kütüphanesi' },
        { file: 'frontend-architecture.md', desc: 'Frontend sistem mimarisi' },
        { file: 'redux-toolkit-guide.md', desc: 'Redux Toolkit state yönetimi' },
        { file: 'ui-ux-guidelines.md', desc: 'UI/UX tasarım kuralları' },
        { file: 'mobile-app-usage.md', desc: 'Mobil uygulama geliştirme' },
        { file: 'component-patterns.md', desc: 'Komponent tasarım desenleri' }
      ],
      commands: {
        start: 'npm run dev',
        test: 'cd frontend && npm test',
        build: 'cd frontend && npm run build',
        preview: 'cd frontend && npm run preview'
      }
    },
    'fullstack-dev': {
      title: 'Full-Stack Geliştiricisi',
      description: 'Tüm sistem anlayışı',
      priorityDocs: [
        { file: 'system-architecture.md', desc: 'Komple sistem mimarisi' },
        { file: 'api-documentation.md', desc: 'API dokümantasyonu' },
        { file: 'react-components.md', desc: 'React komponentleri' },
        { file: 'knowledge-base-navigation.md', desc: 'Bilgi bankası ana dizin' },
        { file: 'development-environment.md', desc: 'Geliştirme ortamı kurulumu' }
      ],
      commands: {
        start: 'npm run dev',
        test: 'npm test',
        build: 'npm run build',
        'install-all': 'npm run install:all'
      }
    },
    'devops': {
      title: 'DevOps Mühendisi',
      description: 'Deployment, bakım ve monitoring',
      priorityDocs: [
        { file: 'deployment-guide.md', desc: 'Deployment rehberi' },
        { file: 'performance-optimization.md', desc: 'Performans optimizasyonu' },
        { file: 'backup-management.md', desc: 'Backup ve restore' },
        { file: 'logging-monitoring.md', desc: 'Loglama ve monitoring' },
        { file: 'security.md', desc: 'Güvenlik önlemleri' }
      ],
      commands: {
        deploy: 'npm run deploy',
        backup: 'npm run backup',
        logs: 'pm2 logs',
        status: 'pm2 status'
      }
    },
    'sysadmin': {
      title: 'Sistem Yöneticisi',
      description: 'Veritabanı yönetimi ve sistem bakımı',
      priorityDocs: [
        { file: 'database-maintenance.md', desc: 'Veritabanı bakımı' },
        { file: 'backup-management.md', desc: 'Backup yönetimi' },
        { file: 'database-migrations.md', desc: 'Migrasyon yönetimi' },
        { file: 'troubleshooting.md', desc: 'Sorun çözüm rehberi' }
      ],
      commands: {
        backup: 'npm run backup',
        'db-backup': 'npm run db:backup',
        'db-restore': 'npm run db:restore',
        'clean-logs': 'npm run clean:logs'
      }
    },
    'operator': {
      title: 'Üretim Operatörü',
      description: 'Günlük sistem kullanımı',
      priorityDocs: [
        { file: 'operator-guide.md', desc: 'Operatör kullanım rehberi' },
        { file: 'mobile-app-usage.md', desc: 'Mobil uygulama kullanımı' },
        { file: 'operator-faq.md', desc: 'Sıkça sorulan sorular' },
        { file: 'modules/work-orders.md', desc: 'İş emri kullanımı' }
      ],
      quickLinks: [
        { url: 'http://localhost:5173', desc: 'Ana uygulamaya giriş' },
        { url: 'http://localhost:5173/mobile', desc: 'Mobil arayüz' }
      ]
    },
    'manager': {
      title: 'Üretim Müdürü',
      description: 'Raporlar, planlama ve gözetim',
      priorityDocs: [
        { file: 'manager-dashboard.md', desc: 'Yönetim paneli kullanımı' },
        { file: 'reporting-system.md', desc: 'Raporlama sistemi' },
        { file: 'production-planning.md', desc: 'Üretim planlama' },
        { file: 'modules/production-planning.md', desc: 'Üretim planlama modülü' }
      ],
      quickLinks: [
        { url: 'http://localhost:5173/raporlar', desc: 'Raporlar sayfası' },
        { url: 'http://localhost:5173/uretim-plani', desc: 'Üretim planlama' }
      ]
    }
  },

  // Doküman tipleri ve açıklamaları
  docTypes: {
    'api': {
      title: 'API Dokümantasyonu',
      files: ['api-documentation.md', 'api-reference.md']
    },
    'database': {
      title: 'Veritabanı',
      files: ['database-schema.md', 'database-migrations.md', 'database-maintenance.md']
    },
    'frontend': {
      title: 'Frontend',
      files: ['react-components.md', 'frontend-architecture.md', 'redux-toolkit-guide.md']
    },
    'backend': {
      title: 'Backend',
      files: ['backend-architecture.md', 'authentication-system.md', 'file-upload-system.md']
    },
    'deployment': {
      title: 'Deployment',
      files: ['deployment-guide.md', 'performance-optimization.md', 'backup-management.md']
    },
    'modules': {
      title: 'Üretim Modülleri',
      files: [
        'modules/work-orders.md',
        'modules/workstations.md',
        'modules/parts-management.md',
        'modules/production-planning.md',
        'modules/bom-management.md'
      ]
    },
    'guides': {
      title: 'Rehberler',
      files: [
        'operator-guide.md',
        'manager-dashboard.md',
        'mobile-app-usage.md',
        'troubleshooting.md',
        'faq.md'
      ]
    }
  },

  // Hızlı komutlar
  quickCommands: {
    'start': { cmd: 'npm run dev', desc: 'Sistemi development modunda başlat' },
    'build': { cmd: 'npm run build', desc: 'Frontend build' },
    'test': { cmd: 'npm test', desc: 'Testleri çalıştır' },
    'install': { cmd: 'npm run install:all', desc: 'Tüm bağımlılıkları kur' },
    'stop': { cmd: 'npm run stop', desc: 'Tüm processleri durdur' },
    'migrate': { cmd: 'cd backend && npm run migrate', desc: 'Veritabanı migrasyonları' },
    'backup': { cmd: 'npm run backup', desc: 'Yedekleme' }
  }
};

// Renk kodları için ANSI escape sequences
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Dokümanı kontrol et
function checkDocExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

// Rol bazlı navigasyon göster
function showRoleNavigation(roleKey) {
  const role = navigationData.roles[roleKey];

  if (!role) {
    console.log(`${colors.red}Hata: Bilinmeyen rol: ${roleKey}${colors.reset}`);
    console.log(`${colors.yellow}Mevcut roller:${colors.reset}`);
    Object.keys(navigationData.roles).forEach(key => {
      console.log(`  - ${key}`);
    });
    return;
  }

  console.log(`\n${colors.cyan}${colors.bright}📋 ${role.title} Navigasyonu${colors.reset}`);
  console.log(`${colors.gray}${role.description}${colors.reset}\n`);

  // Öncelikli dokümanlar
  console.log(`${colors.yellow}${colors.bright}🎯 Öncelikli Dokümanlar:${colors.reset}`);
  role.priorityDocs.forEach((doc, index) => {
    const exists = checkDocExists(doc.file);
    const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`  ${index + 1}. ${status} ${colors.cyan}${doc.file}${colors.reset} - ${doc.desc}`);
  });

  // Hızlı komutlar
  if (role.commands) {
    console.log(`\n${colors.yellow}${colors.bright}⚡ Hızlı Komutlar:${colors.reset}`);
    Object.entries(role.commands).forEach(([key, cmd]) => {
      console.log(`  ${colors.green}$ ${cmd}${colors.reset}`);
    });
  }

  // Hızlı linkler
  if (role.quickLinks) {
    console.log(`\n${colors.yellow}${colors.bright}🔗 Hızlı Linkler:${colors.reset}`);
    role.quickLinks.forEach(link => {
      console.log(`  ${colors.blue}${link.url}${colors.reset} - ${link.desc}`);
    });
  }
}

// Tüm rolleri listele
function listAllRoles() {
  console.log(`\n${colors.cyan}${colors.bright}👥 Mevcut Roller:${colors.reset}\n`);

  Object.entries(navigationData.roles).forEach(([key, role]) => {
    console.log(`${colors.yellow}${key}${colors.reset} - ${role.title}`);
    console.log(`  ${colors.gray}${role.description}${colors.reset}\n`);
  });
}

// Doküman tipine göre navigasyon
function showDocTypeNavigation(docType) {
  const type = navigationData.docTypes[docType];

  if (!type) {
    console.log(`${colors.red}Hata: Bilinmeyen doküman tipi: ${docType}${colors.reset}`);
    console.log(`${colors.yellow}Mevcut tipler:${colors.reset}`);
    Object.keys(navigationData.docTypes).forEach(key => {
      console.log(`  - ${key}`);
    });
    return;
  }

  console.log(`\n${colors.cyan}${colors.bright}📚 ${type.title}${colors.reset}\n`);

  type.files.forEach(file => {
    const exists = checkDocExists(file);
    const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`  ${status} ${colors.cyan}${file}${colors.reset}`);
  });
}

// Hızlı komut göster
function showQuickCommand(commandName) {
  const command = navigationData.quickCommands[commandName];

  if (!command) {
    console.log(`${colors.red}Hata: Bilinmeyen komut: ${commandName}${colors.reset}`);
    console.log(`${colors.yellow}Mevcut komutlar:${colors.reset}`);
    Object.keys(navigationData.quickCommands).forEach(key => {
      console.log(`  - ${key}`);
    });
    return;
  }

  console.log(`\n${colors.yellow}${colors.bright}⚡ Hızlı Komut:${colors.reset}`);
  console.log(`${colors.green}$ ${command.cmd}${colors.reset}`);
  console.log(`${colors.gray}${command.desc}${colors.reset}\n`);
}

// Kullanım rehberi
function showUsage() {
  console.log(`\n${colors.cyan}${colors.bright}🚀 ÜRTM Takip Navigasyon Yardımcısı${colors.reset}\n`);

  console.log(`${colors.yellow}Kullanım:${colors.reset}`);
  console.log(`  node nav-helper.js [komut] [seçenek]\n`);

  console.log(`${colors.yellow}Komutlar:${colors.reset}`);
  console.log(`  ${colors.green}role [rol-adı]${colors.reset}        - Role göre doküman listesi`);
  console.log(`  ${colors.green}type [tip-adı]${colors.reset}         - Doküman tipine göre liste`);
  console.log(`  ${colors.green}cmd [komut-adı]${colors.reset}         - Hızlı komut göster`);
  console.log(`  ${colors.green}list-roles${colors.reset}             - Tüm rolleri listele`);
  console.log(`  ${colors.green}list-types${colors.reset}             - Tüm doküman tiplerini listele`);
  console.log(`  ${colors.green}help${colors.reset}                   - Bu yardım mesajı\n`);

  console.log(`${colors.yellow}Roller:${colors.reset}`);
  Object.keys(navigationData.roles).forEach(key => {
    const role = navigationData.roles[key];
    console.log(`  ${colors.cyan}${key}${colors.reset} - ${role.title}`);
  });

  console.log(`\n${colors.yellow}Doküman Tipleri:${colors.reset}`);
  Object.keys(navigationData.docTypes).forEach(key => {
    const type = navigationData.docTypes[key];
    console.log(`  ${colors.cyan}${key}${colors.reset} - ${type.title}`);
  });

  console.log(`\n${colors.yellow}Hızlı Komutlar:${colors.reset}`);
  Object.keys(navigationData.quickCommands).forEach(key => {
    console.log(`  ${colors.cyan}${key}${colors.reset}`);
  });
}

// Ana fonksiyon
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showUsage();
    return;
  }

  const command = args[0];
  const option = args[1];

  switch (command) {
    case 'role':
      if (option) {
        showRoleNavigation(option);
      } else {
        listAllRoles();
      }
      break;

    case 'type':
      if (option) {
        showDocTypeNavigation(option);
      } else {
        console.log(`${colors.yellow}Doküman tipi belirtin. Örnek: node nav-helper.js type api${colors.reset}`);
      }
      break;

    case 'cmd':
      if (option) {
        showQuickCommand(option);
      } else {
        console.log(`${colors.yellow}Komut belirtin. Örnek: node nav-helper.js cmd start${colors.reset}`);
      }
      break;

    case 'list-roles':
      listAllRoles();
      break;

    case 'list-types':
      console.log(`\n${colors.cyan}${colors.bright}📚 Doküman Tipleri:${colors.reset}\n`);
      Object.entries(navigationData.docTypes).forEach(([key, type]) => {
        console.log(`${colors.yellow}${key}${colors.reset} - ${type.title}`);
      });
      break;

    case 'help':
    case '--help':
    case '-h':
      showUsage();
      break;

    default:
      // Varsayılan olarak rol olarak kabul et
      showRoleNavigation(command);
      break;
  }
}

// Scripti çalıştır
main();