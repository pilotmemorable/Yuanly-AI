import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, getErrorMessage } from '../services/api';

export function ChangePasswordScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t('common.error'), t('auth.passwordRequired'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      Alert.alert(t('common.ok'), t('password.success'));
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
          <TextInput
            secureTextEntry
            placeholder={t('password.currentPassword')}
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            secureTextEntry
            placeholder={t('password.newPassword')}
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <PrimaryButton title={t('common.save')} loading={loading} onPress={handleSave} />
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
});
