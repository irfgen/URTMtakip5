#!/usr/bin/env node
/**
 * URTMtakip5 Multi-Agent CLI - Güncellenmiş
 * 
 * Kullanım:
 *   node cli.js --status
 *   node cli.js --list
 *   node cli.js --master "görev"
 *   node cli.js --delegate "görev"
 *   node cli.js --modules is_emirleri,tezgahlar
 *   node cli.js -x
 *   node cli.js --find "arama"
 */

const { MasterAgent, MODULES } = require('./master-agent');

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(colors[color] + msg + colors.reset);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) return printHelp();

  const command = args[0];
  const master = new MasterAgent();

  switch (command) {
    case '--status':
    case '-s':
      await master.initialize();
      master.report();
      break;

    case '--list':
    case '-l':
      await master.initialize();
      log('\n📋 MODÜL LİSTESİ (40 Ajan)\n', 'cyan');
      MODULES.forEach((m, i) => {
        log(`  ${String(i + 1).padStart(2, '0')}. ${m.name} [${m.id}]`, i < 10 ? 'green' : 'dim');
      });
      log(`\nToplam: ${MODULES.length} modül ajanı\n`, 'dim');
      break;

    case '--init':
    case '-i':
      await master.initialize();
      log('\n✅ Multi-agent sistemi başlatıldı!\n', 'green');
      master.report();
      break;

    case '--master':
    case '-m': {
      await master.initialize();
      const task = args.slice(1).join(' ');
      if (!task) return log('\n❌ Görev belirtilmedi.\n', 'red');
      log('\n🔄 Master ajan çalışıyor...\n', 'yellow');
      const result = await master.masterTask(task);
      log('\n═══════════════════════════════════════════', 'cyan');
      log('   MASTER AJAN SONUÇ', 'cyan');
      log('═══════════════════════════════════════════\n', 'cyan');
      console.log(result);
      log('\n═══════════════════════════════════════════\n', 'cyan');
      break;
    }

    case '--delegate':
    case '-d': {
      await master.initialize();
      const task = args.slice(1).join(' ');
      if (!task) return log('\n❌ Görev belirtilmedi.\n', 'red');
      log('\n🔄 Görev dağıtılıyor...\n', 'yellow');
      const results = await master.delegateTask(task);
      log('\n═══════════════════════════════════════════', 'cyan');
      log(`   ${results.length} MODÜLDEN SONUÇ`, 'cyan');
      log('═══════════════════════════════════════════\n', 'cyan');
      results.forEach(r => {
        log(`\n📌 [${r.name}]`, 'yellow');
        console.log(r.result.substring(0, 300) + '...\n');
      });
      break;
    }

    case '--modules':
    case '-t': {
      await master.initialize();
      const modules = args.slice(1);
      if (!modules.length) return log('\n❌ Modül belirtilmedi.\n', 'red');
      log(`\n🎯 Hedef: ${modules.join(', ')}\n`, 'cyan');
      // TODO: Belirli modüllere görev ver
      break;
    }

    case '--find':
    case '-f': {
      await master.initialize();
      const query = args.slice(1).join(' ');
      if (!query) return log('\n❌ Arama terimi belirtilmedi.\n', 'red');
      const results = master.findModule(query);
      log(`\n🔍 "${query}" için sonuçlar:`, 'cyan');
      if (results.length === 0) {
        log('  Sonuç bulunamadı.\n', 'dim');
      } else {
        results.forEach(r => log(`  • ${r.name} [${r.id}]`, 'green'));
        log(`\n${results.length} sonuç bulundu.\n`, 'dim');
      }
      break;
    }

    case '--interactive':
    case '-x': {
      await master.initialize();
      log('\n🟢 İnteraktif mod başlatıldı.', 'green');
      log('Çıkmak için "exit" yazın.\n', 'dim');
      
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      
      const ask = () => {
        rl.question('\n👤 Master > ', async (input) => {
          if (input.toLowerCase() === 'exit') {
            log('\n👋 Çıkış...\n', 'yellow');
            rl.close();
            return;
          }
          if (input.trim()) {
            log('\n🔄 İşleniyor...\n', 'yellow');
            try {
              const result = await master.masterTask(input);
              log('\n═══════════════════════════════════════════', 'cyan');
              console.log(result);
              log('═══════════════════════════════════════════\n', 'cyan');
            } catch (e) {
              log(`\n❌ Hata: ${e.message}\n`, 'red');
            }
          }
          ask();
        });
      };
      ask();
      break;
    }

    case '--write':
    case '-w': {
      await master.initialize();
      const task = args.slice(1).join(' ');
      if (!task) return log('\n❌ Kod açıklaması belirtilmedi.\n', 'red');
      log('\n🔄 Kod üretiliyor...\n', 'yellow');
      const result = await master.writeCode(task);
      if (result.filePath) {
        log(`\n✅ Kod yazıldı: ${result.filePath}\n`, 'green');
      }
      break;
    }

    default:
      if (command.startsWith('--')) log(`\n❌ Bilinmeyen: ${command}\n`, 'red');
      printHelp();
  }
}

function printHelp() {
  log('\n╔═══════════════════════════════════════════╗', 'cyan');
  log('║   URTMtakip5 Multi-Agent CLI              ║', 'cyan');
  log('╚═══════════════════════════════════════════╝', 'cyan');
  log('\nKullanım: node cli.js <komut> [seçenekler]\n', 'dim');
  log('Komutlar:', 'yellow');
  log('  --status, -s      Durum göster', 'dim');
  log('  --list, -l        40 modülü listele', 'dim');
  log('  --init, -i        Başlat', 'dim');
  log('  --master, -m      Master ajana görev ver', 'dim');
  log('  --delegate, -d    Tüm modüllere dağıt', 'dim');
  log('  --find, -f        Modül ara', 'dim');
  log('  --write, -w       Kod üret ve yaz', 'dim');
  log('  -x                İnteraktif mod', 'dim');
  log('\nÖrnekler:', 'yellow');
  log('  node cli.js --status', 'dim');
  log('  node cli.js --list', 'dim');
  log('  node cli.js --master "sistem analizi yap"', 'dim');
  log('  node cli.js --delegate "modul analizi"', 'dim');
  log('  node cli.js --find "stok"', 'dim');
  log('  node cli.js -x\n', 'dim');
}

main().catch(err => { console.error('Hata:', err.message); process.exit(1); });