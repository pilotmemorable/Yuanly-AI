import React, { useState } from 'react';
import {
  Alert,
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
import { authAPI, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Language } from '../i18n/translations';

export function LoginScreen({ navigation }: any) {
  const { t, setLanguage } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    if (!password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email: email.trim().toLowerCase(), password });
      await login(response.token, response.user);
      if (response.user.preferredLanguage) {
        await setLanguage(response.user.preferredLanguage as Language);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>缘</Text>
            </View>
            <Text style={styles.title}>{t('auth.signInTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder={t('auth.email')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              placeholder={t('auth.password')}
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <PrimaryButton title={t('auth.signInCta')} loading={loading} onPress={handleLogin} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.hint}>{t('auth.browseHint')}</Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.link}>{t('auth.registerCta')}</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    padding: SPACING.l,
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.s,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: '800',
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.m,
  },
  input: {
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: COLORS.text,
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    gap: SPACING.s,
  },
  hint: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  link: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
});
