import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function AppViewScreen({ route, navigation }) {
  const { localPath, appName } = route.params || {};
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { description } = syntheticEvent.nativeEvent;
    setError(description || 'Failed to load app');
    setLoading(false);
  };

  const getSource = () => {
    if (!localPath) return { html: '<html><body><h1>No app path specified</h1></body></html>' };
    const fileUri = localPath.startsWith('file://') ? localPath : `file://${localPath}`;
    return { uri: fileUri };
  };

  const renderLoading = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#4dabf7" />
      <Text style={styles.loadingText}>Loading {appName || 'app'}...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>\u26A0\uFE0F</Text>
      <Text style={styles.errorTitle}>Failed to Load</Text>
      <Text style={styles.errorMessage}>{error || 'An unknown error occurred'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.retryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.appTitle} numberOfLines={1}>
            {appName || 'App'}
          </Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      {error ? (
        renderError()
      ) : (
        <View style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={getSource()}
            style={styles.webView}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            mixedContentMode="always"
            scalesPageToFit={Platform.OS === 'android'}
          />
          {loading && renderLoading()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  topBar: { backgroundColor: '#0d1117', borderBottomWidth: 1, borderBottomColor: '#1a1a3a' },
  topBarContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, height: 50,
  },
  closeButton: {
    backgroundColor: '#2e2e4a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  closeButtonText: { color: '#f0f0f0', fontSize: 14, fontWeight: '600' },
  appTitle: {
    flex: 1, fontSize: 16, fontWeight: '600', color: '#f0f0f0',
    textAlign: 'center', marginHorizontal: 12,
  },
  placeholder: { width: 70 },
  webViewContainer: { flex: 1 },
  webView: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#0a0a1a',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  loadingText: { color: '#aaa', fontSize: 16, marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '600', color: '#f0f0f0', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryButton: { backgroundColor: '#4dabf7', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
