import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { API_ORIGIN } from '../services/config';
import { Language } from '../i18n/translations';

export function RegisterScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(language);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const openLegal = (path: string) => Linking.openURL(`${API_ORIGIN}${path}`);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.nameRequired'));
      return;
    }

    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    if (!password) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(t('common.error'), t('auth.acceptTermsError'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        preferredLanguage,
      });
      await login(response.token, response.user);
      await setLanguage(response.user.preferredLanguage as Language);
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
            <Text style={styles.title}>{t('auth.registerTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              placeholder={t('auth.fullName')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
            />
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
              autoComplete="new-password"
              secureTextEntry
              placeholder={t('auth.password')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              autoCapitalize="none"
              secureTextEntry
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t('auth.preferredLanguage')}</Text>
              <LanguageSwitcher language={preferredLanguage} onChange={setPreferredLanguage} />
            </View>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedTerms((current) => !current)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxText}>
                {t('auth.acceptTermsPrefix')}{' '}
                <Text style={styles.inlineLink} onPress={() => openLegal('/terms')}>
                  {t('auth.terms')}
                </Text>
                {' & '}
                <Text style={styles.inlineLink} onPress={() => openLegal('/privacy')}>
                  {t('auth.privacy')}
                </Text>
              </Text>
            </TouchableOpacity>

            <PrimaryButton title={t('auth.registerCta')} loading={loading} onPress={handleRegister} />
          </View>

          <TouchableOpacity style={styles.footer} onPress={() => navigation.replace('Login')}>
            <Text style={styles.link}>{t('auth.signInCta')}</Text>
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
  content: {
    flex: 1,
    padding: SPACING.l,
    justifyContent: 'center',
    gap: SPACING.l,
  },
  hero: {
    gap: SPACING.s,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    lineHeight: 22,
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
  fieldGroup: {
    gap: SPACING.s,
  },
  fieldLabel: {
    color: COLORS.text,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  checkbox: {
    marginTop: 2,
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxMark: {
    color: COLORS.white,
    fontWeight: '800',
  },
  checkboxText: {
    flex: 1,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  inlineLink: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  link: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
});
