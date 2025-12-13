import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import { AuthProvider } from "../context/AuthContext";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { useRouter } from "expo-router";
import "../global.css";

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Hanken: require("@expo-google-fonts/hanken-grotesk"),
  });

  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Solo registrar notificaciones en plataformas nativas
  if (Platform.OS !== "web") {
    registerForPushNotificationsAsync();
  }

  useEffect(() => {
    // Solo configurar listeners de notificaciones en plataformas nativas
    if (Platform.OS !== "web") {
      notificationListener.current =
        Notifications.addNotificationReceivedListener(() => {});

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const deeplink = response.notification.request.content.data.deeplink;
          if (deeplink) {
            router.push(deeplink);
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
  }, [router]);

  useEffect(() => {
    async function handleInitialNotification() {
      // Solo manejar notificaciones iniciales en plataformas nativas
      if (Platform.OS === "web") return;

      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const deeplink = response.notification.request.content.data.deeplink;
        if (deeplink) {
          router.push(deeplink);
        }
      }
    }
    handleInitialNotification();
  }, [router]);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </AuthProvider>
  );
}
