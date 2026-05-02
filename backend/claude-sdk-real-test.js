/**
 * Claude Agent SDK - Gerçek Kullanım Örneği
 * 
 * Bu script SDK'nın gerçekten çalışıp çalışmadığını test eder.
 * Claude Code settings'deki API key kullanılır.
 * 
 * Kullanım:
 *   ./run-with-claude-key.sh claude-sdk-real-test.js
 */

const sdk = require('@anthropic-ai/claude-agent-sdk');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════');
console.log('   Claude Agent SDK - Gerçek Test');
console.log('═══════════════════════════════════════════\n');

// Settings'den API key'i al
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

console.log('✅ API Key alındı:', apiKey.substring(0, 15) + '...\n');

// Test 1: Basit query
async function testBasicQuery() {
  console.log('Test 1: Basit Query');
  console.log('─────────────────');
  
  if (!sdk.query) {
    console.log('⚠️ query fonksiyonu yok\n');
    return false;
  }
  
  try {
    const result = await sdk.query({
      prompt: 'Merhaba! Kısaca kendini tanıtır mısın? (2-3 cümle)',
      apiKey: apiKey,
      model: 'claude-sonnet-4-20250514'
    });
    
    console.log('✅ Query başarılı!');
    console.log('Sonuç:', result.substring(0, 200) + '...\n');
    return true;
  } catch (error) {
    console.error('❌ Query hatası:', error.message);
    return false;
  }
}

// Test 2: Proje dosyası analizi
async function testProjectAnalysis() {
  console.log('Test 2: Proje Dosyası Analizi');
  console.log('───────────────────────────');
  
  const backendPath = '/home/irfan/Belgeler/URTMtakip5/backend';
  const testFile = path.join(backendPath, 'package.json');
  
  if (!fs.existsSync(testFile)) {
    console.log('⚠️ package.json bulunamadı');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(testFile, 'utf8'));
  
  console.log('📦 Proje:', packageJson.name);
  console.log('📌 Versiyon:', packageJson.version);
  console.log('📚 Bağımlılıklar:', Object.keys(packageJson.dependencies || {}).length);
  console.log('');
  
  try {
    const result = await sdk.query({
      prompt: `Bu package.json dosyasını analiz et ve kısaca ne işe yaradığını açıkla:

${JSON.stringify(packageJson, null, 2).substring(0, 1000)}...

Lütfen sadece Türkçe ve kısaca (3-4 cümle) açıkla.`,
      apiKey: apiKey,
      model: 'claude-sonnet-4-20250514'
    });
    
    console.log('✅ Analiz başarılı!');
    console.log('Sonuç:', result.substring(0, 300) + '...\n');
    return true;
  } catch (error) {
    console.error('❌ Analiz hatası:', error.message);
    return false;
  }
}

// Test 3: Basit kod üretimi
async function testCodeGeneration() {
  console.log('Test 3: Basit Kod Üretimi');
  console.log('────────────────────────');
  
  try {
    const result = await sdk.query({
      prompt: `Türkçe yorumlarla basit bir Node.js fonksiyonu yaz.
      
Fonksiyon adı: calculateArea
Parametreler: width (number), height (number)  
Dönüş: Alan (width * height)

Sadece fonksiyonu ve yorumları ver, başka bir şey ekleme.`,
      apiKey: apiKey,
      model: 'claude-sonnet-4-20250514'
    });
    
    console.log('✅ Kod üretimi başarılı!');
    console.log('Üretilen kod:');
    console.log('─────────────────');
    console.log(result);
    console.log('─────────────────\n');
    return true;
  } catch (error) {
    console.error('❌ Kod üretimi hatası:', error.message);
    return false;
  }
}

// Ana fonksiyon
async function runTests() {
  const results = [];
  
  results.push(await testBasicQuery());
  results.push(await testProjectAnalysis());
  results.push(await testCodeGeneration());
  
  console.log('═══════════════════════════════════════════');
  console.log('   Test Özeti');
  console.log('═══════════════════════════════════════════');
  console.log(`Başarılı: ${results.filter(r => r).length}/${results.length}`);
  console.log('═══════════════════════════════════════════\n');
  
  if (results.every(r => r)) {
    console.log('🎉 Tüm testler başarılı! SDK çalışıyor!');
  } else {
    console.log('⚠️ Bazı testler başarısız oldu.');
  }
}

runTests().catch(console.error);
