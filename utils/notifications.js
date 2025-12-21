import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { fetchWithAuth } from "./api"; // Asegúrate de ajustar la ruta si es necesario

// Ajusta cómo se manejarán las notificaciones cuando estén en primer plano
// Solo configurar en plataformas nativas (no web)
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Registra el dispositivo para recibir notificaciones
 * y envía el token FCM al servidor.
 */
export async function registerForPushNotificationsAsync() {
  // Las notificaciones push no están soportadas en web
  if (Platform.OS === "web") {
    return null;
  }

  // En Android es recomendable crear un canal de notificaciones
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Verifica permisos existentes
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Pide permisos si no se habían concedido
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Si aún no se tienen permisos, avisa y no hace nada más
  if (finalStatus !== "granted") {
    alert("No se concedieron permisos para recibir notificaciones");
    return null;
  }

  // Obtén el token FCM
  const token = (await Notifications.getDevicePushTokenAsync()).data;

  // Envía el token al backend
  if (token) {
    try {
      await fetchWithAuth("app-token-save-fcm", {
        push_token: token,
        platform: Platform.OS,
      });
    } catch (error) {
      // Silenciar error de envío de token
    }
  }

  return token;
}
