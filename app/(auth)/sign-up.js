import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Pantalla de Registro</Text>
      <Button
        title="Volver al Login"
        onPress={() => router.push("/(auth)/login")}
      />
    </View>
  );
}
