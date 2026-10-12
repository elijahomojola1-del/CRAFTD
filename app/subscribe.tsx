import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackButton from '../components/BackButton';
import { formStyles } from '../constants/formStyles';
import { colors } from '../constants/theme';
import { apiRequest } from '../utils/api';
import { readItem, removeItem, writeItem } from '../utils/tokenStorage';

const PENDING_PAYMENT_KEY = 'pendingPaymentReference';

interface Allowance {
  free_limit: number;
  used: number;
  remaining: number;
}

interface Subscription {
  is_subscribed: boolean;
  expires: string | null;
  price_text: string;
  // True once Paystack is connected and a price is set on the server.
  payment_available: boolean;
  requested: boolean;
  provider: Allowance;
  client: Allowance;
}

const BENEFITS = [
  'Accept every booking request, with no limit',
  'See who wants to hire you straight away',
  'Chat, call and WhatsApp on all your bookings',
];

function AllowanceRow({ label, allowance }: { label: string; allowance: Allowance }) {
  return (
    <View style={styles.allowanceRow}>
      <Text style={styles.allowanceLabel}>{label}</Text>
      <Text style={styles.allowanceValue}>
        {allowance.remaining} of {allowance.free_limit} left
      </Text>
    </View>
  );
}

export default function SubscribeScreen() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Paystack sends the user back here with the payment reference in the address.
  const { reference, trxref } = useLocalSearchParams<{ reference?: string; trxref?: string }>();
  const [notice, setNotice] = useState('');

  const fetchSubscription = useCallback(async () => {
    const result = await apiRequest<Subscription>('/app/subscription/', {
      fallbackError: 'Could not load your subscription.',
    });
    setError(result.ok ? '' : result.error);
    if (result.ok && result.data) setSubscription(result.data);
    setLoading(false);
  }, []);

  // Ask the server what happened to a payment, then refresh the screen.
  const confirmPayment = useCallback(
    async (paymentReference: string) => {
      const result = await apiRequest('/app/subscription/verify/', {
        method: 'POST',
        body: { reference: paymentReference },
        fallbackError: 'We could not confirm your payment yet.',
      });
      await removeItem(PENDING_PAYMENT_KEY);
      if (!result.ok) {
        setError(result.error);
      } else if (result.data?.status === 'success') {
        setNotice('Payment received. Your subscription is active.');
      } else if (result.data?.status === 'failed') {
        setError('That payment did not go through. You have not been charged for a subscription.');
      } else {
        setNotice('Your payment is still being confirmed. This page will update once it is.');
      }
      await fetchSubscription();
    },
    [fetchSubscription]
  );

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const returned = reference || trxref || (await readItem(PENDING_PAYMENT_KEY));
        if (returned) {
          await confirmPayment(returned);
        } else {
          await fetchSubscription();
        }
      };
      load();
    }, [reference, trxref, confirmPayment, fetchSubscription])
  );

  const payNow = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    const result = await apiRequest('/app/subscription/pay/', {
      method: 'POST',
      fallbackError: 'Could not start the payment. Please try again.',
    });
    if (!result.ok || !result.data) {
      setBusy(false);
      setError(result.error);
      return;
    }

    // Remembered so the payment can be confirmed when the user comes back.
    await writeItem(PENDING_PAYMENT_KEY, result.data.reference);

    if (Platform.OS === 'web') {
      window.location.href = result.data.authorization_url;
      return;
    }

    // On a phone the checkout opens in an in-app browser; confirm on return.
    await WebBrowser.openBrowserAsync(result.data.authorization_url);
    setBusy(false);
    await confirmPayment(result.data.reference);
  };

  const requestSubscription = async () => {
    setBusy(true);
    const result = await apiRequest('/app/subscription/request/', {
      method: 'POST',
      fallbackError: 'Could not send your request. Please try again.',
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    fetchSubscription();
  };

  return (
    <View style={formStyles.safe}>
      <View style={formStyles.header}>
        <BackButton />
        <Text style={formStyles.title} accessibilityRole="header">Subscription</Text>
        <View style={formStyles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={formStyles.content}>
          {error ? (
            <Text style={formStyles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          {notice ? (
            <Text style={formStyles.success} accessibilityRole="alert">
              {notice}
            </Text>
          ) : null}

          {subscription?.is_subscribed ? (
            <View style={formStyles.card}>
              <Text style={formStyles.cardTitle}>You&apos;re subscribed</Text>
              <Text style={formStyles.cardBody}>
                All your bookings are unlocked.
                {subscription.expires
                  ? ` Your subscription runs until ${new Date(subscription.expires).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}.`
                  : ''}
              </Text>
            </View>
          ) : subscription ? (
            <>
              <Text style={formStyles.intro}>
                Browsing and sending booking requests is always free. Your first bookings are free
                too. After that, a subscription unlocks every booking.
              </Text>

              <View style={formStyles.card}>
                <Text style={formStyles.cardTitle}>Your free bookings</Text>
                <AllowanceRow label="Jobs you accept" allowance={subscription.provider} />
                <AllowanceRow label="Bookings you make" allowance={subscription.client} />
              </View>

              <View style={formStyles.card}>
                <Text style={formStyles.cardTitle}>With a subscription</Text>
                {BENEFITS.map((benefit) => (
                  <View key={benefit} style={styles.benefitRow}>
                    <Text style={styles.benefitDot} aria-hidden>•</Text>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
                {subscription.price_text ? (
                  <Text style={styles.price}>{subscription.price_text}</Text>
                ) : null}
              </View>

              {subscription.requested ? (
                <Text style={formStyles.success} accessibilityRole="alert">
                  We have your request and will be in touch to set up your subscription.
                </Text>
              ) : (
                <>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[formStyles.button, busy && formStyles.buttonDisabled]}
                    onPress={subscription.payment_available ? payNow : requestSubscription}
                    disabled={busy}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={formStyles.buttonText}>
                        {subscription.payment_available ? 'Subscribe and Pay' : 'Subscribe'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.note}>
                    {subscription.payment_available
                      ? 'You will pay securely with Paystack by card, bank transfer or USSD.'
                      : 'Online payment is not available yet. Tap Subscribe and we will contact you to set it up.'}
                  </Text>
                </>
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  allowanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  allowanceLabel: { color: colors.textSecondary, fontSize: 14 },
  allowanceValue: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  benefitRow: { flexDirection: 'row', marginBottom: 6 },
  benefitDot: { color: colors.primary, fontSize: 14, lineHeight: 21, width: 16 },
  benefitText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  price: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 10 },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 14 },
});
