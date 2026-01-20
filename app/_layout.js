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
      // Delay más largo para asegurar que tabs/_layout.js haya cargado servicesLoaded
      // iOS es más estricto con la navegación y necesita que el destino exista
      const navigateToDeeplink = async () => {
        const deeplink = pendingDeeplink.current;
        pendingDeeplink.current = null;

        // Esperar a que la UI esté completamente lista
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          router.push(deeplink);
        } catch (error) {
          console.warn("Error navigating to deeplink:", error);
          // Fallback: intentar de nuevo después de más tiempo
          setTimeout(() => {
            try {
              router.push(deeplink);
            } catch (e) {
              console.error("Failed to navigate to deeplink:", e);
            }
          }, 1000);
        }
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
          const deeplink = response.notification.request.content.data?.deeplink;
          if (deeplink) {
            // Si auth está listo y autenticado, navegar con delay para iOS
            if (isReady && isAuthenticated) {
              // Delay para asegurar que la UI esté lista (importante para iOS)
              setTimeout(async () => {
                try {
                  router.push(deeplink);
                } catch (error) {
                  console.warn("Error navigating from notification:", error);
                }
              }, 500);
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
          // Si auth está listo y autenticado, navegar con delay para iOS
          if (isReady && isAuthenticated) {
            setTimeout(async () => {
              try {
                router.push(deeplink);
              } catch (error) {
                console.warn("Error navigating from initial notification:", error);
              }
            }, 500);
          } else {
            // Guardar para navegar cuando esté listo
            pendingDeeplink.current = deeplink;
          }
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
