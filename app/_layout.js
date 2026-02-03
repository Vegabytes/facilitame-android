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

        console.log("🚀 Auth ready, processing pending deeplink:", deeplink);

        // Esperar más tiempo en iOS para que tabs/_layout.js cargue servicesLoaded
        // y el layout esté completamente montado
        const delay = Platform.OS === "ios" ? 2000 : 800;
        await new Promise(resolve => setTimeout(resolve, delay));

        const attemptNavigation = (attempt = 1) => {
          try {
            console.log(`🔀 Attempt ${attempt} to navigate to:`, deeplink);
            router.push(deeplink);
            console.log("✅ Pending deeplink navigation succeeded");
          } catch (error) {
            console.error(`❌ Deeplink navigation attempt ${attempt} failed:`, error);
            if (attempt < 3) {
              setTimeout(() => attemptNavigation(attempt + 1), 1500);
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
          let deeplink = data?.deeplink;
          console.log("📱 Notification clicked, deeplink:", deeplink);

          // Validar y limpiar el deeplink
          if (deeplink && typeof deeplink === 'string') {
            deeplink = deeplink.trim();
            console.log("✓ Valid deeplink format");
          } else {
            console.warn("⚠️ Invalid deeplink:", deeplink);
            return;
          }

          if (deeplink) {
            // Si auth está listo y autenticado, navegar con delay para iOS
            if (isReady && isAuthenticated) {
              const delay = Platform.OS === "ios" ? 1500 : 500;
              console.log(`⏱️ Waiting ${delay}ms before navigation...`);
              setTimeout(() => {
                try {
                  console.log("🔀 Attempting navigation to:", deeplink);
                  router.push(deeplink);
                  console.log("✅ Navigation succeeded");
                } catch (error) {
                  console.error("❌ Error navigating from notification:", error);
                  // Reintento
                  setTimeout(() => {
                    try {
                      console.log("🔄 Retrying navigation to:", deeplink);
                      router.push(deeplink);
                    } catch (e) {
                      console.error("❌ Retry failed:", e);
                    }
                  }, 1000);
                }
              }, delay);
            } else {
              // Guardar para navegar cuando esté listo
              console.log("⏸️ Auth not ready, saving deeplink for later");
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

      console.log("🔍 Checking for initial notification...");
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const deeplink = response.notification.request.content.data?.deeplink;
        console.log("📬 Initial notification found, deeplink:", deeplink);
        if (deeplink) {
          hasHandledInitial.current = true;
          // Guardar siempre como pendiente para navegar cuando todo esté listo
          // Esto es más fiable en iOS donde la app arranca desde cero
          pendingDeeplink.current = deeplink;
          console.log("💾 Saved initial deeplink as pending");
        }
      } else {
        console.log("📭 No initial notification found");
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
