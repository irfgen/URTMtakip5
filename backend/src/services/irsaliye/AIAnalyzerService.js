/**
 * AIAnalyzerService - LLM-powered invoice analysis
 * Karmaşık irsaliyeler için AI-based structured extraction
 * Destekler: Google Gemini, OpenAI GPT-4o, Anthropic Claude
 */
const axios = require('axios');

class AIAnalyzerService {
  constructor() {
    // API configuration from environment
    // Priority: Gemini > OpenAI > Anthropic
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    // Auto-detect provider based on API key
    if (process.env.GEMINI_API_KEY) {
      this.apiProvider = 'gemini';
    } else if (process.env.OPENAI_API_KEY) {
      this.apiProvider = 'openai';
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.apiProvider = 'anthropic';
    } else {
      this.apiProvider = 'gemini'; // Default to Gemini
    }

    // Override with explicit provider if set
    if (process.env.AI_PROVIDER) {
      this.apiProvider = process.env.AI_PROVIDER.toLowerCase();
    }

    // Model selection based on provider
    this.model = process.env.AI_MODEL || this.getDefaultModel();
    this.apiTimeout = parseInt(process.env.AI_API_TIMEOUT) || 60000;
    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES) || 3;

    // API endpoints
    this.endpoints = {
      gemini_base: 'https://generativelanguage.googleapis.com/v1beta/models',
      gemini_pro: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages'
    };
  }

  /**
   * Get default model for provider
   */
  getDefaultModel() {
    switch (this.apiProvider) {
      case 'gemini': return 'gemini-2.0-flash';
      case 'openai': return 'gpt-4o';
      case 'anthropic': return 'claude-3-5-sonnet-20241022';
      default: return 'gemini-2.0-flash';
    }
  }

  /**
   * Main analysis method - extracts structured data using LLM
   * @param {Buffer} imageBuffer - Document image buffer
   * @param {Object} context - Additional context (stok kartlari, tedarikciler, etc.)
   * @returns {Promise<Object>} Analyzed irsaliye data
   */
  async analyzeDocument(imageBuffer, context = {}) {
    try {
      // DEBUG: Log image info at entry
      const crypto = require('crypto');
      const imageHash = crypto.createHash('md5').update(imageBuffer).digest('hex');
      const mimeType = this.getImageMimeType(imageBuffer);
      console.log('[DEBUG AIAnalyzer] analyzeDocument called:', {
        imageSize: imageBuffer.length,
        imageHash: imageHash.substring(0, 16),
        mimeType: mimeType,
        provider: this.apiProvider,
        model: this.model
      });

      // Convert image to base64
      const base64Image = this.imageToBase64(imageBuffer);
      console.log('[DEBUG AIAnalyzer] Base64 size:', base64Image.length);

      // Build prompt with context
      const prompt = this.buildAnalysisPrompt(context);

      // Call LLM API
      const response = await this.callLLMAPI(base64Image, prompt);

      // Parse and validate response
      const analyzedData = this.parseAIResponse(response);

      console.log('[DEBUG AIAnalyzer] Parsed result:', {
        irsaliyeNo: analyzedData.irsaliyeNo,
        kalemCount: analyzedData.kalemler?.length,
        kalemler: analyzedData.kalemler?.map(k => ({
          name: k.malHizmetAdi,
          qty: k.miktar
        }))
      });

      // Add metadata
      analyzedData.metadata = {
        parseMethod: 'ai_analyzer',
        model: this.model,
        provider: this.apiProvider,
        timestamp: new Date().toISOString()
      };

      return analyzedData;
    } catch (error) {
      throw new Error(`AI analiz hatası: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt with context
   */
  buildAnalysisPrompt(context) {
    const { stokKartlari = [], tedarikciler = [], ornekIrsaliye = null } = context;

    let prompt = `Sen Türkçe irsaliye ve fatura belgelerini analiz eden uzman bir asistansın.

Görevin: Gönderilen belgeden şu bilgileri structured JSON formatında çıkarmak:

1. irsaliyeNo: İrsaliye numarası
2. tedarikci: Tedarikçi/firma adı
3. tarih: Belge tarihi (YYYY-MM-DD formatında)
4. kalemler: Ürün/malzeme listesi (TÜM KALEMLERİ ÇIKARMA ZORUNLU)
   - stokKodu: Stok kodu (varsa)
   - malHizmetAdi: Mal/hizmet adı
   - miktar: Miktar (sayı)
   - birim: Birim (adet, kg, lt, m, vb.)
5. toplamTutar: Toplam tutar (varsa)

KRİTİK KURALLAR:
- TABLODAKİ HER SATIRI tek tek oku - HİÇBİR SATIRI ATLAMA
- Bulanık veya küçük metin olsa bile tahmin et, NULL kullanma
- En az 3 karakter okuyabiliyorsan o kalemi mutlaka ekle
- Emin olmadığında düşük confidence (0.3-0.5) ekle ama kalemi atla
- Tablo sonunu (toplam, genel toplam satırları) KALEM olarak ekleme
- Miktar sütununu dikkatli oku - sayıları doğru çıkar

TABLO YAPISI:
Türkçe irsaliyelerde genellikle şu sütunlar vardır:
- Stok Kodu / Malzeme Kodu / Referans
- Malzeme / Ürün / Açıklama
- Miktar / Adet / Miktâr
- Birim (Adet, KG, LT, M, vb.)

`;

    // Add stock cards context if available
    if (stokKartlari.length > 0) {
      prompt += `MEVCUT STOK KARTLARI (eşleştirme için referans):\n`;
      stokKartlari.slice(0, 50).forEach(sk => {
        prompt += `- ${sk.stok_kodu || sk.kod}: ${sk.stok_adi || sk.adi}\n`;
      });
      prompt += `\n`;
    }

    // Add suppliers context if available
    if (tedarikciler.length > 0) {
      prompt += `BİLİNEN TEDARİKÇİLER:\n`;
      tedarikciler.slice(0, 20).forEach(t => {
        prompt += `- ${t.firma_adi || t.adi}\n`;
      });
      prompt += `\n`;
    }

    prompt += `EK KURALLAR:
- Çıkarılan mal/hizmet adlarını mevcut stok kartlarıyla eşleştirmeye çalış
- Türkçe karakterleri doğru kullan (Ç, Ğ, I, İ, Ö, Ş, Ü)
- JSON formatında yanıt ver, açıklama yapma
- Kalemleri eksiksiz çık, az çıkardığında hata olur

Örnek JSON formatı:
{
  "irsaliyeNo": "ABC123",
  "tedarikci": "Firma A.Ş.",
  "tarih": "2024-01-15",
  "kalemler": [
    {
      "stokKodu": "ABC001",
      "malHizmetAdi": "Plaka 5mm",
      "miktar": 10,
      "birim": "adet",
      "eslenenStokKartiId": 123
    }
  ],
  "toplamTutar": 1500.50
}`;

    return prompt;
  }

  /**
   * Convert image buffer to base64
   */
  imageToBase64(buffer) {
    return buffer.toString('base64');
  }

  /**
   * Get MIME type from buffer
   */
  getImageMimeType(buffer) {
    const header = buffer.slice(0, 4).toString('hex');
    if (header === '89504e47') return 'image/png';
    if (header === 'ffd8ff' || header === 'ffd8ffe0' || header === 'ffd8ffe1') return 'image/jpeg';
    if (header === '47494638') return 'image/gif';
    if (header === '52494646') return 'image/webp';
    return 'image/jpeg'; // Default
  }

  /**
   * Call LLM API with retry logic
   */
  async callLLMAPI(base64Image, prompt) {
    let lastError;
    const mimeType = this.getImageMimeType(Buffer.from(base64Image, 'base64'));

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (this.apiProvider === 'gemini') {
          return await this.callGemini(base64Image, prompt, mimeType);
        } else if (this.apiProvider === 'openai') {
          return await this.callOpenAI(base64Image, prompt, mimeType);
        } else if (this.apiProvider === 'anthropic') {
          return await this.callAnthropic(base64Image, prompt, mimeType);
        } else {
          throw new Error(`Bilinmeyen API provider: ${this.apiProvider}`);
        }
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw new Error(`API yetki hatası: ${error.message}`);
        }
        if (error.status === 400) {
          throw new Error(`API istek hatası: ${error.message}`);
        }

        // Retry on rate limits or server errors
        if (attempt < this.maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(backoffDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Call Google Gemini API
   */
  async callGemini(base64Image, prompt, mimeType) {
    // DEBUG: Log what's being sent to Gemini
    const crypto = require('crypto');
    const imageHash = crypto.createHash('md5').update(Buffer.from(base64Image, 'base64')).digest('hex');

    // Build model URL dynamically
    const effectiveModelUrl = this.model === 'gemini-1.5-pro'
      ? this.endpoints.gemini_pro
      : `${this.endpoints.gemini_base}/${this.model}:generateContent`;

    console.log('[DEBUG GEMINI] Calling API:', {
      url: effectiveModelUrl,
      model: this.model,
      base64Size: base64Image.length,
      imageHash: imageHash.substring(0, 16),
      mimeType: mimeType
    });

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
        maxOutputTokens: 4000
      }
    };

    const response = await axios.post(
      effectiveModelUrl,
      requestBody,
      {
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: this.apiTimeout
      }
    );

    return {
      data: response.data,
      format: 'gemini'
    };
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(base64Image, prompt, mimeType) {
    const response = await axios.post(
      this.endpoints.openai,
      {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.apiTimeout
      }
    );

    return response.data;
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(base64Image, prompt, mimeType) {
    const response = await axios.post(
      this.endpoints.anthropic,
      {
        model: this.model,
        max_tokens: 4000,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: this.apiTimeout
      }
    );

    return response.data;
  }

  /**
   * Parse AI response and extract structured data
   */
  parseAIResponse(response) {
    try {
      let content;

      // Extract content based on provider/format
      if (response.format === 'gemini') {
        // Gemini API response format
        content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } else if (this.apiProvider === 'openai') {
        content = response.choices?.[0]?.message?.content;
      } else if (this.apiProvider === 'anthropic') {
        content = response.content?.[0]?.text;
      }

      if (!content) {
        throw new Error('API yanıtı boş');
      }

      // Parse JSON
      const parsed = JSON.parse(content);

      // Normalize and validate
      return this.normalizeAIOutput(parsed);
    } catch (error) {
      throw new Error(`AI yanıtı ayrıştırma hatası: ${error.message}`);
    }
  }

  /**
   * Helper to extract value from potentially nested object with {value, confidence} format
   */
  extractFieldValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object' && val !== null) {
      return val.value !== undefined ? val.value : val;
    }
    return val;
  }

  /**
   * Normalize AI output to standard format
   */
  normalizeAIOutput(data) {
    const normalized = {
      irsaliyeNo: this.extractFieldValue(data.irsaliyeNo || data.belgeNo),
      tedarikci: this.extractFieldValue(data.tedarikci || data.firma || data.satici),
      tarih: this.normalizeDate(this.extractFieldValue(data.tarih)),
      kalemler: [],
      toplamTutar: this.extractFieldValue(data.toplamTutar || data.genelToplam),
      confidence: 0.85
    };

    // Normalize items
    if (Array.isArray(data.kalemler)) {
      normalized.kalemler = data.kalemler
        .filter(k => k && (k.malHizmetAdi || k.stokKodu))
        .map(k => ({
          stokKodu: this.extractFieldValue(k.stokKodu),
          malHizmetAdi: this.extractFieldValue(k.malHizmetAdi || k.adi || k.malzeme),
          miktar: this.extractFieldValue(k.miktar),
          birim: this.extractFieldValue(k.birim) || 'adet',
          eslenenStokKartiId: k.eslenenStokKartiId || null,
          confidence: 0.8
        }));
    }

    return normalized;
  }

  /**
   * Parse number safely
   */
  parseNumber(value) {
    if (typeof value === 'number') return value;
    if (!value) return null;

    const parsed = parseFloat(String(value).replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Normalize date to ISO format
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    try {
      // If already ISO format
      if (dateStr.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.split('T')[0];
      }

      // Parse Turkish date format
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        let [day, month, year] = parts;
        if (year.length === 2) year = '20' + year;

        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      // Try direct parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Sleep utility for retry backoff
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if API is configured
   */
  isConfigured() {
    // Check for any available API key
    return !!(
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
    );
  }

  /**
   * Get estimated cost for this analysis
   */
  estimateCost(imageSizeKB) {
    // Rough cost estimation (per 1M tokens)
    const tokensPerKB = 1500;
    const inputTokens = imageSizeKB * tokensPerKB;
    const outputTokens = 1000;

    if (this.apiProvider === 'gemini') {
      // Gemini 2.0 Flash pricing
      const inputCost = (inputTokens / 1000000) * 0.075; // $0.075 per million
      const outputCost = (outputTokens / 1000000) * 0.1; // $0.1 per million
      return inputCost + outputCost;
    } else if (this.apiProvider === 'gemini-pro') {
      // Gemini 1.5 Pro pricing
      const inputCost = (inputTokens / 1000000) * 1.25; // $1.25 per million
      const outputCost = (outputTokens / 1000000) * 5; // $5 per million
      return inputCost + outputCost;
    } else if (this.apiProvider === 'openai') {
      // GPT-4o pricing
      const inputCost = (inputTokens / 1000000) * 2.50;
      const outputCost = (outputTokens / 1000000) * 10;
      return inputCost + outputCost;
    } else if (this.apiProvider === 'anthropic') {
      // Claude 3.5 Sonnet pricing
      const inputCost = (inputTokens / 1000000) * 3;
      const outputCost = (outputTokens / 1000000) * 15;
      return inputCost + outputCost;
    }

    return 0;
  }
}

module.exports = AIAnalyzerService;
