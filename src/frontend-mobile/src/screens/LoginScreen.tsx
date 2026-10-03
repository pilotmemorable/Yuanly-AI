import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export const LoginScreen = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWeChatLogin = async () => {
    setLoading(true);
    try {
      // In production, this would open WeChat SDK
      // For now, simulate with a test token
      const res = await authAPI.wechatLogin('wx_test_001');
      setUserId(res.userId);
      setStep('verify');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!email) {
      Alert.alert(t('common.error'), 'Email is required');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ email, fullName, preferredLanguage: 'CN' });
      setUserId(res.userId);
      setStep('verify');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert(t('common.error'), 'Code is required');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verify2FA(userId, code);
      if (res.token) {
        await login(res.token, res.user);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    // Continue as guest — no auth
    login('guest_token', { id: 'guest', membershipLevel: 'GUEST', preferredLanguage: 'CN', fullName: 'Guest' });
  };

  if (step === 'verify') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('auth.enterCode')}</Text>
          <Text style={styles.subtitle}>{t('auth.codeSent')}</Text>
          <Text style={styles.hint}>Dev mode: use 123456</Text>

          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor={COLORS.textSecondary}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>{t('auth.verify')}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>缘</Text>
          </View>
          <Text style={styles.title}>{t('auth.welcome')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name (optional)"
            placeholderTextColor={COLORS.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleEmailRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryButtonText}>{t('auth.emailRegister')}</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.wechatButton} onPress={handleWeChatLogin} disabled={loading}>
            <Text style={styles.wechatButtonText}>{t('auth.wechatLogin')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>{t('auth.skip')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  logoText: { fontSize: 36, color: COLORS.white, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
  hint: { fontSize: 14, color: COLORS.primary, marginTop: 8, textAlign: 'center' },
  formContainer: { marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: BORDER_RADIUS.button,
    paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: COLORS.text,
    marginBottom: 12, backgroundColor: COLORS.white,
  },
  primaryButton: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: BORDER_RADIUS.button, alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 16, color: COLORS.textSecondary, fontSize: 14 },
  wechatButton: {
    backgroundColor: '#07C160', paddingVertical: 18,
    borderRadius: BORDER_RADIUS.button, alignItems: 'center',
  },
  wechatButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  guestButton: { paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  guestButtonText: { color: COLORS.textSecondary, fontSize: 16 },
});