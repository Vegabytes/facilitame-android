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
      if (response?.status === "ok") {
        setHasAdvisory(response.data?.has_advisory || false);
        setAdvisory(response.data?.advisory || null);
        setStats(response.data?.stats || null);
        setNextAppointment(response.data?.next_appointment || null);
      }
    } catch (_error) {
      // Silenciar error
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
        <View className="p-5">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-button">
              Asesorías
            </Text>
            <Text className="text-base text-gray-600 mt-2">
              Conecta con tu asesoría para gestionar citas y comunicaciones
            </Text>
          </View>

          {/* Card vincular */}
          <View className="bg-white p-6 rounded-2xl mb-5 shadow-sm">
            <View className="items-center mb-4">
              <View className="bg-primary/10 p-4 rounded-full mb-3">
                <Text className="text-4xl">🔗</Text>
              </View>
              <Text className="text-xl font-bold text-center">
                Vincula tu asesoría
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Introduce el código que te ha proporcionado tu asesor para
                acceder a todas las funcionalidades
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary p-4 rounded-xl flex-row items-center justify-center"
              onPress={() => router.push("/tabs/asesorias/vincular")}
              accessibilityLabel="Vincular asesoría"
              accessibilityRole="button"
            >
              <Text className="text-white font-bold text-lg">
                Vincular con código
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="bg-blue-50 p-4 rounded-xl">
            <Text className="text-blue-800 font-semibold mb-2">
              ¿No tienes código?
            </Text>
            <Text className="text-blue-700">
              Contacta con tu asesoría y solicita tu código de vinculación. El
              código tiene el formato ASE-XXXXXXXXX.
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    );
  }

  // Si TIENE asesoría vinculada
  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-5">
        {/* Header con nombre de asesoría */}
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-button">Asesorías</Text>
          <View className="flex-row items-center mt-2">
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-700 font-medium">
                {advisory?.name || "Asesoría vinculada"}
              </Text>
            </View>
          </View>
        </View>

        {/* Próxima cita (si existe) */}
        {nextAppointment && (
          <TouchableOpacity
            className="bg-primary p-5 rounded-2xl mb-5"
            onPress={() =>
              router.push(`/tabs/asesorias/cita/${nextAppointment.id}`)
            }
            accessibilityLabel="Ver próxima cita"
            accessibilityRole="button"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/80 text-sm">Próxima cita</Text>
                <Text className="text-white font-bold text-lg mt-1">
                  {formatDate(nextAppointment.scheduled_date)}
                </Text>
                <Text className="text-white/80 mt-1">
                  {getTypeLabel(nextAppointment.type)} •{" "}
                  {getDepartmentLabel(nextAppointment.department)}
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-full">
                <Text className="text-2xl">📅</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Alertas */}
        {stats?.appointments_needs_confirmation > 0 && (
          <TouchableOpacity
            className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/citas")}
            accessibilityLabel="Tienes citas pendientes de confirmar"
            accessibilityRole="button"
          >
            <Text className="text-2xl mr-3">⚠️</Text>
            <View className="flex-1">
              <Text className="text-amber-800 font-semibold">
                Citas pendientes de confirmar
              </Text>
              <Text className="text-amber-700">
                Tienes {stats.appointments_needs_confirmation} cita(s) esperando
                tu confirmación
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menú principal */}
        <Text className="text-lg font-bold mb-4">Gestiona tu asesoría</Text>

        <View className="gap-3">
          {/* Citas */}
          <TouchableOpacity
            className="bg-white p-5 rounded-xl flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/citas")}
            accessibilityLabel="Mis citas"
            accessibilityRole="button"
          >
            <View className="bg-blue-100 p-3 rounded-full mr-4">
              <Text className="text-2xl">📅</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg">Mis citas</Text>
              <Text className="text-gray-500">
                {stats?.appointments_scheduled > 0
                  ? `${stats.appointments_scheduled} cita(s) programada(s)`
                  : "Gestiona tus citas con la asesoría"}
              </Text>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>

          {/* Solicitar cita */}
          <TouchableOpacity
            className="bg-white p-5 rounded-xl flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/nueva-cita")}
            accessibilityLabel="Solicitar cita"
            accessibilityRole="button"
          >
            <View className="bg-green-100 p-3 rounded-full mr-4">
              <Text className="text-2xl">➕</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg">Solicitar cita</Text>
              <Text className="text-gray-500">
                Agenda una nueva cita con tu asesor
              </Text>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>

          {/* Comunicaciones */}
          <TouchableOpacity
            className="bg-white p-5 rounded-xl flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/comunicaciones")}
            accessibilityLabel="Comunicaciones"
            accessibilityRole="button"
          >
            <View className="bg-purple-100 p-3 rounded-full mr-4">
              <Text className="text-2xl">📨</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg">Comunicaciones</Text>
              <Text className="text-gray-500">
                {stats?.communications_unread > 0
                  ? `${stats.communications_unread} mensaje(s) sin leer`
                  : "Mensajes de tu asesoría"}
              </Text>
            </View>
            {stats?.communications_unread > 0 && (
              <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">
                  {stats.communications_unread}
                </Text>
              </View>
            )}
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>

          {/* Facturas */}
          <TouchableOpacity
            className="bg-white p-5 rounded-xl flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/facturas")}
            accessibilityLabel="Mis facturas"
            accessibilityRole="button"
          >
            <View className="bg-amber-100 p-3 rounded-full mr-4">
              <Text className="text-2xl">📄</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg">Mis facturas</Text>
              <Text className="text-gray-500">
                Envía facturas a tu asesoría
              </Text>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>

          {/* Info asesoría */}
          <TouchableOpacity
            className="bg-white p-5 rounded-xl flex-row items-center"
            onPress={() => router.push("/tabs/asesorias/info")}
            accessibilityLabel="Información de asesoría"
            accessibilityRole="button"
          >
            <View className="bg-gray-100 p-3 rounded-full mr-4">
              <Text className="text-2xl">ℹ️</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-lg">Mi asesoría</Text>
              <Text className="text-gray-500">
                Información y datos de contacto
              </Text>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </View>
    </ScrollView>
  );
}
