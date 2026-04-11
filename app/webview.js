import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// JS inyectado en la WebView: intercepta cualquier llamada a window.print()
// (el botón "Descargar" de la factura) y la convierte en un postMessage al
// lado nativo, que usará expo-print para generar/compartir el PDF real.
const INJECTED_JS = `
(function() {
  try {
    var nativePrint = window.print;
    window.print = function() {
      try {
        var html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'print',
            html: html
          }));
          return;
        }
      } catch (e) {}
      // Fallback al print nativo si por lo que sea no podemos comunicarnos
      try { nativePrint.apply(window, arguments); } catch (_e) {}
    };
  } catch (e) {}
  true;
})();
`;

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

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data || "{}");
      if (data.type === "print" && data.html) {
        // Generar PDF a partir del HTML y compartirlo (incluye opción guardar)
        const { uri } = await Print.printToFileAsync({
          html: data.html,
          base64: false,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Factura",
            UTI: "com.adobe.pdf",
          });
        } else {
          // Sin compartir disponible, intentamos imprimir directamente
          await Print.printAsync({ uri });
        }
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el PDF: " + (e?.message || e));
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          source={source}
          style={{ flex: 1 }}
          injectedJavaScript={INJECTED_JS}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
