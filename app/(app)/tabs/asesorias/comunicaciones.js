/**
 * Pantalla de lista de comunicaciones de la asesoría
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import { stripHtml } from "../../../../utils/constants";

const IMPORTANCE_CONFIG = {
  leve: {
    label: "Informativa",
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: "ℹ️",
  },
  media: {
    label: "Importante",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: "⚠️",
  },
  importante: {
    label: "Urgente",
    bg: "bg-red-100",
    text: "text-red-800",
    icon: "🚨",
  },
};

export default function ComunicacionesScreen() {
  const router = useRouter();
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedComm, setSelectedComm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Filtro de fechas
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null); // 'from' | 'to' | null
  const [showDateFilters, setShowDateFilters] = useState(false);

  const loadCommunications = useCallback(async () => {
    try {
      const params = { limit: 50, filter };
      if (dateFrom) {
        params.date_from = dateFrom.toISOString().split("T")[0];
      }
      if (dateTo) {
        params.date_to = dateTo.toISOString().split("T")[0];
      }
      const response = await fetchWithAuth("app-communications", params, {
        silent: true,
      });
      if (response?.status === "ok") {
        setCommunications(response.data?.communications || []);
        setUnreadCount(response.data?.unread_count || 0);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, dateFrom, dateTo]);

  useFocusEffect(
    useCallback(() => {
      loadCommunications();
    }, [loadCommunications]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCommunications();
  }, [loadCommunications]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Ayer";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("es-ES", { weekday: "long" });
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const openCommunication = async (comm) => {
    setSelectedComm(comm);
    setModalVisible(true);

    // Marcar como leída si no lo está
    if (!comm.is_read) {
      try {
        await fetchWithAuth(
          "app-communication-mark-read",
          { communication_id: comm.id },
          { silent: true },
        );
        // Actualizar lista local
        setCommunications((prev) =>
          prev.map((c) => (c.id === comm.id ? { ...c, is_read: true } : c)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (_error) {
        // Silenciar
      }
    }
  };

  const openAttachment = async (attachment) => {
    if (attachment.url) {
      try {
        await Linking.openURL(attachment.url);
      } catch (_error) {
        // Silenciar
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderCommunication = useCallback(({ item }) => {
    const importance =
      IMPORTANCE_CONFIG[item.importance] || IMPORTANCE_CONFIG.leve;
    const hasAttachments = item.attachments && item.attachments.length > 0;

    return (
      <TouchableOpacity
        className={`bg-white p-4 rounded-xl mb-3 ${
          !item.is_read ? "border-l-4 border-primary" : ""
        }`}
        onPress={() => openCommunication(item)}
        accessibilityLabel={`Comunicación: ${item.subject}`}
        accessibilityRole="button"
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text
              className={`font-bold text-base ${
                !item.is_read ? "text-gray-900" : "text-gray-700"
              }`}
              numberOfLines={2}
            >
              {item.subject}
            </Text>
          </View>
          <Text className="text-gray-400 text-xs">
            {formatDate(item.created_at)}
          </Text>
        </View>

        {/* Preview */}
        <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
          {stripHtml(item.message)}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View
            className={`px-2 py-1 rounded-full flex-row items-center ${importance.bg}`}
          >
            <Text className="mr-1">{importance.icon}</Text>
            <Text className={`text-xs font-medium ${importance.text}`}>
              {importance.label}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {hasAttachments && (
              <View className="flex-row items-center">
                <Text className="text-gray-400">📎</Text>
                <Text className="text-gray-400 text-xs ml-1">
                  {item.attachments.length}
                </Text>
              </View>
            )}
            {!item.is_read && (
              <View className="bg-primary w-2 h-2 rounded-full" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, []);

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
          <Text className="text-primary text-lg">← Volver</Text>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-extrabold text-button">
              Comunicaciones
            </Text>
            {unreadCount > 0 && (
              <Text className="text-gray-500">{unreadCount} sin leer</Text>
            )}
          </View>
        </View>

        {/* Filtros */}
        <View className="flex-row mb-4 gap-2">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === "all" ? "bg-primary" : "bg-white"
            }`}
            onPress={() => setFilter("all")}
            accessibilityLabel="Mostrar todas"
            accessibilityRole="button"
          >
            <Text
              className={`font-medium ${
                filter === "all" ? "text-white" : "text-gray-600"
              }`}
            >
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full flex-row items-center ${
              filter === "unread" ? "bg-primary" : "bg-white"
            }`}
            onPress={() => setFilter("unread")}
            accessibilityLabel="Mostrar no leídas"
            accessibilityRole="button"
          >
            <Text
              className={`font-medium ${
                filter === "unread" ? "text-white" : "text-gray-600"
              }`}
            >
              No leídas
            </Text>
            {unreadCount > 0 && filter !== "unread" && (
              <View className="bg-red-500 ml-2 px-2 py-0.5 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Botón filtro fechas */}
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              showDateFilters || dateFrom || dateTo ? "bg-primary" : "bg-white"
            }`}
            onPress={() => setShowDateFilters(!showDateFilters)}
            accessibilityLabel="Filtrar por fechas"
            accessibilityRole="button"
          >
            <Text
              className={`font-medium ${
                showDateFilters || dateFrom || dateTo
                  ? "text-white"
                  : "text-gray-600"
              }`}
            >
              📅 Fechas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de fecha expandibles */}
        {showDateFilters && (
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row gap-3">
              {/* Desde */}
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1">Desde</Text>
                <TouchableOpacity
                  className="bg-gray-100 p-3 rounded-lg"
                  onPress={() => setShowDatePicker("from")}
                >
                  <Text className={dateFrom ? "text-gray-900" : "text-gray-400"}>
                    {dateFrom
                      ? dateFrom.toLocaleDateString("es-ES")
                      : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Hasta */}
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1">Hasta</Text>
                <TouchableOpacity
                  className="bg-gray-100 p-3 rounded-lg"
                  onPress={() => setShowDatePicker("to")}
                >
                  <Text className={dateTo ? "text-gray-900" : "text-gray-400"}>
                    {dateTo
                      ? dateTo.toLocaleDateString("es-ES")
                      : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Limpiar filtros */}
            {(dateFrom || dateTo) && (
              <TouchableOpacity
                className="mt-3"
                onPress={() => {
                  setDateFrom(null);
                  setDateTo(null);
                }}
              >
                <Text className="text-primary text-center font-medium">
                  Limpiar filtros de fecha
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* DateTimePicker */}
        {showDatePicker && (
          <DateTimePicker
            value={
              showDatePicker === "from"
                ? dateFrom || new Date()
                : dateTo || new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setShowDatePicker(null);
              }
              if (event.type === "set" && selectedDate) {
                if (showDatePicker === "from") {
                  setDateFrom(selectedDate);
                } else {
                  setDateTo(selectedDate);
                }
              }
              if (Platform.OS === "ios") {
                setShowDatePicker(null);
              }
            }}
            maximumDate={new Date()}
          />
        )}
      </View>

      {/* Lista */}
      <FlatList
        data={communications}
        renderItem={renderCommunication}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">📨</Text>
            <Text className="text-gray-500 text-center text-lg">
              {filter === "unread"
                ? "No tienes comunicaciones sin leer"
                : "No hay comunicaciones"}
            </Text>
          </View>
        }
      />

      {/* Modal de detalle */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="bg-white p-4 border-b border-gray-100 flex-row items-center">
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mr-3"
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <Text className="text-primary text-lg">✕</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg flex-1">Comunicación</Text>
          </View>

          {selectedComm && (
            <ScrollView className="flex-1 p-5">
              {/* Importancia */}
              <View className="mb-4">
                {(() => {
                  const imp =
                    IMPORTANCE_CONFIG[selectedComm.importance] ||
                    IMPORTANCE_CONFIG.leve;
                  return (
                    <View
                      className={`px-3 py-1 rounded-full flex-row items-center self-start ${imp.bg}`}
                    >
                      <Text className="mr-1">{imp.icon}</Text>
                      <Text className={`font-medium ${imp.text}`}>
                        {imp.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Asunto */}
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                {selectedComm.subject}
              </Text>

              {/* Fecha */}
              <Text className="text-gray-500 mb-4">
                {new Date(selectedComm.created_at).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              {/* Mensaje */}
              <View className="bg-white p-4 rounded-xl mb-4">
                <Text className="text-gray-700 leading-6">
                  {stripHtml(selectedComm.message)}
                </Text>
              </View>

              {/* Adjuntos */}
              {selectedComm.attachments &&
                selectedComm.attachments.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-bold text-lg mb-3">
                      📎 Archivos adjuntos
                    </Text>
                    <View className="gap-2">
                      {selectedComm.attachments.map((att) => (
                        <TouchableOpacity
                          key={att.id}
                          className="bg-white p-4 rounded-xl flex-row items-center"
                          onPress={() => openAttachment(att)}
                          accessibilityLabel={`Abrir ${att.filename}`}
                          accessibilityRole="button"
                        >
                          <View className="bg-gray-100 p-2 rounded-lg mr-3">
                            <Text className="text-xl">📄</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-medium" numberOfLines={1}>
                              {att.filename}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                              {formatFileSize(att.filesize)}
                            </Text>
                          </View>
                          <Text className="text-primary">Abrir</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

              <View className="h-10" />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}
