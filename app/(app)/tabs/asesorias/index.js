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
  Pressable,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";

// Opciones del menú de asesoría
const MENU_OPTIONS = [
  { id: "facturas", name: "Facturas", icon: "📄", route: "/tabs/asesorias/facturas" },
  { id: "citas", name: "Citas", icon: "📅", route: "/tabs/asesorias/citas", statKey: "appointments_needs_confirmation" },
  { id: "comunicados", name: "Comunicados", icon: "📨", route: "/tabs/asesorias/comunicaciones", statKey: "communications_unread" },
  { id: "nueva-cita", name: "Nueva cita", icon: "➕", route: "/tabs/asesorias/nueva-cita" },
  { id: "info", name: "Mi asesoría", icon: "ℹ️", route: "/tabs/asesorias/info" },
];

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
        <View className="px-6 py-4">
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

  // Si TIENE asesoría vinculada - Diseño tipo grid como Servicios
  return (
    <ScrollView
      className="bg-background py-4 px-6"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-column gap-5 mb-20">
        {/* Header */}
        <View className="my-5">
          <Text className="text-2xl font-extrabold">Asesorías</Text>
          <Text className="text-gray-600 mt-1">{advisory?.name}</Text>
        </View>

        {/* Próxima cita (si existe) */}
        {nextAppointment && (
          <TouchableOpacity
            className="w-full p-4 flex-row items-center gap-4 rounded-2xl bg-primary"
            onPress={() =>
              router.push(`/tabs/asesorias/cita/${nextAppointment.id}`)
            }
            accessibilityLabel="Ver próxima cita"
            accessibilityRole="button"
          >
            <View className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Text className="text-xl">📅</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/80 text-xs">Próxima cita</Text>
              <Text className="text-white font-bold">
                {formatDate(nextAppointment.scheduled_date)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Grid de opciones - estilo Servicios */}
        <View className="flex-row flex-wrap justify-between">
          {MENU_OPTIONS.map((option) => {
            const badgeCount = option.statKey ? stats?.[option.statKey] : 0;

            return (
              <Pressable
                key={option.id}
                className="flex flex-col items-center gap-3 w-24 mb-6"
                onPress={() => router.push(option.route)}
              >
                <View className="h-24 w-24 rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                  <Text className="text-4xl">{option.icon}</Text>
                  {badgeCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full items-center justify-center">
                      <Text className="text-white text-xs font-bold">
                        {badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="font-extrabold text-sm w-full text-center">
                  {option.name}
                </Text>
              </Pressable>
            );
          })}

          {/* Espaciadores para mantener el grid alineado */}
          {MENU_OPTIONS.length % 3 !== 0 &&
            Array(3 - (MENU_OPTIONS.length % 3))
              .fill(null)
              .map((_, idx) => (
                <View key={`empty-${idx}`} className="h-24 w-24" />
              ))}
        </View>
      </View>
    </ScrollView>
  );
}
