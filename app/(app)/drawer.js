import {
  View,
  Button,
  TouchableOpacity,
  Text,
  Image,
  Linking,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function DrawerContent() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex flex-1 flex-column justify-between items-center px-5 py-5">
      <View className="w-full flex flex-1 pt-10">
        <TouchableOpacity
          onPress={() =>
            router.push(
              "/webview?url=https://facilitame.es/dudas-preguntas-frecuentes/",
            )
          }
        >
          <Text className="text-xl font-bold mb-8">Consultas frecuentes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push(
              "/webview?url=https://facilitame.es/contacto-app-facilitame/",
            )
          }
        >
          <Text className="text-xl font-bold mb-8">Contacto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push("/webview?url=https://app.facilitame.es/legal")
          }
        >
          <Text className="text-xl font-bold mb-8">Aviso legal</Text>
        </TouchableOpacity>
      </View>
      <View className="w-full">
        <View className="w-full flex flex-row mb-7">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.instagram.com/facilitame.2024/")
            }
          >
            <Image
              className="mr-10"
              source={require("../../assets/instagram.png")}
              resizeMode="contain"
              style={{ width: 31, height: 31 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.tiktok.com/@facilitame")
            }
          >
            <Image
              className="mr-10"
              source={require("../../assets/tiktok.png")}
              resizeMode="contain"
              style={{ width: 31, height: 31 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.linkedin.com/company/facilitame-sl")
            }
          >
            <Image
              className="mr-10"
              source={require("../../assets/linkedin.png")}
              resizeMode="contain"
              style={{ width: 31, height: 31 }}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          className="bg-primary px-4 py-3 w-full rounded-xl border border-background flex-row justify-center gap-5 items-center"
          onPress={handleLogout}
        >
          <Text className="text-button font-bold text-center text-lg">
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
