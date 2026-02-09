#!/usr/bin/env node

/**
 * ÜRTM Takip Doküman Arama Aracı
 *
 * Kullanım:
 * node search-docs.js [aranacak_kelime]
 *
 * Örnekler:
 * node search-docs.js API
 * node search-docs.js React
 * node search-docs.js veritabanı
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const docsDir = __dirname;
const docs = [];

// Dokümanları tara
function scanDocs() {
  const files = fs.readdirSync(docsDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Başlıkları bul
      const titles = [];
      lines.forEach((line, index) => {
        if (line.startsWith('#')) {
          titles.push({
            level: line.match(/^#+/)[0].length,
            text: line.replace(/^#+\s*/, ''),
            line: index + 1
          });
        }
      });

      docs.push({
        file,
        path: filePath,
        content,
        titles,
        lines: lines.length
      });
    }
  });
}

// Dokümanlarda ara
function searchDocs(query) {
  const results = [];
  const queryLower = query.toLowerCase();

  docs.forEach(doc => {
    const lines = doc.content.split('\n');
    let matches = [];

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(queryLower)) {
        // Bağlamı al (önceki ve sonraki satırlar)
        const contextStart = Math.max(0, index - 2);
        const contextEnd = Math.min(lines.length - 1, index + 2);
        const context = lines.slice(contextStart, contextEnd + 1)
          .map((l, i) => `${contextStart + i + 1}: ${l}`)
          .join('\n');

        matches.push({
          line: index + 1,
          content: line.trim(),
          context
        });
      }
    });

    if (matches.length > 0) {
      // En uygun başlığı bul
      let bestTitle = null;
      let minDistance = Infinity;

      doc.titles.forEach(title => {
        matches.forEach(match => {
          const distance = Math.abs(match.line - title.line);
          if (distance < minDistance && title.level <= 2) {
            minDistance = distance;
            bestTitle = title.text;
          }
        });
      });

      results.push({
        file: doc.file,
        title: bestTitle || doc.titles[0]?.text || doc.file,
        matches: matches.slice(0, 5), // Max 5 sonuç
        totalMatches: matches.length
      });
    }
  });

  return results.sort((a, b) => b.totalMatches - a.totalMatches);
}

// Sonuçları göster
function displayResults(results, query) {
  console.log(`\n🔍 Arama Sonuçları: "${query}"\n`);

  if (results.length === 0) {
    console.log('❌ Sonuç bulunamadı.');
    console.log('\n💡 İpuçları:');
    console.log('- Türkçe karakterler kullanmayı deneyin');
    console.log('- Anahtar kelimelerle arayın: API, React, veritabanı');
    console.log('- İngilizce terimler: database, authentication, component');
    return;
  }

  results.forEach((result, index) => {
    console.log(`${index + 1}. 📄 ${result.file}`);
    if (result.title && result.title !== result.file) {
      console.log(`   📍 ${result.title}`);
    }
    console.log(`   🔢 ${result.totalMatches} eşleşme\n`);

    result.matches.forEach((match, i) => {
      if (i === 0) { // İlk eşleşmenin context'ini göster
        console.log(`   ${match.line}: ${match.content}`);
        console.log(`   ...\n`);
      } else {
        console.log(`   ${match.line}: ${match.content}`);
      }
    });

    console.log('   ' + '─'.repeat(50) + '\n');
  });

  console.log(`\n💾 Dosya Konumu: ${docsDir}`);
}

// İnteraktif arama
function interactiveSearch() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🔍 ÜRTM Takip Doküman Arama\n');
  console.log('Aramak istediğiniz kelimeyi yazın (çıkmak için "q" veya "exit"):');

  rl.on('line', (input) => {
    const query = input.trim();

    if (query === 'q' || query === 'exit' || query === 'quit') {
      rl.close();
      return;
    }

    if (query) {
      const results = searchDocs(query);
      displayResults(results, query);
    }

    console.log('\nYeni arama (çıkmak için "q"):');
  });
}

// Ana fonksiyon
function main() {
  scanDocs();

  const query = process.argv[2];

  if (query) {
    const results = searchDocs(query);
    displayResults(results, query);
  } else {
    interactiveSearch();
  }
}

// Yardım mesajı
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔍 ÜRTM Takip Doküman Arama Aracı

Kullanım:
  node search-docs.js [kelime]    - Belirtilen kelimeyi ara
  node search-docs.js             - İnteraktif arama modu
  node search-docs.js --help      - Yardım göster

Örnekler:
  node search-docs.js API
  node search-docs.js React
  node search-docs.js "veritabanı şeması"
`);
  process.exit(0);
}

main();