import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProximosVencimientos from "./../../../../components/ProximosVencimientos";
import { fetchWithAuth } from "./../../../../utils/api";
import { useAuth } from "../../../../context/AuthContext";
import EstadoColor from "./../../../../components/EstadoColor";

export default function DashboardScreen() {
  const [authToken, setAuthToken] = useState("");
  const [dashboardData, setDashboardData] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { profilePicture } = useAuth();

  const loadDashboardData = async () => {
    try {
      const data = await fetchWithAuth("app-dashboard");
      setDashboardData(data || "");
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        className="bg-background"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="bg-background p-4">
      <View className="flex-column gap-3 mb-20">
        <TouchableOpacity onPress={() => router.push(`/(app)/tabs/mi-cuenta`)}>
          <View className="w-full h-auto m-0 p-5 flex flex-row gap-5 rounded-2xl bg-primary">
            <Image
              source={{ uri: profilePicture }}
              className="h-20 w-20 rounded-full border-2 border-white"
            />
            <View className="flex flex-1 flex-column gap-2">
              <Text className="text-2xl font-extrabold">
                ¡Hola {dashboardData?.data?.user?.name || ""}!
              </Text>
              <Text>{dashboardData?.data?.user?.phone || ""}</Text>
              <View className="w-full flex flex-row justify-end">
                <Text>Editar perfil</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(app)/tabs/notificaciones")}
        >
          <View className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-primary">
            <View className="h-16 w-16 rounded-full border-2 border-white bg-primary flex items-center justify-center overflow-hidden">
              <Image
                source={require("../../../../assets/notifications-white.png")}
                className="h-9 w-9 object-contain"
              />
            </View>
            <Text className="text-base font-extrabold">
              {dashboardData?.data?.notifications_unread > 0 ? (
                <>
                  Tienes {dashboardData.data.notifications_unread}{" "}
                  notificaciones sin leer
                </>
              ) : (
                <>No tienes notificaciones pendientes</>
              )}
            </Text>
          </View>
        </TouchableOpacity>

        {dashboardData?.data?.last_requests?.length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/tabs/mis-solicitudes`)}
            >
              <View className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-primary">
                <View className="h-16 w-16 rounded-full border-2 border-white bg-primary flex items-center justify-center overflow-hidden">
                  <Image
                    source={require("../../../../assets/services-white.png")}
                    className="h-8 w-8 object-contain"
                  />
                </View>
                <Text className="text-base font-extrabold">
                  Mis servicios contratados
                </Text>
              </View>
            </TouchableOpacity>

            <FlatList
              scrollEnabled={false}
              data={dashboardData?.data?.last_requests}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<></>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/(app)/tabs/mis-solicitudes/solicitud?id=${item.id}`,
                    )
                  }
                >
                  <View className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-white mb-2">
                    <View className="h-16 w-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
                      <Image
                        className="h-10 w-10 object-contain"
                        source={
                          item.category_img_uri
                            ? { uri: `${item.category_img_uri}` }
                            : ""
                        }
                      />
                    </View>
                    <View>
                      <Text className="text-base font-extrabold">
                        {item.category_name}
                      </Text>
                      <Text className="text-base font-bold">{item.info}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <View className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-primary">
          <View className="h-16 w-16 rounded-full border-2 border-white bg-primary flex items-center justify-center overflow-hidden">
            <Image
              source={require("../../../../assets/calendar-white.png")}
              className="h-8 w-8 object-contain"
            ></Image>
          </View>
          <Text className="text-base font-extrabold">
            Próximos vencimientos
          </Text>
        </View>

        <ProximosVencimientos />
      </View>
    </ScrollView>
  );
}
