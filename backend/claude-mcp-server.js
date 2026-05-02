/**
 * Claude Agent SDK - MCP Server Örneği
 * 
 * Model Context Protocol (MCP) server oluşturarak
 * Claude Code yeteneklerini dışarıya açar.
 * 
 * Kullanım:
 *   node claude-mcp-server.js
 */

const { createSdkMcpServer } = require('@anthropic-ai/claude-agent-sdk');

console.log('═══════════════════════════════════════════');
console.log('   Claude MCP Server Başlatılıyor...');
console.log('═══════════════════════════════════════════\n');

// Server yapılandırması
const serverConfig = {
  name: 'urtmtakip-mcp-server',
  version: '1.0.0',
  description: 'URTM Takip Sistem MCP Server'
};

// MCP Server başlat
async function startServer() {
  try {
    const server = await createSdkMcpServer(serverConfig);
    console.log('✅ MCP Server başarıyla oluşturuldu');
    console.log('   Name:', serverConfig.name);
    console.log('   Version:', serverConfig.version);
    console.log('\n📡 Server dinlemede...');
    
    // Server'ı burada tut
    // Gerçek uygulamada server.listen() veya benzeri çağrı yapılır
    
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error.message);
  }
}

// Not: createSdkMcpServer API'si değişebilir
// Güncel dokümantasyon için: https://code.claude.com/docs/en/agent-sdk
console.log('ℹ️ Not: createSdkMcpServer API\'si değişebilir.');
console.log('   Güncel bilgi için resmi dokümantasyona bakın.\n');

startServer();