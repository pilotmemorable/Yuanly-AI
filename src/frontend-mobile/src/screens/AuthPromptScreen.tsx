import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthPromptCard } from '../components/AuthPromptCard';
import { COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';

export function AuthPromptScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const title = route.params?.title || t('auth.signInRequiredTitle');
  const message = route.params?.message || t('auth.signInRequiredMessage');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <AuthPromptCard
          title={title}
          message={message}
          signInLabel={t('common.signIn')}
          createAccountLabel={t('common.createAccount')}
          onLogin={() => navigation.replace('Login')}
          onRegister={() => navigation.replace('Register')}
        />
        <Text style={styles.helper}>{t('auth.browseHint')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
    gap: SPACING.m,
  },
  helper: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
});
