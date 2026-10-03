import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Building, Calendar, MessageCircle, Search, User } from 'lucide-react-native';
import { ExploreScreen } from '../screens/ExploreScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { AIConciergeScreen } from '../screens/AIConciergeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { QRTicketScreen } from '../screens/QRTicketScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { AuthPromptScreen } from '../screens/AuthPromptScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { NewReservationScreen } from '../screens/NewReservationScreen';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useMerchantReservations } from '../context/MerchantReservationsContext';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { pendingCount } = useMerchantReservations();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primaryDark,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: t('tab.explore'),
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      {user?.role === 'MERCHANT' ? (
        <Tabs.Screen
          name="Reservations"
          component={ReservationsScreen}
          options={{
            tabBarLabel: t('tab.reservations'),
            tabBarIcon: ({ color, size }) => <Building color={color} size={size} />,
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          }}
        />
      ) : null}
      <Tabs.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{
          tabBarLabel: t('tab.trips'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="AIConcierge"
        component={AIConciergeScreen}
        options={{
          tabBarLabel: t('tab.ai'),
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tab.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: COLORS.background,
          card: COLORS.surface,
          border: COLORS.border,
          text: COLORS.text,
          primary: COLORS.primaryDark,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ title: t('detail.requestReservation') }} />
        <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} options={{ title: t('booking.successTitle'), gestureEnabled: false }} />
        <Stack.Screen name="QRTicket" component={QRTicketScreen} options={{ title: t('booking.qrTitle') }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('auth.signInTitle'), presentation: 'modal' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('auth.registerTitle'), presentation: 'modal' }} />
        <Stack.Screen name="AuthPrompt" component={AuthPromptScreen} options={{ title: t('auth.signInRequiredTitle'), presentation: 'modal' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: t('notifications.title') }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: t('password.title') }} />
        <Stack.Screen name="NewReservation" component={NewReservationScreen} options={{ title: t('merchant.createReservationTitle') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
