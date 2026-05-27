import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEY_SERVER_URL = '@store_server_url';
const STORAGE_KEY_INSTALLED_APPS = '@store_installed_apps';

export default function SettingsScreen() {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const url = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
      if (url) setServerUrl(url);
    } catch (e) { console.warn('Failed to load settings', e); }
  };

  const saveServerUrl = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid server URL');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, serverUrl.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { Alert.alert('Error', 'Failed to save server URL'); }
  };

  const clearAllApps = () => {
    Alert.alert(
      'Clear All Apps',
      'This will remove all installed apps and their local files. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const appsDir = FileSystem.documentDirectory + 'apps/';
              const dirInfo = await FileSystem.getInfoAsync(appsDir);
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(appsDir, { idempotent: true });
              }
              await AsyncStorage.setItem(STORAGE_KEY_INSTALLED_APPS, JSON.stringify([]));
              Alert.alert('Done', 'All installed apps have been removed.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear apps: ' + e.message);
            }
          },
        },
      ]
    );
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Reset to Defaults',
      'This will reset the server URL to http://localhost:3000.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            setServerUrl('http://localhost:3000');
            await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, 'http://localhost:3000');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Configure your app store</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Configuration</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Server URL</Text>
            <TextInput
              style={styles.input}
              placeholder="http://localhost:3000"
              placeholderTextColor="#555"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Enter the URL of your app server. Used to browse and download apps.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={saveServerUrl}>
                <Text style={styles.saveButtonText}>
                  {saved ? '\u2713 Saved' : 'Save URL'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Management</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Installed Apps</Text>
            <Text style={styles.hint}>
              Remove all installed apps and their local files from your device.
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearAllApps}>
              <Text style={styles.clearButtonText}>Clear All Installed Apps</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>App Name</Text>
              <Text style={styles.aboutValue}>Personal App Store</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Platform</Text>
              <Text style={styles.aboutValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Framework</Text>
              <Text style={styles.aboutValue}>Expo + React Native</Text>
            </View>
          </View>
          <View style={styles.aboutNote}>
            <Text style={styles.aboutNoteText}>
              Personal App Store allows you to host and manage your own mobile apps.
              Point it to your server running the store-backend to get started.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#f0f0f0' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginLeft: 4,
  },
  card: { backgroundColor: '#16213e', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#0f3460' },
  label: { fontSize: 16, fontWeight: '600', color: '#f0f0f0', marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1, borderColor: '#0f3460',
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    color: '#e0e0e0', fontSize: 15,
  },
  hint: { fontSize: 12, color: '#777', marginTop: 8, lineHeight: 17 },
  buttonRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  saveButton: { backgroundColor: '#4dabf7', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center', flex: 1 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resetButton: {
    backgroundColor: '#2e2e4a', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#3a3a5c',
  },
  resetButtonText: { color: '#ccc', fontSize: 15, fontWeight: '600' },
  clearButton: { backgroundColor: '#c92a2a', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  clearButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  divider: { height: 1, backgroundColor: '#0f3460' },
  aboutLabel: { fontSize: 14, color: '#aaa' },
  aboutValue: { fontSize: 14, color: '#f0f0f0', fontWeight: '500' },
  aboutNote: { paddingHorizontal: 4, paddingVertical: 16 },
  aboutNoteText: { fontSize: 13, color: '#666', lineHeight: 19, textAlign: 'center' },
});
