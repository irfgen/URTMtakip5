# Claude Agent SDK - Kullanım Kılavuzu

## Genel Bakış

`@anthropic-ai/claude-agent-sdk` URTMtakip5 projesinde Claude Code yeteneklerini programatik olarak kullanmak için entegre edilmiştir.

## Kurulum Durumu

```bash
✅ @anthropic-ai/claude-agent-sdk@0.2.126
📍 /home/irfan/Belgeler/URTMtakip5/backend/node_modules/@anthropic-ai/claude-agent-sdk/
```

## Temel Kullanım

### 1. Basit Import
```javascript
const sdk = require('@anthropic-ai/claude-agent-sdk');

// SDK fonksiyonlarını listele
console.log(Object.keys(sdk));
```

### 2. API Key Ayarları

**Seçenek 1:** Claude Code settings dosyasındaki key'i kullan:
```bash
# Claude Code settings.json'dan API key'i al
ANTHROPIC_API_KEY=$(cat ~/.claude/settings.json | grep ANTHROPIC_AUTH_TOKEN | cut -d'"' -f4)

# Kullan
cd backend && ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" node your-script.js
```

**Seçenek 2:** Manuel .env dosyasına ekle:
```bash
# .env dosyasına ekle
ANTHROPIC_API_KEY=sk-...
```

### 3. Session Oluşturma
```javascript
const { startup, query } = require('@anthropic-ai/claude-agent-sdk');

// Basit query örneği
async function claudeQuery(prompt) {
  const result = await query({
    prompt: prompt,
    systemPrompt: 'Sen bir Node.js backend geliştiricisisin.',
  });
  return result;
}
```

## Örnek Kullanım Dosyaları

### `claude-sdk-test.js` - SDK Test
Basit SDK fonksiyon testi.

### `claude-code-agent.js` - Agent Delegation
Claude Code CLI kullanarak büyük kodlama görevlerini delege eder.

### `claude-mcp-server.js` - MCP Server
Model Context Protocol server oluşturur.

## Önemli Notlar

1. **Backend dizininde çalışın** - SDK backend'e kuruldu
2. **API Key gerekli** - `.env` dosyasında `ANTHROPIC_API_KEY` ayarlayın
3. **MCP Server** - `createSdkMcpServer` ile MCP entegrasyonu mümkün

## CLI Entegrasyonu

Claude Code CLI zaten kurulu ve kullanılabilir:

```bash
# Terminalden direkt kullanım
claude --print --permission-mode bypassPermissions "prompt"
```

## Daha Fazla Bilgi

- [Agent SDK Docs](https://code.claude.com/docs/en/agent-sdk/quickstart)
- [GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)