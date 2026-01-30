import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { useRouter } from "expo-router";
import "../global.css";

// Componente interno que maneja las notificaciones después de que auth esté listo
function NotificationHandler() {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);
  const pendingDeeplink = useRef(null);
  const hasHandledInitial = useRef(false);

  // Navegar al deeplink pendiente cuando auth esté listo
  useEffect(() => {
    if (isReady && isAuthenticated && pendingDeeplink.current) {
      const navigateToDeeplink = async () => {
        const deeplink = pendingDeeplink.current;
        pendingDeeplink.current = null;

        // Esperar más tiempo en iOS para que tabs/_layout.js cargue servicesLoaded
        // y el layout esté completamente montado
        const delay = Platform.OS === "ios" ? 1500 : 500;
        await new Promise(resolve => setTimeout(resolve, delay));

        const attemptNavigation = (attempt = 1) => {
          try {
            router.replace(deeplink);
          } catch (error) {
            console.warn(`Deeplink navigation attempt ${attempt} failed:`, error);
            if (attempt < 3) {
              setTimeout(() => attemptNavigation(attempt + 1), 1000);
            }
          }
        };

        attemptNavigation();
      };

      navigateToDeeplink();
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    // Solo configurar listeners de notificaciones en plataformas nativas
    if (Platform.OS !== "web") {
      notificationListener.current =
        Notifications.addNotificationReceivedListener(() => {});

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          const deeplink = data?.deeplink;
          if (deeplink) {
            // Si auth está listo y autenticado, navegar con delay para iOS
            if (isReady && isAuthenticated) {
              const delay = Platform.OS === "ios" ? 1500 : 500;
              setTimeout(() => {
                try {
                  router.replace(deeplink);
                } catch (error) {
                  console.warn("Error navigating from notification:", error);
                  // Reintento
                  setTimeout(() => {
                    try { router.replace(deeplink); } catch (e) {}
                  }, 1000);
                }
              }, delay);
            } else {
              // Guardar para navegar cuando esté listo
              pendingDeeplink.current = deeplink;
            }
          }
        });
    }

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router, isReady, isAuthenticated]);

  // Manejar notificación inicial (app abierta desde notificación)
  useEffect(() => {
    async function handleInitialNotification() {
      // Solo manejar una vez y en plataformas nativas
      if (Platform.OS === "web" || hasHandledInitial.current) return;

      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const deeplink = response.notification.request.content.data?.deeplink;
        if (deeplink) {
          hasHandledInitial.current = true;
          // Guardar siempre como pendiente para navegar cuando todo esté listo
          // Esto es más fiable en iOS donde la app arranca desde cero
          pendingDeeplink.current = deeplink;
        }
      }
    }
    handleInitialNotification();
  }, [router, isReady, isAuthenticated]);

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
