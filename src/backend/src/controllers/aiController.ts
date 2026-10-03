import { Request, Response } from 'express';
import prisma from '../config/db';
import {
  detectLanguage,
  createDualLanguageMessage,
  translateText,
  processVoiceMessage,
  getLocalizedText,
  Language
} from '../services/translationService';

// SQLite compatibility: Prisma SQLite stores string arrays and Json fields
// as plain TEXT, so they must be serialized on write and parsed on read.
function parseArrayField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

function parseMetadata(value: any): any {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

// POST /v1/ai/interact — Voice/text interaction with AI concierge
// Returns BOTH original language AND user's language translation
export const handleVoiceInteraction = async (req: Request, res: Response) => {
  try {
    const { text, language, context, voiceData } = req.body;
    const userId = (req as any).user?.id;

    // Determine user's preferred language
    let userLanguage: Language = 'CN';
    if (language && ['CN', 'EN', 'TR'].includes(language.toUpperCase())) {
      userLanguage = language.toUpperCase() as Language;
    } else if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) userLanguage = user.preferredLanguage as Language;
    }

    let inputText = text;
    let spokenLanguage: Language = userLanguage;

    // If voice data is provided, process it through speech-to-text + translation
    if (voiceData) {
      // Detect spoken language (in production, the STT API would return this)
      spokenLanguage = detectLanguage(text || '') || userLanguage;

      const voiceResult = await processVoiceMessage(voiceData, spokenLanguage, userLanguage);

      // Log the voice interaction
      if (userId) {
        await prisma.userInteraction.create({
          data: {
            userId,
            type: 'ai_voice',
            metadata: JSON.stringify({
              originalTranscription: voiceResult.originalTranscription,
              originalLanguage: voiceResult.originalLanguage,
              translatedText: voiceResult.translatedText,
              translatedLanguage: voiceResult.translatedLanguage,
              context
            })
          }
        });
      }

      inputText = voiceResult.translatedText; // Use translated text for intent recognition
    } else if (!text) {
      return res.status(400).json({ error: 'Text or voiceData is required' });
    }

    // Log text interaction
    if (userId && text) {
      await prisma.userInteraction.create({
        data: {
          userId,
          type: 'ai_query',
          metadata: JSON.stringify({ text, language: userLanguage, context })
        }
      });
    }

    // Intent recognition
    const intent = recognizeIntent(inputText);

    // Generate response in the AI's native language (Chinese for Chinese users, etc.)
    // The AI responds in the USER's language for convenience
    const aiResponseText = await generateResponse(intent, userLanguage, userId);

    // Detect what language the AI responded in
    const aiResponseLanguage = detectLanguage(aiResponseText);

    // Create dual-language message: original + translation
    const dualMessage = await createDualLanguageMessage(
      aiResponseText,
      aiResponseLanguage,
      userLanguage
    );

    res.status(200).json({
      intent: intent.type,
      userLanguage,
      message: {
        original: dualMessage.originalText,
        originalLanguage: dualMessage.originalLanguage,
        translated: dualMessage.translatedText,
        translatedLanguage: dualMessage.translatedLanguage,
        isTranslated: dualMessage.isTranslated,
      },
      data: intent.data || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI Controller] Error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
};

// POST /v1/ai/translate — Real-time translation
// Returns both original AND translated text
export const handleTranslation = async (req: Request, res: Response) => {
  try {
    const { text, from, to } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const fromLang: Language = (from?.toUpperCase() as Language) || detectLanguage(text);
    const toLang: Language = (to?.toUpperCase() as Language) || 'CN';

    const translated = await translateText(text, fromLang, toLang);

    res.status(200).json({
      original: text,
      originalLanguage: fromLang,
      translated,
      translatedLanguage: toLang,
      isTranslated: fromLang !== toLang,
    });
  } catch (error) {
    res.status(500).json({ error: 'Translation service error' });
  }
};

// POST /v1/ai/voice — Process voice message with translation
// Accepts audio data, returns transcription in original + translated languages
export const handleVoiceMessage = async (req: Request, res: Response) => {
  try {
    const { audioData, spokenLanguage, userLanguage, context } = req.body;
    const userId = (req as any).user?.id;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const spoken: Language = spokenLanguage || 'CN';
    const target: Language = userLanguage || 'CN';

    // Process voice: STT → translation
    const result = await processVoiceMessage(audioData, spoken, target);

    // Log interaction
    if (userId) {
      await prisma.userInteraction.create({
        data: {
          userId,
          type: 'voice_message',
          metadata: JSON.stringify({
            originalTranscription: result.originalTranscription,
            originalLanguage: result.originalLanguage,
            translatedText: result.translatedText,
            translatedLanguage: result.translatedLanguage,
            context
          })
        }
      });
    }

    res.status(200).json({
      original: {
        text: result.originalTranscription,
        language: result.originalLanguage,
      },
      translated: {
        text: result.translatedText,
        language: result.translatedLanguage,
      },
      isTranslated: result.isTranslated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[AI] Voice message error:', error);
    res.status(500).json({ error: 'Voice processing failed' });
  }
};

// GET /v1/ai/recommend — Personalized recommendations
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 10 } = req.query;

    let userInteractions: any[] = [];
    if (userId) {
      userInteractions = await prisma.userInteraction.findMany({
        where: { userId, type: { in: ['view', 'like', 'booking', 'search'] } },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    }

    // metadata is stored as a JSON string in SQLite — parse it to read tags
    const userTags = userInteractions
      .flatMap(i => parseArrayField(parseMetadata(i.metadata)?.tags))
      .filter(Boolean);

    // SQLite has no array column support (`hasSome` unsupported) —
    // fetch all active experiences and match tags in JavaScript
    const allExperiences = await prisma.experience.findMany({
      where: { isActive: true },
      include: { merchant: true },
      orderBy: { rating: 'desc' }
    });

    const experiences = userTags.length > 0
      ? allExperiences.filter(exp =>
          parseArrayField(exp.tags).some(tag => userTags.includes(tag)))
      : allExperiences;

    const enriched = experiences.slice(0, Number(limit)).map(exp => ({
      ...exp,
      aiBadge: generateAIBadge(exp, userTags)
    }));

    res.status(200).json({
      recommendations: enriched,
      personalized: userTags.length > 0
    });
  } catch (error) {
    console.error('[AI] Recommendation error:', error);
    res.status(500).json({ error: 'Recommendation service error' });
  }
};

// --- Helper Functions ---

function recognizeIntent(text: string): any {
  const lower = text.toLowerCase();

  // Booking intent
  if (lower.match(/book|预订|预约|订|rezerv/i)) {
    const activityMatch = lower.match(/(?:book|预订|预约|订)\s+(?:a\s+)?(.+)/i);
    return {
      type: 'book_experience',
      activity: activityMatch?.[1]?.trim() || '',
    };
  }

  // Search intent
  if (lower.match(/find|search|show|找|搜索|看看|有什么|ara|bul/i)) {
    const tags: string[] = [];
    if (lower.match(/paraglid|滑翔/i)) tags.push('adventure', 'paragliding');
    if (lower.match(/balloon|热气球|balon/i)) tags.push('balloon', 'romantic');
    if (lower.match(/tour|观光|旅游|tur/i)) tags.push('cultural', 'tour');
    if (lower.match(/hotel|酒店|住宿|otel/i)) tags.push('hotel');
    if (lower.match(/romantic|浪漫|romantik/i)) tags.push('romantic');
    if (lower.match(/adventure|冒险|刺激|macera/i)) tags.push('adventure');
    return { type: 'search_experience', tags };
  }

  // Translation intent
  if (lower.match(/translate|翻译|çevir/i)) {
    return {
      type: 'translate',
      content: text.replace(/translate|翻译|çevir/i, '').trim(),
      targetLanguage: 'TR',
    };
  }

  return { type: 'general' };
}

async function generateResponse(intent: any, userLanguage: Language, userId?: string): Promise<string> {
  switch (intent.type) {
    case 'search_experience': {
      // SQLite: tags are stored as JSON strings — fetch all active
      // experiences and filter by tags in JavaScript
      const allExperiences = await prisma.experience.findMany({
        where: { isActive: true },
        include: { merchant: true }
      });
      const requestedTags: string[] = intent.tags?.length ? intent.tags : [];
      const experiences = requestedTags.length > 0
        ? allExperiences.filter(exp =>
            parseArrayField(exp.tags).some(tag => requestedTags.includes(tag)))
        : allExperiences;
      return formatSearchResponse(experiences.slice(0, 5), userLanguage);
    }

    case 'book_experience': {
      const experience = await prisma.experience.findFirst({
        where: {
          isActive: true,
          title: { contains: intent.activity || '' } // SQLite is case-insensitive by default
        },
        include: { slots: { where: { status: 'AVAILABLE' }, take: 3 } }
      });
      if (experience) {
        return formatBookingResponse(experience, userLanguage);
      }
      const alternatives = await prisma.experience.findMany({ where: { isActive: true }, take: 3 });
      return formatAlternativesResponse(alternatives, userLanguage);
    }

    case 'translate': {
      const translated = await translateText(intent.content, userLanguage, 'TR');
      if (userLanguage === 'CN') {
        return `原文: "${intent.content}"\n土耳其语翻译: "${translated}"`;
      } else if (userLanguage === 'TR') {
        return `Orijinal: "${intent.content}"\nÇeviri: "${translated}"`;
      }
      return `Original: "${intent.content}"\nTranslation: "${translated}"`;
    }

    case 'general':
    default:
      return getLocalizedText('welcome_to_turkey', userLanguage);
  }
}

function formatSearchResponse(experiences: any[], language: Language): string {
  if (experiences.length === 0) {
    return getLocalizedText('no_results', language);
  }

  const title = getLocalizedText('found_experiences', language);
  const list = experiences.map(e => {
    const title = language === 'CN' ? (e.titleCn || e.title) : (language === 'TR' ? (e.titleTr || e.title) : e.title);
    return `• ${title} — ¥${e.priceCny}`;
  }).join('\n');

  return `${title}:\n${list}`;
}

function formatBookingResponse(experience: any, language: Language): string {
  const title = language === 'CN' ? (experience.titleCn || experience.title)
    : language === 'TR' ? (experience.titleTr || experience.title)
    : experience.title;

  const slotsText = experience.slots?.length > 0
    ? experience.slots.map((s: any) => {
        const date = new Date(s.startTime);
        return language === 'CN'
          ? `• ${date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : `• ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      }).join('\n')
    : getLocalizedText('how_can_help', language);

  if (language === 'CN') {
    return `好的！"${title}" 体验已找到。价格：¥${experience.priceCny}。\n可用时间：\n${slotsText}`;
  } else if (language === 'TR') {
    return `Harika! "${title}" deneyimini buldum. Fiyat: ¥${experience.priceCny}.\nMüsait saatler:\n${slotsText}`;
  }
  return `Great! I found "${title}". Price: ¥${experience.priceCny}.\nAvailable slots:\n${slotsText}`;
}

function formatAlternativesResponse(alternatives: any[], language: Language): string {
  const list = alternatives.map(e => {
    const title = language === 'CN' ? (e.titleCn || e.title) : e.title;
    return `• ${title} — ¥${e.priceCny}`;
  }).join('\n');

  if (language === 'CN') {
    return `抱歉，我没有找到完全匹配的体验。让我为您推荐其他精彩活动：\n${list}`;
  } else if (language === 'TR') {
    return `Tam eşleşen deneyim bulamadım. Diğer harika etkinlikleri öneriyorum:\n${list}`;
  }
  return `I couldn't find an exact match. Here are some alternatives:\n${list}`;
}

function generateAIBadge(experience: any, userTags: string[]): string {
  // tags is a JSON string column in SQLite — parse before matching
  const tags = parseArrayField(experience.tags);
  if (experience.rating >= 4.9) return 'Global Favorite';
  if (tags.includes('romantic')) return 'Most Romantic';
  if (tags.includes('adventure')) return 'Top Adventure';
  if (userTags.length > 0) return 'Recommended for You';
  return 'Top Pick';
}