import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { bookingAPI } from '../services/api';

export const QRTicketScreen = ({ route }: any) => {
  const { t } = useLanguage();
  const { bookingId } = route.params || {};
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [bookingId]);

  const fetchTicket = async () => {
    try {
      const res = await bookingAPI.getQR(bookingId);
      setTicket(res);
    } catch (error) {
      console.error('[QR] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `My Yuanly booking: ${ticket.booking.experience} at ${new Date(ticket.booking.date).toLocaleString()}. QR: ${ticket.qrCode}`,
      });
    } catch (error) {
      console.error('[QR] Share error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>QR ticket not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.brandText}>Yuanly</Text>
          <Text style={styles.brandSubtext}>缘</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            {/* Simulated QR code — in production, use a QR code library */}
            <View style={styles.qrPattern}>
              {Array.from({ length: 64 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.qrPixel,
                    {
                      backgroundColor: ticket.qrCode.charCodeAt(i % ticket.qrCode.length) % 2 === 0 ? COLORS.text : COLORS.white,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle}>{ticket.booking.experience}</Text>
          <Text style={styles.ticketMerchant}>{ticket.booking.merchant}</Text>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Date</Text>
            <Text style={styles.ticketValue}>{new Date(ticket.booking.date).toLocaleString('zh-CN')}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Guests</Text>
            <Text style={styles.ticketValue}>{ticket.booking.guestCount}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Status</Text>
            <Text style={[styles.ticketValue, { color: '#4CAF50', fontWeight: 'bold' }]}>{ticket.booking.status}</Text>
          </View>
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Booking ID</Text>
            <Text style={styles.ticketValueMono}>{ticket.booking.id?.substring(0, 8)}</Text>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <Text style={styles.footerText}>Show this QR code at the venue</Text>
          <Text style={styles.footerSubtext}>Powered by Yuanly AI</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Share Ticket</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: COLORS.textSecondary },
  ticketCard: { backgroundColor: COLORS.white, borderRadius: 24, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  ticketHeader: { backgroundColor: COLORS.primary, padding: SPACING.l, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  brandSubtext: { fontSize: 28, color: 'rgba(255,255,255,0.6)' },
  qrContainer: { padding: SPACING.xl, alignItems: 'center' },
  qrBox: { width: 200, height: 200, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, borderWidth: 2, borderColor: COLORS.surface },
  qrPattern: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  qrPixel: { width: '12.5%', height: '12.5%' },
  ticketInfo: { padding: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.surface },
  ticketTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  ticketMerchant: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  ticketLabel: { fontSize: 14, color: COLORS.textSecondary },
  ticketValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  ticketValueMono: { fontSize: 14, color: COLORS.text, fontFamily: 'monospace' },
  ticketFooter: { padding: SPACING.l, backgroundColor: COLORS.surface, alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  footerSubtext: { fontSize: 12, color: COLORS.textSecondary },
  shareButton: { marginTop: 20, paddingVertical: 16, borderRadius: BORDER_RADIUS.button, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center' },
  shareButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
});