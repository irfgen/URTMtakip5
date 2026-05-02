/**
 * URTMtakip5 Multi-Agent System - Master Agent
 * 
 * Tum modül ajanlarini yöneten master agent.
 * Tüm 40 modül için ajan içerir.
 */

const sdk = require('@anthropic-ai/claude-agent-sdk');
const fs = require('fs');
const path = require('path');

// Tüm 40 modül
const MODULES = [
  { id: 'is_emirleri', name: 'Is Emirleri', path: 'docs/moduller/01_is_emirleri_modulu.md' },
  { id: 'tezgahlar', name: 'Tezgahlar', path: 'docs/moduller/02_tezgahlar_modulu.md' },
  { id: 'uretim_plani', name: 'Uretim Plani', path: 'docs/moduller/03_uretim_plani_modulu.md' },
  { id: 'bom', name: 'BOM', path: 'docs/moduller/04_bom_modulu.md' },
  { id: 'parcalar', name: 'Parcalar', path: 'docs/moduller/05_parcalar_modulu.md' },
  { id: 'stok_kartlari', name: 'Stok Kartlari', path: 'docs/moduller/06_stok_kartlari_modulu.md' },
  { id: 'sevkiyat', name: 'Sevkiyat', path: 'docs/moduller/07_sevkiyat_modulu.md' },
  { id: 'fason_isler', name: 'Fason Isler', path: 'docs/moduller/08_fason_isler_modulu.md' },
  { id: 'ariza_bakim', name: 'Ariza Bakim', path: 'docs/moduller/09_ariza_bakim_modulu.md' },
  { id: 'raporlar', name: 'Raporlar', path: 'docs/moduller/10_raporlar_modulu.md' },
  { id: 'notlar', name: 'Notlar', path: 'docs/moduller/11_notlar_modulu.md' },
  { id: 'vardiya_yonetimi', name: 'Vardiya Yonatimi', path: 'docs/moduller/12_vardiya_yonetimi_modulu.md' },
  { id: 'makineler', name: 'Makineler', path: 'docs/moduller/13_makineler_modulu.md' },
  { id: 'firma_yonetimi', name: 'Firma Yonatimi', path: 'docs/moduller/14_firma_yonetimi_modulu.md' },
  { id: 'grup_yonetimi', name: 'Grup Yonatimi', path: 'docs/moduller/15_grup_yonetimi_modulu.md' },
  { id: 'siparisler', name: 'Siparisler', path: 'docs/moduller/16_siparisler_modulu.md' },
  { id: 'faturalar', name: 'Faturalar', path: 'docs/moduller/17_faturalar_modulu.md' },
  { id: 'irsaliyeler', name: 'Irsaliyeler', path: 'docs/moduller/18_irsaliyeler_modulu.md' },
  { id: 'cnc_link', name: 'CNC Link', path: 'docs/moduller/19_cnc_link_modulu.md' },
  { id: 'teknik_cizimler', name: 'Teknik Cizimler', path: 'docs/moduller/20_teknik_cizimler_modulu.md' },
  { id: 'dizin_tarama', name: 'Dizin Tarama', path: 'docs/moduller/21_dizin_tarama_modulu.md' },
  { id: 'yedekleme', name: 'Yedekleme', path: 'docs/moduller/22_yedekleme_modulu.md' },
  { id: 'import_export', name: 'Import/Export', path: 'docs/moduller/23_import_export_modulu.md' },
  { id: 'eslestirme', name: 'Eslestirme', path: 'docs/moduller/24_eslestirme_modulu.md' },
  { id: 'takvim_zamanlama', name: 'Takvim/Zamanlama', path: 'docs/moduller/25_takvim_zamanlama_modulu.md' },
  { id: 'uygunsuzluklar', name: 'Uygunsuzluklar', path: 'docs/moduller/26_uygunsuzluklar_modulu.md' },
  { id: 'dosya_yukleme', name: 'Dosya Yukleme', path: 'docs/moduller/27_dosya_yukleme_modulu.md' },
  { id: 'tedarik_talepleri', name: 'Tedarik Talepleri', path: 'docs/moduller/28_tedarik_talepleri_modulu.md' },
  { id: 'satislar', name: 'Satislar', path: 'docs/moduller/29_satislar_modulu.md' },
  { id: 'tamamlanan_isler', name: 'Tamamlanan Isler', path: 'docs/moduller/30_tamamlanan_isler_modulu.md' },
  { id: 'islem_kayitlari', name: 'Islem Kayitlari', path: 'docs/moduller/31_islem_kayitlari_modulu.md' },
  { id: 'makina_indeks', name: 'Makina Indeks', path: 'docs/moduller/32_makina_indeks_modulu.md' },
  { id: 'ic_sevkiyatlar', name: 'Ic Sevkiyatlar', path: 'docs/moduller/33_ic_sevkiyatlar_modulu.md' },
  { id: 'dashboard', name: 'Dashboard', path: 'docs/moduller/34_dashboard_modulu.md' },
  { id: 'cad_import_client', name: 'CAD Import Client', path: 'docs/moduller/35_cad_import_client_modulu.md' },
  { id: 'step_bom_analyzer', name: 'STEP BOM Analyzer', path: 'docs/moduller/36_step_bom_analyzer_modulu.md' },
  { id: 'context', name: 'Context', path: 'docs/moduller/37_context_modulu.md' },
  { id: 'pdca', name: 'PDCA', path: 'docs/moduller/38_pdca_modulu.md' },
  { id: 'n8n_workflows', name: 'n8n Workflows', path: 'docs/moduller/39_n8n_workflows_modulu.md' },
  { id: 'conteng', name: 'ContEng', path: 'docs/moduller/40_conteng_modulu.md' },
];

