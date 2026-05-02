/**
 * Claude Agent SDK - Çalışan Örnek
 * 
 * SDK async iterator olarak sonuç döndürüyor.
 * Her chunk işlenmeli.
 * 
 * Kullanım:
 *   ./run-with-claude-key.sh claude-sdk-working.js
 */

const sdk = require('@anthropic-ai/claude-agent-sdk');
const fs = require('fs');

console.log('═══════════════════════════════════════════');
console.log('   Claude Agent SDK - Çalışıyor!');
console.log('═══════════════════════════════════════════\n');

// API Key'i settings.json'dan al
function getClaudeApiKey() {
  try {
    const settings = fs.readFileSync('/home/irfan/.claude/settings.json', 'utf8');
    const match = settings.match(/"ANTHROPIC_AUTH_TOKEN": "([^"]+)"/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

const apiKey = getClaudeApiKey();
if (!apiKey) {
  console.error('❌ API key bulunamadı!');
  process.exit(1);
}

console.log('✅ API Key:', apiKey.substring(0, 15) + '...\n');

// SDK Query fonksiyonu - async iterator döner
async function claudeQuery(prompt, options = {}) {
  const result = sdk.query({
    prompt,
    model: options.model || 'claude-sonnet-4-20250514',
    ...options
  });

  let finalResult = '';
  let isError = false;

  for await (const chunk of result) {
    // Sadece result chunk'ını işle
    if (chunk.type === 'result') {
      if (chunk.subtype === 'success') {
        finalResult = chunk.result;
      } else if (chunk.subtype === 'error') {
        finalResult = chunk.error || 'Bilinmeyen hata';
        isError = true;
      }
    }
  }

  return { result: finalResult, isError };
}

// Test fonksiyonları
async function runTests() {
  
  // Test 1: Basit selamlama
  console.log('Test 1: Basit Selamlama');
  console.log('───────────────────');
  const r1 = await claudeQuery('Merhaba! Kısaca Türkçe selamla (1 cümle)');
  console.log('Sonuç:', r1.result.trim());
  console.log('Hata:', r1.isError ? 'Evet ❌' : 'Hayır ✅');
  console.log('');

  // Test 2: Basit hesaplama
  console.log('Test 2: Hesaplama');
  console.log('────────────────');
  const r2 = await claudeQuery('Python\'da 2+2 hesaplayan bir fonksiyon yaz. Sadece kodu ver.');
  console.log('Sonuç:', r2.result.trim().substring(0, 150) + '...');
  console.log('');

  // Test 3: Proje analizi
  console.log('Test 3: Proje Analizi');
  console.log('──────────────────');
  const r3 = await claudeQuery(
    'Bu proje hangi teknolojileri kullanıyor? Türkçe kısaca açıkla (2-3 cümle).\n\n' +
    'Proje: URTMtakip5 - Üretim Takip Sistemi\n' +
    'Backend: Node.js, Express, Sequelize, SQLite\n' +
    'Frontend: React, Material-UI, Redux'
  );
  console.log('Sonuç:', r3.result.trim());
  console.log('');

  console.log('═══════════════════════════════════════════');
  console.log('   Tüm Testler Tamamlandı! 🎉');
  console.log('═══════════════════════════════════════════');
}

runTests().catch(err => {
  console.error('Test hatası:', err.message);
  process.exit(1);
});
