/**
 * URTMtakip5 Multi-Agent System - Demo
 * 
 * Sistemin nasıl çalıştığını gösterir.
 */

const { MasterAgent, MODULES } = require('./master-agent');

async function demo() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   URTMtakip5 Multi-Agent System Demo     ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const master = new MasterAgent();

  // 1. Başlat
  console.log('1️⃣ Multi-agent sistemi başlatılıyor...\n');
  await master.initialize();

  // 2. Durum raporu
  console.log('\n2️⃣ Sistem durumu:\n');
  master.report();

  // 3. Master görev
  console.log('\n3️⃣ Master ajan görevi çalıştırılıyor...\n');
  console.log('📋 Görev: "Sistemin genel yapısını ve mimariyi açıkla"\n');

  const result = await master.masterTask(
    'URTMtakip5 üretim takip sistemini genel olarak açıkla. ' +
    'Hangi teknolojiler kullanılmış, mimari yapı nasıl, ' +
    'temel modüller neler? Türkçe ve özet olarak yanıtla (5-6 cümle).'
  );

  console.log('═══════════════════════════════════════════');
  console.log('   MASTER AJAN YANITI');
  console.log('═══════════════════════════════════════════\n');
  console.log(result);
  console.log('\n═══════════════════════════════════════════\n');

  // 4. Modül listesi göster
  console.log('\n4️⃣ Kayıtlı modül ajanları:\n');
  MODULES.forEach((m, i) => {
    console.log(`  ${String(i + 1).padStart(2, '0')}. ${m.name}`);
  });

  console.log('\n\n✅ Demo tamamlandı!');
  console.log('\nSistemi kullanmak için:');
  console.log('  node cli.js --status');
  console.log('  node cli.js --master "görev"');
  console.log('  node cli.js --delegate "görev"');
  console.log('  node cli.js -x  (ininteraktif mod)\n');
}

demo().catch(err => {
  console.error('Demo hatası:', err.message);
  process.exit(1);
});