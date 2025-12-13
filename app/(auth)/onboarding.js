import {
  View,
  Pressable,
  Text,
  Button,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../../assets/onboarding-bg.png")}
      style={{
        flex: 1,
        justifyContent: "flex-end",
        // alignItems: "center",
      }}
      resizeMode="contain"
      className="bg-primary"
    >
      <View
        style={{
          padding: 30,
          borderRadius: 10,
        }}
      >
        <TouchableOpacity
          className="bg-button p-4 w-full rounded-full mb-2"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-white text-center text-lg">Comenzar</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
