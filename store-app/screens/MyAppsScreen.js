import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEY_INSTALLED_APPS = '@store_installed_apps';
const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 16 * 2 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function MyAppsScreen({ navigation }) {
  const [installedApps, setInstalledApps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    loadInstalledApps();
    const unsubscribe = navigation.addListener('focus', () => {
      loadInstalledApps();
    });
    return unsubscribe;
  }, [navigation]);

  const loadInstalledApps = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_INSTALLED_APPS);
      if (saved) setInstalledApps(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to load installed apps', e);
    }
  };

  const removeApp = useCallback(async (app) => {
    Alert.alert('Remove App', 'Are you sure you want to remove "' + app.name + '"?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            if (app.localPath) {
              await FileSystem.deleteAsync(app.localPath, { idempotent: true });
            }
            const updated = installedApps.filter((a) => a.id !== app.id);
            await AsyncStorage.setItem(STORAGE_KEY_INSTALLED_APPS, JSON.stringify(updated));
            setInstalledApps(updated);
          } catch (e) {
            Alert.alert('Error', 'Failed to remove ' + app.name + ': ' + e.message);
          }
        },
      },
    ]);
  }, [installedApps]);

  const openApp = (app) => {
    navigation.navigate('AppView', {
      localPath: app.localPath + 'index.html',
      appName: app.name,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInstalledApps();
    setRefreshing(false);
  }, []);

  const getAppColor = (name) => {
    const colors = ['#4dabf7', '#51cf66', '#fcc419', '#ff6b6b', '#cc5de8', '#20c997', '#ff922b', '#748ffc'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderAppCard = ({ item }) => {
    const cardColor = getAppColor(item.name);
    return (
      <TouchableOpacity
        style={styles.appCard}
        onPress={() => openApp(item)}
        onLongPress={() => removeApp(item)}
        activeOpacity={0.7}>
        <View style={[styles.appIcon, { backgroundColor: cardColor }]}>
          <Text style={styles.appIconText}>
            {(item.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.appName} numberOfLines={2}>{item.name}</Text>
        {item.installedAt && (
          <Text style={styles.installDate}>
            {new Date(item.installedAt).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>\uD83D\uDCF1</Text>
      <Text style={styles.emptyStateTitle}>No Installed Apps</Text>
      <Text style={styles.emptyStateText}>
        Go to the Store tab to browse and install apps from your server.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Apps</Text>
        <Text style={styles.headerSubtitle}>
          {installedApps.length > 0
            ? installedApps.length + ' app' + (installedApps.length !== 1 ? 's' : '') + ' installed'
            : 'No apps installed yet'}
        </Text>
      </View>
      <FlatList
        data={installedApps}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderAppCard}
        ListEmptyComponent={renderEmptyState}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#f0f0f0' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 20, flexGrow: 1 },
  columnWrapper: { justifyContent: 'space-between' },
  appCard: {
    width: CARD_WIDTH, backgroundColor: '#16213e', borderRadius: 16,
    padding: 16, marginVertical: CARD_MARGIN, alignItems: 'center',
    borderWidth: 1, borderColor: '#0f3460',
  },
  appIcon: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appIconText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  appName: { fontSize: 14, fontWeight: '600', color: '#f0f0f0', textAlign: 'center', marginBottom: 4 },
  installDate: { fontSize: 11, color: '#666', marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateTitle: { fontSize: 20, fontWeight: '600', color: '#ccc', marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
});
