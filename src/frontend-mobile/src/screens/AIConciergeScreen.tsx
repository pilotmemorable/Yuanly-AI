import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { aiAPI } from '../services/api';

interface DualLanguageMessage {
  id: string;
  text: string;          // The text to display (translated for user)
  originalText?: string;  // Original language text (if different)
  originalLanguage?: string;
  translatedLanguage?: string;
  isTranslated?: boolean;
  isUser: boolean;
  isVoice?: boolean;
  timestamp: Date;
}

const LANG_LABELS: Record<string, string> = {
  CN: '中文',
  EN: 'English',
  TR: 'Türkçe',
};

export const AIConciergeScreen = () => {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [messages, setMessages] = useState<DualLanguageMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true); // Toggle to show/hide original
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Welcome message in user's language
    const welcomeTexts: Record<string, string> = {
      CN: '欢迎来到土耳其的奇妙世界。我是Yuanly，您的私人导游。您想探索什么？',
      EN: 'Welcome to the magic of Turkey. I am Yuanly, your personal guide. What would you like to explore today?',
      TR: 'Türkiye\'nin büyüsüne hoş geldiniz. Ben Yuanly, kişisel rehberiniz. Ne keşfetmek istersiniz?',
    };
    setMessages([{
      id: 'welcome',
      text: welcomeTexts[language] || welcomeTexts.CN,
      isUser: false,
      timestamp: new Date(),
      originalLanguage: language,
      translatedLanguage: language,
      isTranslated: false,
    }]);
  }, [language]);

  const startListening = () => {
    setIsListening(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

  const stopListening = async () => {
    setIsListening(false);
    pulseAnim.setValue(1);
    setIsProcessingVoice(true);

    // In production, this would:
    // 1. Capture audio via expo-av
    // 2. Send audio to /ai/voice endpoint
    // 3. Get back original transcription + translation
    try {
      // Simulated voice processing — in production, use expo-av to record
      // const recording = await Audio.Recording.createAsync(...)
      // const audioBase64 = await readAudioBase64(recording)
      // const res = await aiAPI.voice(audioBase64, language, language)

      // For now, add a placeholder voice message
      const userMsg: DualLanguageMessage = {
        id: `user_voice_${Date.now()}`,
        text: language === 'CN' ? '[语音消息] 我想预订滑翔伞' : '[Voice message] I want to book paragliding',
        isUser: true,
        isVoice: true,
        timestamp: new Date(),
        originalLanguage: language,
        translatedLanguage: language,
        isTranslated: false,
      };
      setMessages(prev => [...prev, userMsg]);

      // Send to AI
      await sendMessageToAI(language === 'CN' ? '我想预订滑翔伞' : 'I want to book paragliding');
    } catch (error) {
      console.error('[AI] Voice error:', error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: DualLanguageMessage = {
      id: `user_${Date.now()}`,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
      originalLanguage: language,
      translatedLanguage: language,
      isTranslated: false,
    };
    setMessages(prev => [...prev, userMsg]);
    const sentText = inputText;
    setInputText('');
    setLoading(true);

    await sendMessageToAI(sentText);
  };

  const sendMessageToAI = async (text: string) => {
    try {
      const res = await aiAPI.interact(text, language);

      // The API returns dual-language: original + translated
      const aiMsg: DualLanguageMessage = {
        id: `ai_${Date.now()}`,
        text: res.message?.translated || res.message?.original || '...',
        originalText: res.message?.original,
        originalLanguage: res.message?.originalLanguage,
        translatedLanguage: res.message?.translatedLanguage,
        isTranslated: res.message?.isTranslated,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errMsg: DualLanguageMessage = {
        id: `err_${Date.now()}`,
        text: language === 'CN' ? '抱歉，处理时出现错误。请重试。' : 'Sorry, there was an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
        originalLanguage: language,
        translatedLanguage: language,
        isTranslated: false,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: DualLanguageMessage }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.aiMessage]}>
      {!item.isUser && <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>缘</Text></View>}
      <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        {/* Voice indicator */}
        {item.isVoice && (
          <View style={styles.voiceIndicator}>
            <Text style={styles.voiceIcon}>🎙️</Text>
            <Text style={styles.voiceLabel}>{LANG_LABELS[item.originalLanguage || 'CN']}</Text>
          </View>
        )}

        {/* Main message text (user's language / translated) */}
        <Text style={[styles.messageText, item.isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>

        {/* Original text (if different from translated) */}
        {showOriginal && item.isTranslated && item.originalText && item.originalText !== item.text && (
          <View style={styles.originalContainer}>
            <View style={styles.originalDivider} />
            <Text style={styles.originalLabel}>
              {LANG_LABELS[item.originalLanguage || 'CN']} ↓ {LANG_LABELS[item.translatedLanguage || 'CN']}
            </Text>
            <Text style={styles.originalText}>{item.originalText}</Text>
          </View>
        )}

        {/* Language tag */}
        {!item.isUser && (
          <View style={styles.langTag}>
            <Text style={styles.langTagText}>
              {item.isTranslated
                ? `${LANG_LABELS[item.originalLanguage || '?']} → ${LANG_LABELS[item.translatedLanguage || '?']}`
                : LANG_LABELS[item.translatedLanguage || language]}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('ai.title')}</Text>
        <Text style={styles.subtitle}>{t('ai.subtitle')}</Text>

        {/* Toggle for showing/hiding original text */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowOriginal(!showOriginal)}
        >
          <Text style={styles.toggleText}>
            {showOriginal ? '✓ ' : ''}Show Original + Translation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orb */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.orbInner} />
        </Animated.View>
        <Text style={styles.orbStatus}>
          {isProcessingVoice ? '🔄 Translating...' : isListening ? t('ai.listening') : '● Ready'}
        </Text>
      </View>

      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Yuanly is thinking...</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListening : startListening}
          disabled={isProcessingVoice}
        >
          <Text style={styles.micText}>{isListening ? '⏹' : '🎤'}</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={t('ai.typeMessage')}
          placeholderTextColor={COLORS.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !inputText.trim()}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  toggleButton: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  toggleText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  orbContainer: { alignItems: 'center', paddingVertical: 12 },
  orb: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  orbInner: { width: 65, height: 65, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.4)' },
  orbStatus: { marginTop: 6, fontSize: 11, color: COLORS.textSecondary },
  chatList: { paddingHorizontal: SPACING.l, paddingBottom: 8 },
  messageContainer: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userMessage: { justifyContent: 'flex-end' },
  aiMessage: { justifyContent: 'flex-start' },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  aiAvatarText: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  messageBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18 },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  userText: { color: COLORS.white },
  aiText: { color: COLORS.text },
  voiceIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  voiceIcon: { fontSize: 14, marginRight: 6 },
  voiceLabel: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic' },
  originalContainer: { marginTop: 8 },
  originalDivider: { height: 1, backgroundColor: '#E0E0E0', marginBottom: 6 },
  originalLabel: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
  originalText: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic', lineHeight: 19 },
  langTag: { marginTop: 6, alignSelf: 'flex-start' },
  langTagText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '500' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, color: COLORS.textSecondary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: SPACING.s, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.s },
  micButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  micButtonActive: { backgroundColor: COLORS.accent },
  micText: { fontSize: 18 },
  textInput: { flex: 1, maxHeight: 80, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.surface, borderRadius: 18 },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonText: { color: COLORS.white, fontSize: 16 },
});