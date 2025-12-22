import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchWithAuth } from "./../../../../utils/api";
import { MaterialIcons } from "@expo/vector-icons";

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchNotificaciones();
    }, []),
  );

  async function fetchNotificaciones() {
    try {
      const response = await fetchWithAuth("app-user-get-notifications");
      if (response && response.data) {
        const responseData = response.data;
        const notificacionesArray = Object.keys(responseData)
          .filter((key) => key !== "unread")
          .map((key) => responseData[key]);
        setNotificaciones(notificacionesArray);
      } else {
        setError("No se encontraron notificaciones");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      await fetchWithAuth("app-notifications-mark-all-read");
      fetchNotificaciones();
    } catch (err) {
      console.error(
        "Error marcando todas las notificaciones como leídas:",
        err,
      );
    }
  }

  function showMenu() {
    Alert.alert(
      "Notificaciones",
      null,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Marcar todas como leídas",
          onPress: markAllAsRead,
        },
      ],
      { cancelable: true },
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, padding: 16, paddingBottom: 0 }}
      className="bg-background"
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Notificaciones</Text>
        <TouchableOpacity onPress={showMenu}>
          <MaterialIcons name="more-vert" size={28} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={async () => {
              try {
                // Marcar como leída según el tipo
                if (item.type === "communication") {
                  await fetchWithAuth("app-communication-mark-read", {
                    communication_id: item.communication_id,
                  });
                } else {
                  await fetchWithAuth("app-notification-mark-read", {
                    notification_id: item.id,
                  });
                }
              } catch (err) {
                console.error(
                  "Error marcando la notificación como leída:",
                  err,
                );
              }

              // Navegar según el tipo de notificación
              if (item.type === "communication") {
                router.push("/(app)/tabs/asesorias/comunicaciones");
              } else if (item.type === "appointment" && item.appointment_id) {
                router.push(`/(app)/tabs/asesorias/cita/${item.appointment_id}`);
              } else if (item.type === "general_chat") {
                router.push("/(app)/tabs/asesorias/tu-asesor");
              } else if (item.type === "invoice") {
                router.push("/(app)/tabs/asesorias/facturas");
              } else if (item.request_id) {
                router.push(
                  `/(app)/tabs/mis-solicitudes/solicitud?id=${item.request_id}`,
                );
              }
              // Si no hay tipo reconocido, no navegar
            }}
          >
            <View className={`mb-3 bg-white rounded-xl px-5 py-4`}>
              <Text
                style={[
                  { fontSize: 18 },
                  item.status === 0 && { fontWeight: "600" },
                  item.status === 1 && { fontWeight: "400", color: "#888" },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  item.status === 0 && { fontWeight: "600" },
                  item.status === 1 && { fontWeight: "400", color: "#888" },
                ]}
              >
                {item.description}
              </Text>
              <Text style={{ fontSize: 12, color: "#888" }}>
                {item.time_from}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
