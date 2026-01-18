/**
 * Pantalla de información de la asesoría vinculada
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";

export default function InfoAsesoria() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [stats, setStats] = useState(null);
  const [unlinking, setUnlinking] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const loadAdvisoryInfo = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-user-advisory",
        {},
        { silent: true },
      );
      if (response?.status === "ok" && response.data?.has_advisory) {
        setAdvisory(response.data.advisory);
        setStats(response.data.stats);
      } else {
        Alert.alert("Error", "No tienes asesoría vinculada");
        router.back();
      }
    } catch (_error) {
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadAdvisoryInfo();
    }, [loadAdvisoryInfo]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdvisoryInfo();
  }, [loadAdvisoryInfo]);

  const handleCall = () => {
    if (advisory?.phone) {
      Linking.openURL(`tel:${advisory.phone}`);
    }
  };

  const handleEmail = () => {
    if (advisory?.email) {
      Linking.openURL(`mailto:${advisory.email}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getClientTypeLabel = (type) => {
    const labels = {
      autonomo: "Autónomo",
      empresa: "Empresa",
      particular: "Particular",
    };
    return labels[type] || type;
  };

  const getPlanLabel = (plan) => {
    const labels = {
      basico: "Plan Básico",
      profesional: "Plan Profesional",
      premium: "Plan Premium",
    };
    return labels[plan] || plan || "Plan estándar";
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const response = await fetchWithAuth("app-unlink-advisory", {});
      if (response?.status === "ok") {
        setShowUnlinkModal(false);
        Alert.alert(
          "Desvinculado",
          "Te has desvinculado de la asesoría correctamente",
          [{ text: "OK", onPress: () => router.replace("/tabs/asesorias") }],
        );
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo desvincular");
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
      </View>
    );
  }

  if (!advisory) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-gray-500 text-center">
          No se encontró información de la asesoría
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-5">
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4"
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Text className="text-button text-lg font-semibold">← Volver</Text>
        </TouchableOpacity>

        {/* Card Principal */}
        <View className="bg-white p-6 rounded-2xl mb-5">
          <View className="items-center mb-4">
            <View className="bg-primary/10 w-20 h-20 rounded-full items-center justify-center mb-3">
              <Text className="text-4xl">🏢</Text>
            </View>
            <Text className="text-2xl font-bold text-center">
              {advisory.name}
            </Text>
            <View className="bg-green-100 px-3 py-1 rounded-full mt-2">
              <Text className="text-green-700 font-medium">Vinculada</Text>
            </View>
          </View>

          {/* Plan */}
          <View className="bg-gray-50 p-3 rounded-xl mb-4">
            <Text className="text-gray-500 text-center text-sm">Tu plan</Text>
            <Text className="text-center font-bold text-lg">
              {getPlanLabel(advisory.plan)}
            </Text>
          </View>

          {/* Tipo de cliente */}
          {advisory.client_type && (
            <View className="flex-row items-center justify-center mb-4">
              <Text className="text-gray-500">Tipo de cliente: </Text>
              <Text className="font-semibold">
                {getClientTypeLabel(advisory.client_type)}
              </Text>
            </View>
          )}

          {/* Fecha de vinculación */}
          {advisory.linked_at && (
            <Text className="text-gray-400 text-center text-sm">
              Vinculado desde {formatDate(advisory.linked_at)}
            </Text>
          )}
        </View>

        {/* Contacto */}
        <Text className="text-lg font-bold mb-3">Contacto</Text>

        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          {/* Teléfono */}
          {advisory.phone && (
            <TouchableOpacity
              className="p-4 flex-row items-center border-b border-gray-100"
              onPress={handleCall}
              accessibilityLabel="Llamar a la asesoría"
              accessibilityRole="button"
            >
              <View className="bg-green-100 p-3 rounded-full mr-4">
                <Text className="text-xl">📞</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Teléfono</Text>
                <Text className="font-semibold text-lg">{advisory.phone}</Text>
              </View>
              <Text className="text-primary font-medium">Llamar</Text>
            </TouchableOpacity>
          )}

          {/* Email */}
          {advisory.email && (
            <TouchableOpacity
              className="p-4 flex-row items-center"
              onPress={handleEmail}
              accessibilityLabel="Enviar email a la asesoría"
              accessibilityRole="button"
            >
              <View className="bg-blue-100 p-3 rounded-full mr-4">
                <Text className="text-xl">✉️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">Email</Text>
                <Text className="font-semibold" numberOfLines={1}>
                  {advisory.email}
                </Text>
              </View>
              <Text className="text-primary font-medium">Escribir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Estadísticas */}
        {stats && (
          <>
            <Text className="text-lg font-bold mb-3">Resumen</Text>

            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 bg-white p-4 rounded-xl items-center">
                <Text className="text-3xl font-bold text-primary">
                  {stats.appointments_total || 0}
                </Text>
                <Text className="text-gray-500 text-sm text-center">
                  Citas totales
                </Text>
              </View>
              <View className="flex-1 bg-white p-4 rounded-xl items-center">
                <Text className="text-3xl font-bold text-amber-500">
                  {stats.appointments_pending || 0}
                </Text>
                <Text className="text-gray-500 text-sm text-center">
                  Pendientes
                </Text>
              </View>
              <View className="flex-1 bg-white p-4 rounded-xl items-center">
                <Text className="text-3xl font-bold text-green-500">
                  {stats.appointments_scheduled || 0}
                </Text>
                <Text className="text-gray-500 text-sm text-center">
                  Programadas
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Acciones rápidas */}
        <Text className="text-lg font-bold mb-3">Acciones rápidas</Text>

        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary p-4 rounded-xl flex-row items-center justify-center"
            onPress={() => router.push("/tabs/asesorias/nueva-cita")}
            accessibilityLabel="Solicitar cita"
            accessibilityRole="button"
          >
            <Text className="text-white font-bold text-lg">
              📅 Solicitar cita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white p-4 rounded-xl flex-row items-center justify-center"
            onPress={() => router.push("/tabs/asesorias/comunicaciones")}
            accessibilityLabel="Ver comunicaciones"
            accessibilityRole="button"
          >
            <Text className="text-gray-700 font-bold text-lg">
              📨 Ver comunicaciones
            </Text>
            {stats?.communications_unread > 0 && (
              <View className="bg-red-500 ml-2 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {stats.communications_unread}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Código de asesoría */}
        {advisory.code && (
          <View className="bg-gray-50 p-4 rounded-xl mt-5">
            <Text className="text-gray-500 text-center text-sm mb-1">
              Código de asesoría
            </Text>
            <Text className="text-center font-mono font-bold text-lg">
              {advisory.code}
            </Text>
          </View>
        )}

        {/* Desvincular */}
        <View className="mt-8">
          <TouchableOpacity
            className="border border-red-300 p-4 rounded-xl"
            onPress={() => setShowUnlinkModal(true)}
            accessibilityLabel="Desvincular asesoría"
            accessibilityRole="button"
          >
            <Text className="text-red-500 text-center font-medium">
              Desvincular asesoría
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </View>

      {/* Modal de confirmación desvincular */}
      <Modal
        visible={showUnlinkModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnlinkModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="bg-red-100 p-4 rounded-full mb-3">
                <Text className="text-3xl">⚠️</Text>
              </View>
              <Text className="text-xl font-bold text-center">
                ¿Desvincular asesoría?
              </Text>
            </View>

            <Text className="text-gray-600 text-center mb-6">
              Si te desvinculados de {advisory.name}, perderás acceso a las
              citas, comunicaciones y servicios de la asesoría.
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                className={`p-4 rounded-xl ${
                  unlinking ? "bg-red-300" : "bg-red-500"
                }`}
                onPress={handleUnlink}
                disabled={unlinking}
                accessibilityLabel="Confirmar desvincular"
                accessibilityRole="button"
              >
                {unlinking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-bold">
                    Sí, desvincular
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="p-4 rounded-xl bg-gray-100"
                onPress={() => setShowUnlinkModal(false)}
                disabled={unlinking}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
              >
                <Text className="text-gray-700 text-center font-medium">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
