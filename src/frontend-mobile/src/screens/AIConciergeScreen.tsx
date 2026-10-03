import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { aiAPI, getErrorMessage, isApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
}

export function AIConciergeScreen({ navigation }: any) {
  const { language, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    setMessages([{ id: 'welcome', text: t('ai.welcomeMessage'), isUser: false }]);
  }, [t]);

  const canSend = useMemo(() => Boolean(input.trim()) && !loading, [input, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) {
      return;
    }

    setInput('');
    setMessages((current) => [...current, { id: `user-${Date.now()}`, text, isUser: true }]);
    setLoading(true);

    try {
      const response = await aiAPI.interact({ text, language });
      const replyText = response.message?.translated || response.message?.original || response.data?.message || '...';
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, text: replyText, isUser: false }]);
    } catch (error) {
      if (isApiError(error) && error.status === 401 && !isAuthenticated) {
        Alert.alert(t('auth.signInRequiredTitle'), t('ai.authMessage'));
        navigation.navigate('AuthPrompt', { title: t('auth.signInRequiredTitle'), message: t('ai.authMessage') });
      } else {
        setMessages((current) => [...current, { id: `error-${Date.now()}`, text: getErrorMessage(error), isUser: false }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('ai.title')}</Text>
          <Text style={styles.subtitle}>{t('ai.subtitle')}</Text>
          <Text style={styles.disclaimer}>{t('ai.disclaimer')}</Text>
          <View style={styles.voicePill}>
            <Text style={styles.voicePillText}>{t('ai.voiceComingSoon')}</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
              <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageText, item.isUser ? styles.userText : styles.assistantText]}>{item.text}</Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>{t('ai.thinking')}</Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            disabled={!canSend}
            onPress={() => void sendMessage()}
          >
            <Text style={styles.sendButtonText}>{t('ai.send')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    gap: SPACING.xs,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  disclaimer: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  voicePill: {
    alignSelf: 'flex-start',
    marginTop: SPACING.s,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voicePillText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chatList: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    gap: SPACING.s,
  },
  messageRow: {
    marginBottom: SPACING.s,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowAssistant: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: BORDER_RADIUS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 8,
  },
  assistantBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.text,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
  },
  loadingText: {
    color: COLORS.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.s,
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    borderRadius: BORDER_RADIUS.button,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  sendButton: {
    borderRadius: BORDER_RADIUS.button,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
