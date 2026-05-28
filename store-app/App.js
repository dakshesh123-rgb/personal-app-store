import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StoreScreen from './screens/StoreScreen';
import MyAppsScreen from './screens/MyAppsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AppViewScreen from './screens/AppViewScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const icons = {
    Store: '\uD83C\uDFEA',
    'My Apps': '\uD83D\uDCF1',
    Settings: '\u2699\uFE0F',
  };
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icons[label] || '\uD83D\uDCE6'}
      </Text>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#4dabf7',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0d1117',
          borderTopColor: '#1a1a3a',
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen
        name="My Apps"
        component={MyAppsScreen}
        initialParams={{}}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      setAppIsReady(true);
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('SplashScreen.hideAsync failed:', e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  const darkTheme = {
    dark: true,
    colors: {
      primary: '#4dabf7',
      background: '#1a1a2e',
      card: '#0d1117',
      text: '#f0f0f0',
      border: '#1a1a3a',
      notification: '#4dabf7',
    },
  };

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <NavigationContainer theme={darkTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="AppView"
            component={AppViewScreen}
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
});
