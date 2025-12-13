import { SolicitudProvider } from "../../../../context/SolicitudContext";
import { useRouter, useLocalSearchParams, router } from "expo-router";
import {
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import SolicitudDetalles from "./../../../../components/SolicitudDetalles";
import SolicitudTabNavigator from "./../../../../components/SolicitudTabNavigator";
import { useContext } from "react";
import { SolicitudContext } from "../../../../context/SolicitudContext";

const SolicitudContent = () => {
  const { solicitud } = useContext(SolicitudContext);

  const StickyChat = () => (
    <TouchableOpacity
      style={{ position: "absolute", bottom: 15, right: 15 }}
      onPress={() =>
        router.push(`/(app)/tabs/mis-solicitudes/chat?id=${solicitud.id}`)
      }
    >
      <View
        className="bg-red-500 w-20 h-20 rounded-full object-contain flex justify-center items-center"
        style={{ elevation: 5 }}
      >
        <Image
          source={require("./../../../../assets/chat.png")}
          className="h-10 w-10"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex flex-1 bg-background p-2 align-center">
      <ScrollView
        className="flex flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <SolicitudDetalles />
        <SolicitudTabNavigator />
      </ScrollView>
      <StickyChat />
    </View>
  );
};

export default function SolicitudScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SolicitudProvider id={id}>
      <SolicitudContent />
    </SolicitudProvider>
  );
}
