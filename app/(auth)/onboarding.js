import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require("../../assets/onboarding-bg.png")}
      style={{
        flex: 1,
        justifyContent: "flex-end",
      }}
      resizeMode="contain"
      className="bg-primary"
    >
      <View
        style={{
          padding: 30,
          paddingBottom: Math.max(30, insets.bottom + 16),
          borderRadius: 10,
        }}
      >
        <TouchableOpacity
          className="bg-button p-4 w-full rounded-full"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-white text-center text-lg">Comenzar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
