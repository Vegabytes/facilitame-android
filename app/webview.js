import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function WebViewScreen() {
  const { url, html } = useLocalSearchParams();

  if (!url && !html) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#30D4D1" />
      </SafeAreaView>
    );
  }

  const source = html ? { html } : { uri: url };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <WebView source={source} style={{ flex: 1 }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
