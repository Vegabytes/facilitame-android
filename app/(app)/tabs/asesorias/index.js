/**
 * Pantalla principal de Asesorías
 * Muestra opciones si tiene asesoría vinculada, o formulario para vincular
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";

export default function AsesoriasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAdvisory, setHasAdvisory] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);

  const loadAdvisoryData = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-user-advisory",
        {},
        { silent: true },
      );

      if (__DEV__) {
        console.log("[Asesorias] Response:", JSON.stringify(response, null, 2));
      }

      if (response?.status === "ok") {
        setHasAdvisory(response.data?.has_advisory || false);
        setAdvisory(response.data?.advisory || null);
        setStats(response.data?.stats || null);
        setNextAppointment(response.data?.next_appointment || null);
      } else if (__DEV__) {
        console.log("[Asesorias] Response status not ok:", response?.status);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[Asesorias] Error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdvisoryData();
    }, [loadAdvisoryData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdvisoryData();
  }, [loadAdvisoryData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDepartmentLabel = (dept) => {
    const labels = {
      contabilidad: "Contabilidad",
      fiscalidad: "Fiscalidad",
      laboral: "Laboral",
      gestion: "Gestión",
    };
    return labels[dept] || dept;
  };

  const getTypeLabel = (type) => {
    const labels = {
      llamada: "Llamada",
      reunion_presencial: "Presencial",
      reunion_virtual: "Videollamada",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
      </View>
    );
  }

  // Si NO tiene asesoría vinculada
  if (!hasAdvisory) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="my-5">
            <Text className="text-2xl font-extrabold">Asesorías</Text>
          </View>

          {/* Card vincular */}
          <TouchableOpacity
            className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-primary mb-4"
            onPress={() => router.push("/tabs/asesorias/vincular")}
            accessibilityLabel="Vincular asesoría"
            accessibilityRole="button"
          >
            <View className="h-16 w-16 rounded-full border-2 border-white bg-primary flex items-center justify-center overflow-hidden">
              <Text className="text-3xl">🔗</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-white">
                Vincula tu asesoría
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                Introduce el código de tu asesor
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info card */}
          <View className="w-full h-auto m-0 p-5 rounded-2xl bg-white">
            <Text className="text-base font-extrabold mb-2">
              ¿No tienes código?
            </Text>
            <Text className="text-gray-600">
              Contacta con tu asesoría y solicita tu código de vinculación. El
              código tiene el formato ASE-XXXXXXXXX.
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    );
  }

  // Si TIENE asesoría vinculada - Nuevo diseño según mockup
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header con nombre de asesoría */}
        <View className="px-5 pt-5 pb-3">
          <Text className="text-2xl font-extrabold text-button text-center">
            {advisory?.name || "Mi Asesoría"}
          </Text>
        </View>

        {/* 4 botones superiores en fila */}
        <View className="flex-row justify-around px-4 py-4">
          {/* Facturas */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/tabs/asesorias/facturas")}
            accessibilityLabel="Facturas"
            accessibilityRole="button"
          >
            <View className="bg-primary w-16 h-16 rounded-full items-center justify-center">
              <Text className="text-2xl">📄</Text>
            </View>
            <Text className="mt-2 text-sm font-medium">Facturas</Text>
          </TouchableOpacity>

          {/* Citas */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/tabs/asesorias/citas")}
            accessibilityLabel="Citas"
            accessibilityRole="button"
          >
            <View className="bg-primary w-16 h-16 rounded-full items-center justify-center">
              <Text className="text-2xl">📅</Text>
            </View>
            <Text className="mt-2 text-sm font-medium">Citas</Text>
            {stats?.appointments_needs_confirmation > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {stats.appointments_needs_confirmation}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Comunicados */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/tabs/asesorias/comunicaciones")}
            accessibilityLabel="Comunicados"
            accessibilityRole="button"
          >
            <View className="bg-primary w-16 h-16 rounded-full items-center justify-center">
              <Text className="text-2xl">📨</Text>
            </View>
            <Text className="mt-2 text-sm font-medium">Comunicados</Text>
            {stats?.communications_unread > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {stats.communications_unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            className="items-center"
            onPress={() => router.push("/tabs/asesorias/nueva-cita")}
            accessibilityLabel="Chat"
            accessibilityRole="button"
          >
            <View className="bg-primary w-16 h-16 rounded-full items-center justify-center">
              <Text className="text-2xl">💬</Text>
            </View>
            <Text className="mt-2 text-sm font-medium">Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Botón grande central - Enviar Factura */}
        <View className="flex-1 items-center justify-center px-5 py-10">
          <TouchableOpacity
            className="bg-primary w-40 h-40 rounded-full items-center justify-center shadow-lg"
            onPress={() => router.push("/tabs/asesorias/facturas")}
            accessibilityLabel="Enviar Factura"
            accessibilityRole="button"
            style={{
              shadowColor: "#30D4D1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-xl font-bold text-center">
              Enviar{"\n"}Factura
            </Text>
          </TouchableOpacity>
        </View>

        {/* Próxima cita (si existe) - Mostrar en la parte inferior */}
        {nextAppointment && (
          <TouchableOpacity
            className="mx-5 mb-5 bg-button p-4 rounded-xl"
            onPress={() =>
              router.push(`/tabs/asesorias/cita/${nextAppointment.id}`)
            }
            accessibilityLabel="Ver próxima cita"
            accessibilityRole="button"
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 p-2 rounded-full mr-3">
                <Text className="text-xl">📅</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-xs">Próxima cita</Text>
                <Text className="text-white font-bold">
                  {formatDate(nextAppointment.scheduled_date)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Link a info de asesoría */}
        <TouchableOpacity
          className="mx-5 mb-5 py-3"
          onPress={() => router.push("/tabs/asesorias/info")}
          accessibilityLabel="Ver información de mi asesoría"
          accessibilityRole="button"
        >
          <Text className="text-primary text-center font-medium">
            Ver información de mi asesoría
          </Text>
        </TouchableOpacity>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