// API Key alma
function getClaudeApiKey() {
  try {
    const settings = fs.readFileSync('/home/irfan/.claude/settings.json', 'utf8');
    const match = settings.match(/"ANTHROPIC_AUTH_TOKEN": "([^"]+)"/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

// Modul dokumanini oku
function loadModuleDoc(modulePath) {
  try {
    const fullPath = path.join('/home/irfan/Belgeler/URTMtakip5', modulePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  } catch (e) {
    return null;
  }
}

// SDK Query
async function query(prompt, systemPrompt, options) {
  options = options || {};
  const result = sdk.query({
    prompt: systemPrompt + '\n\n' + prompt,
    model: options.model || 'claude-sonnet-4-20250514'
  });

  let finalResult = '';
  for await (const chunk of result) {
    if (chunk.type === 'result' && chunk.subtype === 'success') {
      finalResult = chunk.result;
    }
  }
  return finalResult;
}

// Master Agent
class MasterAgent {
  constructor() {
    this.apiKey = getClaudeApiKey();
    this.agents = new Map();
    this.tasks = [];
    this.status = 'idle';
    this.projectRoot = '/home/irfan/Belgeler/URTMtakip5';
  }

  // Tum ajanlari baslat
  async initialize() {
    console.log('========================================');
    console.log('   URTMtakip5 Multi-Agent System');
    console.log('========================================');
    console.log('   Master Agent + 40 Module Agents\n');

    console.log('Modul ajanlari yukleniyor...');

    for (const module of MODULES) {
      const doc = loadModuleDoc(module.path);
      this.agents.set(module.id, {
        ...module,
        doc: doc,
        status: 'ready'
      });
    }

    console.log('  ' + this.agents.size + ' modul ajani hazir\n');
    this.status = 'ready';
  }

  // Görev dagit (paralel)
  async delegateTask(taskDescription, targetModules) {
    console.log('\n========================================');
    console.log('   GOREV DAGITIMI');
    console.log('========================================');
    console.log('Gorev: ' + taskDescription.substring(0, 100) + '...\n');

    const targets = targetModules || [...this.agents.keys()];
    console.log('Hedef: ' + (targetModules ? targetModules.join(', ') : 'Tum moduller') + ' (' + targets.length + ' ajan)\n');

    const promises = [];
    for (const id of targets) {
      const agent = this.agents.get(id);
      if (agent) {
        promises.push(this.queryModuleAgent(agent, taskDescription));
      }
    }

    const results = await Promise.all(promises);

    return results.map(function(result, i) {
      return {
        agent: targets[i],
        name: this.agents.get(targets[i]).name,
        result: result
      };
    }.bind(this));
  }

  // Belirli bir modul ajanine sorgu
  async queryModuleAgent(agent, task) {
    var systemPrompt = 'Sen URTMtakip5 uretim takip sisteminde ' + agent.name + ' modulunden sorumlu uzman ajansin.\n\n';
    systemPrompt += 'Modul Dokumantasyonu:\n' + (agent.doc ? agent.doc.substring(0, 3000) : 'Modul dokumantasyonu bulunamadi.') + '\n\n';
    systemPrompt += 'Gorev Kurallari:\n';
    systemPrompt += '- Turkce yanit ver\n';
    systemPrompt += '- Teknik detaylari dogru kullan\n';
    systemPrompt += '- Varsa kod ornekleri ver\n';
    systemPrompt += '- Kisa ve öz ol\n';

    return await query(task, systemPrompt);
  }

  // Master ajana özel görev
  async masterTask(task, options) {
    options = options || {};
    console.log('\n========================================');
    console.log('   MASTER AJAN GOREVI');
    console.log('========================================');
    console.log('Gorev: ' + task.substring(0, 100) + '...\n');

    var systemPrompt = 'Sen URTMtakip5 uretim takip sisteminin Master Agent\'isin.\n\n';
    systemPrompt += '## Sistem Mimariasi:\n';
    systemPrompt += '- Backend: Node.js, Express, Sequelize, SQLite\n';
    systemPrompt += '- Frontend: React, Material-UI, Redux\n';
    systemPrompt += '- Realtime: Socket.IO\n';
    systemPrompt += '- AI: Claude Agent SDK\n';
    systemPrompt += '- Toplam: 40 modul\n\n';
    systemPrompt += '## Yeteneklerin:\n';
    systemPrompt += '1. Tum modulleri analiz edebilir ve koordine edebilir\n';
    systemPrompt += '2. Kod yazabilir veya yazdirabilirsin\n';
    systemPrompt += '3. Yeni ozellikler olusturabilirsin\n';
    systemPrompt += '4. Hatalari bulabilir ve duzeltebilirsin\n';
    systemPrompt += '5. Moduller arasi koordinasyon saglarsin\n\n';
    systemPrompt += '## Proje Yolu: ' + this.projectRoot + '\n\n';
    systemPrompt += '## Calisma Kurallari:\n';
    systemPrompt += '- Turkce yanit ver (yorum ve aciklamalar Turkce)\n';
    systemPrompt += '- Kod yazarken proje standartlarina uy\n';
    systemPrompt += '- Backend: CommonJS require(), frontend: ES6 import\n';
    systemPrompt += '- Gerektiginde gercek dosya oku ve analiz et\n\n';
    systemPrompt += '## Kod Uretimi Istediginde:\n';
    systemPrompt += '- Tam, calisir kod ver\n';
    systemPrompt += '- Dosya yolu belirt\n';
    systemPrompt += '- Acikama ekle\n';

    return await query(task, systemPrompt, options);
  }

  // Kod yazma gorevi - Master ajan gercek dosya olusturur
  async writeCode(task) {
    console.log('\n========================================');
    console.log('   KOD URETIMI');
    console.log('========================================\n');

    var codeTask = task + '\n\n';
    codeTask += 'ONEMLI: Kod üret!\n';
    codeTask += 'Yanitinda MUTLAKA sunu kullan:\n\n';
    codeTask += '```file\n[dosya_yolu]\n```\n';
    codeTask += '```javascript\n[kod]\n```\n';

    var result = await this.masterTask(codeTask);

    // Dosya yazma isaretlerini ara
    var fileMatch = result.match(/```file\n([\s\S]*?)\n```/);
    var codeMatch = result.match(/```javascript\n([\s\S]*?)\n```/);

    if (fileMatch && codeMatch) {
      var filePath = fileMatch[1].trim();
      var code = codeMatch[1];

      var fullPath = path.join(this.projectRoot, filePath);
      var dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, code);
      console.log('Dosya olusturuldu: ' + filePath);
      return { filePath: filePath, code: code, fullPath: fullPath };
    }

    return { result: result };
  }

  // Durum raporu
  report() {
    console.log('\n========================================');
    console.log('   SISTEM DURUMU');
    console.log('========================================');
    console.log('Master Agent: ' + this.status);
    console.log('Modul Ajanlari: ' + this.agents.size);
    console.log('Bekleyen Gorevler: ' + this.tasks.length + '\n');

    console.log('Modul Ajanlari:');
    var i = 1;
    for (var id in this.agents) {
      var agent = this.agents[id];
      console.log('  ' + String(i++).padStart(2, '0') + '. ' + agent.name + ' [' + id + ']');
    }
    console.log('');
  }

  // Modul ara
  findModule(query) {
    var results = [];
    for (var id in this.agents) {
      var agent = this.agents[id];
      if (agent.name.toLowerCase().includes(query.toLowerCase()) ||
          id.toLowerCase().includes(query.toLowerCase())) {
        results.push(agent);
      }
    }
    return results;
  }
}

module.exports = { MasterAgent: MasterAgent, MODULES: MODULES };