import { Request, Response } from 'express';

/**
 * Yuanly AI Translation Service
 *
 * Core principle: Every message shows BOTH the original language
 * AND an automatic translation to the user's preferred language.
 *
 * Supported languages: CN (Chinese), EN (English), TR (Turkish)
 */

export type Language = 'CN' | 'EN' | 'TR';

interface TranslationResult {
  originalText: string;
  originalLanguage: Language;
  translatedText: string;
  translatedLanguage: Language;
  isTranslated: boolean;
}

// Language detection — simple heuristic based on character ranges
export function detectLanguage(text: string): Language {
  // Chinese characters (CJK Unified Ideographs)
  if (/[一-鿿㐀-䶿]/.test(text)) return 'CN';
  // Turkish-specific characters
  if (/[çğıİşöüÇĞŞÖÜ]/.test(text)) return 'TR';
  // Default to English for Latin script
  if (/[a-zA-Z]/.test(text)) return 'EN';
  return 'CN'; // Fallback
}

// Translation dictionary — common phrases for the travel domain
// In production, this would call Google Translate API, DeepL, or OpenAI
const translationMap: Record<string, Record<Language, string>> = {
  // Greetings
  'welcome_to_turkey': {
    CN: '欢迎来到土耳其的奇妙世界。我是Yuanly，您的私人导游。您想探索什么？',
    EN: 'Welcome to the magic of Turkey. I am Yuanly, your personal guide. What would you like to explore today?',
    TR: 'Türkiye\'nin büyüsüne hoş geldiniz. Ben Yuanly, kişisel rehberiniz. Ne keşfetmek istersiniz?',
  },
  'found_experiences': {
    CN: '为您找到了以下精彩体验',
    EN: 'Here are some wonderful experiences I found for you',
    TR: 'Sizin için bulduğum harika deneyimler',
  },
  'no_results': {
    CN: '暂时没有找到相关体验。让我为您推荐最受欢迎的活动吧。',
    EN: 'No experiences found right now. Let me show you our most popular activities.',
    TR: 'Şu anda deneyim bulunamadı. En popüler etkinlikleri göstereyim.',
  },
  'booking_found': {
    CN: '好的！体验已找到。让我看看可用时间。',
    EN: 'Great! I found the experience. Let me check available slots.',
    TR: 'Harika! Deneyimi buldum. Müsait saatlere bakayım.',
  },
  'booking_confirmed': {
    CN: '预订已确认！您的二维码门票已准备就绪。',
    EN: 'Booking confirmed! Your QR ticket is ready.',
    TR: 'Rezervasyon onaylandı! QR biletiniz hazır.',
  },
  'payment_sent': {
    CN: '支付请求已发送到您的屏幕。',
    EN: 'Payment request has been sent to your screen.',
    TR: 'Ödeme isteği ekranınıza gönderildi.',
  },
  'how_can_help': {
    CN: '请问您需要什么帮助？',
    EN: 'How can I help you?',
    TR: 'Nasıl yardımcı olabilirim?',
  },
  'try_again': {
    CN: '抱歉，我没有完全理解。能请您再说一遍吗？',
    EN: 'I\'m sorry, I didn\'t quite catch that. Could you please repeat?',
    TR: 'Üzgünüm, tam anlayamadım. Tekrar edebilir misiniz?',
  },
};

/**
 * Translate text from one language to another
 * In production, replace with real API call (Google Translate, DeepL, or OpenAI)
 */
export async function translateText(
  text: string,
  from: Language,
  to: Language
): Promise<string> {
  if (from === to) return text;

  // Check if the text matches any known phrases
  for (const [, translations] of Object.entries(translationMap)) {
    if (translations[from] === text) {
      return translations[to];
    }
  }

  // In production, this would call an external translation API:
  //   const res = await fetch('https://translation.googleapis.com/...', ...)
  //   return res.translatedText
  //
  // Or using OpenAI:
  //   const res = await openai.chat.completions.create({
  //     messages: [{ role: 'user', content: `Translate "${text}" from ${from} to ${to}` }]
  //   })
  //   return res.choices[0].message.content

  // For now, return the original text with a note
  // This is a placeholder — real translation API integration needed
  return text;
}

/**
 * Create a dual-language message — shows BOTH original AND translated text
 * This is the core function for the "show original + translate" feature
 */
export async function createDualLanguageMessage(
  text: string,
  speakerLanguage: Language,
  userLanguage: Language
): Promise<TranslationResult> {
  const originalLanguage = speakerLanguage;
  const isTranslated = originalLanguage !== userLanguage;

  let translatedText = text;
  if (isTranslated) {
    translatedText = await translateText(text, originalLanguage, userLanguage);
  }

  return {
    originalText: text,
    originalLanguage,
    translatedText,
    translatedLanguage: userLanguage,
    isTranslated,
  };
}

/**
 * Process a voice message:
 * 1. Speech-to-text in the original spoken language
 * 2. Translate to the user's language
 * 3. Return both original transcription and translation
 *
 * In production, this would:
 * - Call Whisper API / Azure Speech / Google Speech for STT
 * - Then call translation API
 */
export async function processVoiceMessage(
  audioData: string, // base64 encoded audio
  spokenLanguage: Language,
  userLanguage: Language
): Promise<{
  originalTranscription: string;
  originalLanguage: Language;
  translatedText: string;
  translatedLanguage: Language;
  isTranslated: boolean;
}> {
  // In production:
  // 1. const transcription = await speechToText(audioData, spokenLanguage)
  // 2. const translation = await translateText(transcription, spokenLanguage, userLanguage)

  // Placeholder — real STT integration needed
  const originalTranscription = '[Voice message transcription]';

  const isTranslated = spokenLanguage !== userLanguage;
  let translatedText = originalTranscription;
  if (isTranslated) {
    translatedText = await translateText(originalTranscription, spokenLanguage, userLanguage);
  }

  return {
    originalTranscription,
    originalLanguage: spokenLanguage,
    translatedText,
    translatedLanguage: userLanguage,
    isTranslated,
  };
}

/**
 * Get localized text by key
 */
export function getLocalizedText(key: string, language: Language): string {
  return translationMap[key]?.[language] || translationMap[key]?.EN || key;
}