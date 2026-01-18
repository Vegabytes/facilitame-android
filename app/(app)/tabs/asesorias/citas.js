/**
 * Pantalla de lista de citas con la asesoría
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";

const STATUS_CONFIG = {
  confirmar: {
    label: "Confirmar fecha",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: "⏳",
  },
  esperando: {
    label: "Esperando asesoría",
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: "⏱️",
  },
  agendado: {
    label: "Confirmada",
    bg: "bg-green-100",
    text: "text-green-800",
    icon: "✅",
  },
  finalizado: {
    label: "Completada",
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: "✔️",
  },
  cancelado: {
    label: "Cancelada",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: "❌",
  },
};

const TYPE_LABELS = {
  llamada: "📞 Llamada",
  reunion_presencial: "🏢 Presencial",
  reunion_virtual: "💻 Videollamada",
};

const DEPT_LABELS = {
  contabilidad: "Contabilidad",
  fiscalidad: "Fiscalidad",
  laboral: "Laboral",
  gestion: "Gestión",
};

export default function CitasScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("confirmar"); // Por defecto mostrar citas por confirmar

  const loadAppointments = useCallback(async () => {
    try {
      const body = { limit: 50 };
      if (filter) body.status = filter;

      const response = await fetchWithAuth("app-appointments", body, {
        silent: true,
      });
      if (response?.status === "ok") {
        setAppointments(response.data?.appointments || []);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAppointments();
  }, [loadAppointments]);

  const formatDate = (dateString) => {
    if (!dateString) return "Por definir";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirm = useCallback(
    (appointmentId) => {
      Alert.alert(
        "Confirmar cita",
        "¿Confirmas la fecha y hora propuesta por la asesoría?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                const response = await fetchWithAuth(
                  "customer-confirm-appointment",
                  {
                    appointment_id: appointmentId,
                  },
                );
                if (response?.status === "ok") {
                  Alert.alert("Éxito", "Cita confirmada correctamente");
                  loadAppointments();
                }
              } catch (_error) {
                Alert.alert("Error", "No se pudo confirmar la cita");
              }
            },
          },
        ],
      );
    },
    [loadAppointments],
  );

  const handleCancel = useCallback(
    (appointmentId) => {
      Alert.alert(
        "Cancelar cita",
        "¿Estás seguro de que quieres cancelar esta cita?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await fetchWithAuth(
                  "customer-cancel-appointment",
                  {
                    appointment_id: appointmentId,
                    cancellation_reason:
                      "Cancelado por el cliente desde la app",
                  },
                );
                if (response?.status === "ok") {
                  Alert.alert("Cita cancelada", "La cita ha sido cancelada");
                  loadAppointments();
                }
              } catch (_error) {
                Alert.alert("Error", "No se pudo cancelar la cita");
              }
            },
          },
        ],
      );
    },
    [loadAppointments],
  );

  const renderAppointment = useCallback(
    ({ item }) => {
      const needsConfirmation = item.needs_confirmation_from === "customer";

      // Determinar estado dinámico
      let displayStatus;
      if (item.status === "solicitado") {
        displayStatus = needsConfirmation ? "confirmar" : "esperando";
      } else {
        displayStatus = item.status;
      }

      const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.confirmar;
      const displayDate = item.scheduled_date || item.proposed_date;

      return (
        <TouchableOpacity
          className="bg-white p-4 rounded-xl mb-3 shadow-sm"
          onPress={() => router.push(`/tabs/asesorias/cita/${item.id}`)}
          accessibilityLabel={`Cita ${statusConfig.label}`}
          accessibilityRole="button"
        >
          {/* Header con estado */}
          <View className="flex-row items-center justify-between mb-3">
            <View
              className={`px-3 py-1 rounded-full flex-row items-center ${statusConfig.bg}`}
            >
              <Text className="mr-1">{statusConfig.icon}</Text>
              <Text className={`font-medium ${statusConfig.text}`}>
                {statusConfig.label}
              </Text>
            </View>
            {item.unread_messages > 0 && (
              <View className="bg-red-500 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {item.unread_messages} nuevo(s)
                </Text>
              </View>
            )}
          </View>

          {/* Alerta de confirmación pendiente */}
          {needsConfirmation && item.status === "solicitado" && (
            <View className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-3">
              <Text className="text-amber-800 font-medium">
                ⚠️ Pendiente de tu confirmación
              </Text>
              <Text className="text-amber-700 text-sm mt-1">
                La asesoría ha propuesto una fecha. Por favor, confirma o
                solicita cambio.
              </Text>
            </View>
          )}

          {/* Fecha y hora */}
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl mr-2">📅</Text>
            <View>
              <Text className="font-bold text-lg">
                {formatDate(displayDate)}
              </Text>
              {item.proposed_by === "advisory" &&
                item.status === "solicitado" && (
                  <Text className="text-gray-500 text-sm">
                    Propuesta por la asesoría
                  </Text>
                )}
            </View>
          </View>

          {/* Tipo y departamento */}
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-600">
              {TYPE_LABELS[item.type] || item.type} •{" "}
              {DEPT_LABELS[item.department] || item.department}
            </Text>
          </View>

          {/* Motivo (truncado) */}
          {item.reason && (
            <Text className="text-gray-500 text-sm" numberOfLines={2}>
              {item.reason}
            </Text>
          )}

          {/* Botones de acción */}
          {needsConfirmation && item.status === "solicitado" && (
            <View className="flex-row mt-3 gap-2">
              <TouchableOpacity
                className="flex-1 bg-green-500 p-3 rounded-lg"
                onPress={() => handleConfirm(item.id)}
                accessibilityLabel="Confirmar cita"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-semibold">
                  Confirmar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-200 p-3 rounded-lg"
                onPress={() => router.push(`/tabs/asesorias/cita/${item.id}`)}
                accessibilityLabel="Ver detalles"
                accessibilityRole="button"
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Ver detalles
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botón cancelar para citas activas */}
          {(item.status === "solicitado" || item.status === "agendado") &&
            !needsConfirmation && (
              <View className="flex-row mt-3 gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary p-3 rounded-lg"
                  onPress={() => router.push(`/tabs/asesorias/cita/${item.id}`)}
                  accessibilityLabel="Ver detalles"
                  accessibilityRole="button"
                >
                  <Text className="text-white text-center font-semibold">
                    Ver detalles
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-100 p-3 rounded-lg px-4"
                  onPress={() => handleCancel(item.id)}
                  accessibilityLabel="Cancelar cita"
                  accessibilityRole="button"
                >
                  <Text className="text-red-600 font-semibold">Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
        </TouchableOpacity>
      );
    },
    [router, handleConfirm, handleCancel],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="p-5 pb-0">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4"
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Text className="text-button text-lg font-semibold">← Volver</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-extrabold text-button">Mis citas</Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-full"
            onPress={() => router.push("/tabs/asesorias/nueva-cita")}
            accessibilityLabel="Nueva cita"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold">+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View className="flex-row mb-4 gap-2 flex-wrap">
          {[
            { value: "confirmar", label: "Por confirmar" },
            { value: "esperando_asesoria", label: "Esperando" },
            { value: "agendado", label: "Confirmadas" },
            { value: "finalizado", label: "Finalizadas" },
            { value: "cancelado", label: "Canceladas" },
          ].map((f) => (
            <TouchableOpacity
              key={f.value}
              className={`px-3 py-2 rounded-full ${
                filter === f.value ? "bg-primary" : "bg-white"
              }`}
              onPress={() => setFilter(f.value)}
              accessibilityLabel={`Filtrar por ${f.label}`}
              accessibilityRole="button"
            >
              <Text
                className={`font-medium ${
                  filter === f.value ? "text-white" : "text-gray-600"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">📅</Text>
            <Text className="text-gray-500 text-center text-lg">
              {filter === "confirmar"
                ? "No tienes citas por confirmar"
                : filter === "esperando_asesoria"
                ? "No tienes citas esperando respuesta"
                : filter === "agendado"
                ? "No tienes citas confirmadas"
                : filter === "finalizado"
                ? "No tienes citas finalizadas"
                : filter === "cancelado"
                ? "No tienes citas canceladas"
                : "No tienes citas"}
            </Text>
            <TouchableOpacity
              className="bg-primary px-6 py-3 rounded-full mt-4"
              onPress={() => router.push("/tabs/asesorias/nueva-cita")}
              accessibilityLabel="Solicitar primera cita"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">Solicitar cita</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
