import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRouter, Redirect } from "expo-router";

export default function Home() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady) {
      console.log(`🔀 Redirigiendo a: ${isAuthenticated ? "APP" : "LOGIN"}`);
      router.replace(
        isAuthenticated ? "/(app)/tabs/inicio" : "/(auth)/onboarding",
      );
    }
  }, [isReady, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
