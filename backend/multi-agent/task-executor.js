/**
 * URTMtakip5 - Task Executor
 * 
 * Master agent'a görev gönderir ve sonuçları döndürür.
 * 
 * Kullanım:
 *   const executor = require('./task-executor');
 *   executor.execute('sistem analizi yap');
 */

const { MasterAgent } = require('./master-agent');

class TaskExecutor {
  constructor() {
    this.master = null;
    this.ready = false;
  }

  async init() {
    if (!this.master) {
      this.master = new MasterAgent();
      await this.master.initialize();
      this.ready = true;
    }
  }

  // Master ajana görev ver
  async execute(task, options = {}) {
    await this.init();
    return await this.master.masterTask(task);
  }

  // Belirli modüllere görev ver
  async delegate(task, modules = null) {
    await this.init();
    return await this.master.delegateTask(task, modules);
  }

  // Sistem durumu
  async status() {
    await this.init();
    this.master.report();
  }
}

// Tek görev çalıştır
async function runTask() {
  const args = process.argv.slice(2);
  const task = args.join(' ') || 'Sistem durumunu açıklama Türkçe';
  
  const executor = new TaskExecutor();
  
  console.log('═══════════════════════════════════════════');
  console.log('   URTMtakip5 Task Executor');
  console.log('═══════════════════════════════════════════\n');
  console.log(`📝 Görev: "${task}"\n`);
  
  try {
    const result = await executor.execute(task);
    console.log('\n═══════════════════════════════════════════');
    console.log('   SONUÇ');
    console.log('═══════════════════════════════════════════\n');
    console.log(result);
    console.log('\n═══════════════════════════════════════════\n');
  } catch (e) {
    console.error('❌ Hata:', e.message);
  }
}

// Doğrudan çalıştırılırsa
if (require.main === module) {
  runTask();
}

module.exports = { TaskExecutor };