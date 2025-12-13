import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Drawer from "expo-router/drawer";
import DrawerContent from "./drawer";
import { Redirect, Slot } from "expo-router";
import { View, Image, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const { isAuthenticated, isReady, profilePicture } = useAuth();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Drawer
        screenOptions={{
          animation: "fade",
          drawerStyle: {
            width: 250,
            backgroundColor: "rgba(255,255,255,0.9)",
          },
          overlayColor: "rgba(0, 0, 0, 0.5)",
          headerTitle: () => <CustomHeader />,
        }}
        drawerContent={() => <DrawerContent />}
      >
        <Slot />
      </Drawer>
    </>
  );
}

function CustomHeader() {
  const router = useRouter();
  const { profilePicture } = useAuth();
  return (
    <View className="flex flex-row flex-1 w-full justify-between items-center">
      <Image
        source={require("../../assets/facilitame-letras-logo.png")}
        style={{
          width: 150,
          height: 40,
          marginRight: 10,
          resizeMode: "contain",
        }}
      />
      <View className="flex flex-row">
        <TouchableOpacity
          onPress={() => router.push("/(app)/tabs/notificaciones")}
        >
          <Image
            className="h-12 w-12"
            source={require("../../assets/notifications.png")}
            style={{
              marginRight: 10,
              resizeMode: "contain",
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(app)/tabs/mi-cuenta")}>
          <Image
            source={{ uri: profilePicture }}
            className="h-12 w-12 rounded-full border-2 border-white"
          ></Image>
        </TouchableOpacity>
      </View>
    </View>
  );
}
