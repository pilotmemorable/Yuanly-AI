import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { paymentAPI, bookingAPI } from '../services/api';

export const PaymentScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { bookingId, holdId, totalAmount, experienceTitle } = route.params || {};
  const [selectedMethod, setSelectedMethod] = useState('WECHAT_PAY');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'WECHAT_PAY', label: t('payment.wechatPay'), color: '#07C160', icon: '💚' },
    { id: 'ALIPAY', label: t('payment.alipay'), color: '#1677FF', icon: '💙' },
  ];

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Initiate payment
      const payRes = await paymentAPI.initiate(bookingId, selectedMethod);

      // In production, open WebView to paymentUrl
      // For now, simulate payment success
      Alert.alert(
        t('payment.title'),
        `Payment URL: ${payRes.paymentUrl}\n\nIn production, this would open a WebView for ${selectedMethod}.`,
        [
          {
            text: t('common.confirm'),
            onPress: async () => {
              // Simulate successful payment webhook
              try {
                // Confirm booking directly (simulating webhook)
                const confirmRes = await bookingAPI.confirm(bookingId, payRes.transactionId);
                Alert.alert(
                  t('payment.success'),
                  `${t('booking.qrTicket')} is ready!`,
                  [{ text: t('common.confirm'), onPress: () => navigation.navigate('MyTrips') }]
                );
              } catch (error: any) {
                Alert.alert(t('payment.failed'), error.message);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('payment.failed'), error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('payment.title')}</Text>
        <Text style={styles.experienceName}>{experienceTitle}</Text>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>{t('detail.total')}</Text>
        <Text style={styles.amount}>¥{totalAmount} CNY</Text>
      </View>

      <View style={styles.methodsContainer}>
        <Text style={styles.sectionTitle}>{t('payment.title')}</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodCard, selectedMethod === method.id && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={styles.methodLabel}>{method.label}</Text>
            <View style={[styles.radioButton, selectedMethod === method.id && styles.radioButtonSelected]}>
              {selectedMethod === method.id && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={processing}>
          {processing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={styles.processingText}>{t('payment.processing')}</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>¥{totalAmount} {t('payment.title')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.l, marginTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  experienceName: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  amountCard: {
    margin: SPACING.l, padding: SPACING.l,
    backgroundColor: COLORS.surface, borderRadius: 20,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 8 },
  amount: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary },
  methodsContainer: { padding: SPACING.l },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    backgroundColor: COLORS.white, borderRadius: 15, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodCardSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(64, 224, 208, 0.05)' },
  methodIcon: { fontSize: 24, marginRight: 16 },
  methodLabel: { flex: 1, fontSize: 18, fontWeight: '600', color: COLORS.text },
  radioButton: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  radioButtonSelected: { borderColor: COLORS.primary },
  radioButtonInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  footer: { padding: SPACING.l, marginTop: 'auto' },
  payButton: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: BORDER_RADIUS.button, alignItems: 'center',
  },
  payButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  processingRow: { flexDirection: 'row', alignItems: 'center' },
  processingText: { color: COLORS.white, marginLeft: 12, fontSize: 16 },
});