/**
 * Claude Agent SDK - Test Dosyası
 * 
 * Bu dosya SDK'nın doğru çalışıp çalışmadığını test etmek için kullanılır.
 * 
 * Kullanım:
 *   node claude-sdk-test.js
 */

const sdk = require('@anthropic-ai/claude-agent-sdk');

console.log('═══════════════════════════════════════════');
console.log('   Claude Agent SDK - Test Başladı');
console.log('═══════════════════════════════════════════\n');

// 1. SDK Import Test
console.log('1. SDK Import Test...');
console.log('   ✅ SDK başarıyla import edildi');
console.log('   Tür:', typeof sdk);
console.log('');

// 2. SDK Versiyon
try {
  const pkg = require('./node_modules/@anthropic-ai/claude-agent-sdk/package.json');
  console.log('2. SDK Versiyon...');
  console.log('   Versiyon:', pkg.version);
  console.log('   Açıklama:', pkg.description.substring(0, 60) + '...');
  console.log('');
} catch (e) {
  console.log('   ⚠️ Versiyon bilgisi alınamadı');
  console.log('');
}

// 3. Mevcut Fonksiyonlar
console.log('3. Mevcut SDK Fonksiyonları...');
const functions = Object.keys(sdk);
const categories = {
  'Session': functions.filter(f => f.toLowerCase().includes('session')),
  'Query': functions.filter(f => f.toLowerCase().includes('query')),
  'Transport': functions.filter(f => f.toLowerCase().includes('transport')),
  'Server': functions.filter(f => f.toLowerCase().includes('server')),
  'Other': functions.filter(f => 
    !f.toLowerCase().includes('session') && 
    !f.toLowerCase().includes('query') && 
    !f.toLowerCase().includes('transport') &&
    !f.toLowerCase().includes('server')
  )
};

Object.entries(categories).forEach(([name, funcs]) => {
  if (funcs.length > 0) {
    console.log(`\n   [${name}] (${funcs.length})`);
    funcs.slice(0, 5).forEach(f => console.log(`     - ${f}`));
    if (funcs.length > 5) console.log(`     ... ve ${funcs.length - 5} daha`);
  }
});

console.log('\n═══════════════════════════════════════════');
console.log('   Test Tamamlandı - ✅ Başarılı');
console.log('═══════════════════════════════════════════\n');

// 4. API Key Kontrolü
console.log('4. API Key Kontrolü...');
if (process.env.ANTHROPIC_API_KEY) {
  console.log('   ✅ ANTHROPIC_API_KEY ayarlanmış');
} else {
  console.log('   ⚠️ ANTHROPIC_API_KEY ayarlanmamış');
  console.log('   .env dosyasına ekleyin: ANTHROPIC_API_KEY=sk-...');
}

console.log('\n📚 Sonraki adımlar için: CLAUDE_AGENT_SDK.md dosyasına bakın');