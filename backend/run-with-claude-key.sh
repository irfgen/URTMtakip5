#!/bin/bash
# Claude Agent SDK - Claude Code API Key ile Çalıştırma Scripti
#
# Kullanım:
#   ./run-with-claude-key.js <script.js> [arg1] [arg2] ...
#
# Örnek:
#   ./run-with-claude-key.js claude-sdk-test.js

SCRIPT=$1
shift

if [ -z "$SCRIPT" ]; then
    echo "❌ Kullanım: $0 <script.js> [argümanlar...]"
    echo ""
    echo "Örnek: $0 claude-sdk-test.js"
    exit 1
fi

# Claude Code settings.json'dan API key'i al
API_KEY=$(cat ~/.claude/settings.json 2>/dev/null | grep ANTHROPIC_AUTH_TOKEN | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
    echo "❌ API key bulunamadı!"
    echo "Claude Code ayarlarını kontrol edin: ~/.claude/settings.json"
    exit 1
fi

echo "✅ Claude Code API key kullanılıyor..."
echo "📜 Script: $SCRIPT"

# Script'i API key ile çalıştır
ANTHROPIC_API_KEY="$API_KEY" node "$SCRIPT" "$@"
