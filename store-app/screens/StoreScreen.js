import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
  SafeAreaView, Platform, StatusBar,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_SERVER_URL = '@store_server_url';
const STORAGE_KEY_INSTALLED_APPS = '@store_installed_apps';

export default function StoreScreen({ navigation }) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [installedApps, setInstalledApps] = useState([]);

  useEffect(() => {
    loadSavedUrl();
    loadInstalledApps();
  }, []);

  const loadSavedUrl = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
      if (saved) setServerUrl(saved);
    } catch (e) { console.warn('Failed to load saved URL', e); }
  };

  const loadInstalledApps = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_INSTALLED_APPS);
      if (saved) setInstalledApps(JSON.parse(saved));
    } catch (e) { console.warn('Failed to load installed apps', e); }
  };

  const saveInstalledApps = async (apps) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_INSTALLED_APPS, JSON.stringify(apps));
      setInstalledApps(apps);
    } catch (e) { console.warn('Failed to save installed apps', e); }
  };

  const fetchCatalog = useCallback(async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }
    setLoading(true);
    setConnected(false);
    try {
      const url = serverUrl.replace(/\/+$/, '');
      const response = await fetch(url + '/catalog.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, url);
      setServerUrl(url);
      setCatalog(Array.isArray(data) ? data : []);
      setConnected(true);
    } catch (e) {
      Alert.alert('Connection Error', 'Could not connect to server: ' + e.message);
      setCatalog([]);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  const onRefresh = useCallback(async () => {
    if (!serverUrl.trim()) return;
    setRefreshing(true);
    try {
      const url = serverUrl.replace(/\/+$/, '');
      const response = await fetch(url + '/catalog.json');
      if (response.ok) {
        const data = await response.json();
        setCatalog(Array.isArray(data) ? data : []);
        setConnected(true);
      }
    } catch (e) {
      console.warn('Refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [serverUrl]);

  const installApp = async (app) => {
    if (installing) return;
    setInstalling(app.id);
    try {
      const baseUrl = serverUrl.replace(/\/+$/, '');
      const appDir = FileSystem.documentDirectory + 'apps/' + app.id + '/';
      await FileSystem.makeDirectoryAsync(appDir, { intermediates: true });

      const appJsonResult = await FileSystem.downloadAsync(
        baseUrl + '/apps/' + app.id + '/app.json', appDir + 'app.json'
      );
      if (!appJsonResult.uri) throw new Error('Failed to download app.json');

      const indexResult = await FileSystem.downloadAsync(
        baseUrl + '/apps/' + app.id + '/index.html', appDir + 'index.html'
      );
      if (!indexResult.uri) throw new Error('Failed to download index.html');

      const newApp = {
        id: app.id,
        name: app.name || app.id,
        description: app.description || '',
        localPath: appDir,
        installedAt: new Date().toISOString(),
      };
      const updatedApps = [...installedApps, newApp];
      await saveInstalledApps(updatedApps);
      Alert.alert('Installed', (app.name || app.id) + ' has been installed successfully.');
    } catch (e) {
      Alert.alert('Install Error', 'Failed to install ' + (app.name || app.id) + ': ' + e.message);
    } finally {
      setInstalling(null);
    }
  };

  const isAppInstalled = (appId) => {
    return installedApps.some((a) => a.id === appId);
  };

  const renderAppItem = ({ item }) => {
    const installed = isAppInstalled(item.id);
    const isInstalling = installing === item.id;
    return (
      <View style={styles.appCard}>
        <View style={styles.appInfo}>
          <View style={styles.appIconContainer}>
            <Text style={styles.appIconText}>
              {(item.name || item.id).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.appDetails}>
            <Text style={styles.appName}>{item.name || item.id}</Text>
            <Text style={styles.appDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.installButton,
            installed && styles.installedButton,
            isInstalling && styles.installingButton,
          ]}
          onPress={() => installApp(item)}
          disabled={installed || isInstalling}>
          {isInstalling ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.installButtonText}>
              {installed ? 'Installed' : 'Install'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>App Store</Text>
      <Text style={styles.headerSubtitle}>Browse and install apps from your server</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>\uD83D\uDCE6</Text>
      <Text style={styles.emptyStateTitle}>
        {connected ? 'No Apps Available' : 'Connect to a Server'}
      </Text>
      <Text style={styles.emptyStateText}>
        {connected
          ? 'The server catalog is empty.'
          : 'Enter a server URL above and tap Connect to browse available apps.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.urlBar}>
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="Server URL (e.g., http://192.168.1.100:3000)"
            placeholderTextColor="#666"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={fetchCatalog}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.connectButtonText}>
              {connected ? 'Refresh' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {connected && (
        <View style={styles.connectedBar}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Connected to server</Text>
        </View>
      )}
      <FlatList
        data={catalog}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderAppItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4dabf7"
            colors={['#4dabf7']}
            progressBackgroundColor="#1e1e3a"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  urlBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#0f3460', alignItems: 'center',
  },
  urlInputContainer: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 10,
    borderWidth: 1, borderColor: '#0f3460', paddingHorizontal: 12, marginRight: 10,
  },
  urlInput: { color: '#e0e0e0', fontSize: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10 },
  connectButton: { backgroundColor: '#4dabf7', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, minWidth: 80, alignItems: 'center' },
  connectButtonDisabled: { opacity: 0.7 },
  connectButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  connectedBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#0d2137',
  },
  connectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#51cf66', marginRight: 8 },
  connectedText: { color: '#51cf66', fontSize: 12, fontWeight: '500' },
  listContent: { paddingBottom: 20, flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#f0f0f0' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  appCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#16213e', borderRadius: 14, marginHorizontal: 16, marginVertical: 5,
    padding: 16, borderWidth: 1, borderColor: '#0f3460',
  },
  appInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  appIconContainer: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f3460',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  appIconText: { fontSize: 22, fontWeight: 'bold', color: '#4dabf7' },
  appDetails: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '600', color: '#f0f0f0', marginBottom: 3 },
  appDescription: { fontSize: 13, color: '#999', lineHeight: 18 },
  installButton: { backgroundColor: '#4dabf7', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, minWidth: 90, alignItems: 'center' },
  installedButton: { backgroundColor: '#2b8a3e' },
  installingButton: { backgroundColor: '#1c7ed6' },
  installButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#ccc', marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});
