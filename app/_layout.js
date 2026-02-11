import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { useRouter } from "expo-router";
import "../global.css";

// Extraer deeplink de la notificación buscando en todas las ubicaciones posibles
// iOS (APNs nativo) pone los datos custom en sitios distintos a Android (FCM)
function extractDeeplink(response) {
  const notification = response.notification;
  const content = notification.request.content;
  const trigger = notification.request.trigger;

  // Log completo del response para debug en iOS
  if (Platform.OS === "ios") {
    console.log("Push iOS full trigger:", JSON.stringify(trigger));
    console.log("Push iOS full content.data:", JSON.stringify(content.data));
  }

  // 1. Ubicación estándar: content.data (funciona en Android/FCM)
  let deeplink = content.data?.deeplink;

  // 2. iOS: los datos custom de APNs están en trigger.payload (fuera de aps)
  if (!deeplink && trigger?.payload) {
    deeplink = trigger.payload.deeplink;
  }

  // 3. iOS: buscar dentro de aps también por si acaso
  if (!deeplink && trigger?.payload?.aps) {
    deeplink = trigger.payload.aps.deeplink;
  }

  // 4. iOS: expo-notifications puede wrappear en body
  if (!deeplink && trigger?.payload?.body) {
    try {
      const body = typeof trigger.payload.body === "string"
        ? JSON.parse(trigger.payload.body)
        : trigger.payload.body;
      deeplink = body?.deeplink;
    } catch (_e) {}
  }

  // 5. Fallback: remoteMessage (algunas versiones de expo-notifications)
  if (!deeplink && trigger?.remoteMessage?.data) {
    deeplink = trigger.remoteMessage.data.deeplink;
  }

  // Limpiar
  if (deeplink && typeof deeplink === "string") {
    deeplink = deeplink.trim();
  } else {
    deeplink = null;
  }

  console.log("Push extractDeeplink result:", deeplink);
  return deeplink;
}

// Componente interno que maneja las notificaciones después de que auth esté listo
function NotificationHandler() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const hasHandledInitial = useRef(false);
  const [pendingDeeplink, setPendingDeeplink] = useState(null);

  // Refs para acceder al estado actual de auth sin recrear el listener
  const isReadyRef = useRef(isReady);
  const isAuthenticatedRef = useRef(isAuthenticated);
  const routerRef = useRef(router);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
  useEffect(() => { routerRef.current = router; }, [router]);

  // Función de navegación reutilizable
  const navigateToDeeplink = useCallback(async (deeplink) => {
    if (!deeplink) return;
    console.log("Navigating to deeplink:", deeplink);

    const delay = Platform.OS === "ios" ? 1500 : 800;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const attemptNavigation = (attempt = 1) => {
      try {
        console.log(`Navigation attempt ${attempt}:`, deeplink);
        routerRef.current.push(deeplink);
      } catch (error) {
        console.error(`Navigation attempt ${attempt} failed:`, error);
        if (attempt < 3) {
          setTimeout(() => attemptNavigation(attempt + 1), 1000);
        }
      }
    };

    attemptNavigation();
  }, []);

  // Procesar deeplink pendiente cuando auth esté listo
  useEffect(() => {
    if (isReady && isAuthenticated && pendingDeeplink) {
      const deeplink = pendingDeeplink;
      setPendingDeeplink(null);
      navigateToDeeplink(deeplink);
    }
  }, [isReady, isAuthenticated, pendingDeeplink, navigateToDeeplink]);

  // Listener estable: se crea una sola vez, usa refs para auth
  useEffect(() => {
    if (Platform.OS === "web") return;

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        let deeplink = extractDeeplink(response);

        // Fallback: si no hay deeplink, llevar a notificaciones
        if (!deeplink) {
          console.warn("No deeplink found, falling back to notifications tab");
          deeplink = "/(app)/tabs/notificaciones";
        }

        if (isReadyRef.current && isAuthenticatedRef.current) {
          navigateToDeeplink(deeplink);
        } else {
          setPendingDeeplink(deeplink);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(
          responseListener.current,
        );
      }
    };
  }, [navigateToDeeplink]);

  // Manejar notificación inicial (cold start)
  useEffect(() => {
    async function handleInitialNotification() {
      if (Platform.OS === "web" || hasHandledInitial.current) return;

      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        let deeplink = extractDeeplink(response);
        if (!deeplink) {
          deeplink = "/(app)/tabs/notificaciones";
        }
        hasHandledInitial.current = true;
        setPendingDeeplink(deeplink);
        console.log("Initial notification deeplink:", deeplink);
      }
    }
    handleInitialNotification();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Hanken: require("@expo-google-fonts/hanken-grotesk"),
  });

  return (
    <AuthProvider>
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </AuthProvider>
  );
}
