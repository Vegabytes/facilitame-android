/**
 * Pantalla de detalle de cita con chat
 */
/* global setTimeout */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../../utils/api";

const STATUS_CONFIG = {
  solicitado: {
    label: "Pendiente",
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: "⏳",
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

export default function CitaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const flatListRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  const loadAppointment = useCallback(async () => {
    try {
      const response = await fetchWithAuth("app-appointment-detail", {
        appointment_id: id,
      });
      if (response?.status === "ok") {
        setAppointment(response.data?.appointment || null);
        setMessages(response.data?.messages || []);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo cargar la cita");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [loadAppointment]),
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (showChat && flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, showChat]);

  const formatDate = (dateString) => {
    if (!dateString) return "Por definir";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const handleConfirm = async () => {
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
                  appointment_id: id,
                },
              );
              if (response?.status === "ok") {
                Alert.alert("Éxito", "Cita confirmada correctamente");
                loadAppointment();
              } else {
                Alert.alert(
                  "Error",
                  response?.message_html || "No se pudo confirmar",
                );
              }
            } catch (_error) {
              Alert.alert("Error", "No se pudo confirmar la cita");
            }
          },
        },
      ],
    );
  };

  const handleCancel = async () => {
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
                  appointment_id: id,
                  cancellation_reason: "Cancelado por el cliente desde la app",
                },
              );
              if (response?.status === "ok") {
                Alert.alert("Cita cancelada", "La cita ha sido cancelada");
                loadAppointment();
              } else {
                Alert.alert(
                  "Error",
                  response?.message_html || "No se pudo cancelar",
                );
              }
            } catch (_error) {
              Alert.alert("Error", "No se pudo cancelar la cita");
            }
          },
        },
      ],
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const response = await fetchWithAuth("customer-appointment-chat-send", {
        appointment_id: id,
        message: messageText,
      });

      if (response?.status === "ok") {
        // Add message locally for instant feedback
        setMessages((prev) => [
          ...prev,
          {
            id: response.data?.message_id || Date.now(),
            sender_type: "customer",
            content: messageText,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        Alert.alert("Error", "No se pudo enviar el mensaje");
        setNewMessage(messageText);
      }
    } catch (_error) {
      Alert.alert("Error", "Error de conexión");
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(
    ({ item, index }) => {
      const isCustomer = item.sender_type === "customer";
      const showDate =
        index === 0 ||
        formatMessageDate(messages[index - 1]?.created_at) !==
          formatMessageDate(item.created_at);

      return (
        <View>
          {showDate && (
            <View className="items-center my-3">
              <Text className="text-gray-400 text-xs bg-gray-100 px-3 py-1 rounded-full">
                {formatMessageDate(item.created_at)}
              </Text>
            </View>
          )}
          <View
            className={`mb-2 max-w-[80%] ${
              isCustomer ? "self-end ml-auto" : "self-start mr-auto"
            }`}
          >
            <View
              className={`p-3 rounded-2xl ${
                isCustomer
                  ? "bg-primary rounded-br-sm"
                  : "bg-white rounded-bl-sm"
              }`}
            >
              <Text className={isCustomer ? "text-white" : "text-gray-800"}>
                {item.content}
              </Text>
            </View>
            <Text
              className={`text-xs text-gray-400 mt-1 ${
                isCustomer ? "text-right" : "text-left"
              }`}
            >
              {formatMessageTime(item.created_at)}
            </Text>
          </View>
        </View>
      );
    },
    [messages],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-gray-500 text-center">Cita no encontrada</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig =
    STATUS_CONFIG[appointment.status] || STATUS_CONFIG.solicitado;
  const needsConfirmation = appointment.needs_confirmation_from === "customer";
  const displayDate = appointment.scheduled_date || appointment.proposed_date;
  const isActive =
    appointment.status === "solicitado" || appointment.status === "agendado";

  // Chat view
  if (showChat) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-background"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Chat Header */}
        <View className="bg-white p-4 flex-row items-center border-b border-gray-100">
          <TouchableOpacity
            onPress={() => setShowChat(false)}
            className="mr-3"
            accessibilityLabel="Volver a detalles"
            accessibilityRole="button"
          >
            <Text className="text-primary text-lg">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="font-bold text-lg">Chat de la cita</Text>
            <Text className="text-gray-500 text-sm">
              {appointment.advisory_name}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-5xl mb-4">💬</Text>
              <Text className="text-gray-500 text-center">
                No hay mensajes todavía
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Envía un mensaje para comunicarte con la asesoría
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View className="bg-white p-3 flex-row items-end border-t border-gray-100">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-2 max-h-24"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={5000}
            accessibilityLabel="Mensaje"
          />
          <TouchableOpacity
            className={`p-3 rounded-full ${
              newMessage.trim() && !sending ? "bg-primary" : "bg-gray-200"
            }`}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            accessibilityLabel="Enviar mensaje"
            accessibilityRole="button"
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-bold">➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Detail view
  return (
    <ScrollView ref={scrollViewRef} className="flex-1 bg-background">
      <View className="p-5">
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4"
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Text className="text-primary text-lg">← Volver</Text>
        </TouchableOpacity>

        {/* Status Card */}
        <View className="bg-white p-5 rounded-2xl mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View
              className={`px-4 py-2 rounded-full flex-row items-center ${statusConfig.bg}`}
            >
              <Text className="mr-2">{statusConfig.icon}</Text>
              <Text className={`font-bold ${statusConfig.text}`}>
                {statusConfig.label}
              </Text>
            </View>
            <Text className="text-gray-400 text-sm">#{appointment.id}</Text>
          </View>

          {/* Alert for confirmation needed */}
          {needsConfirmation && appointment.status === "solicitado" && (
            <View className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
              <Text className="text-amber-800 font-bold mb-1">
                ⚠️ Pendiente de tu confirmación
              </Text>
              <Text className="text-amber-700">
                La asesoría ha propuesto una fecha. Por favor, confirma o
                contacta para solicitar cambio.
              </Text>
            </View>
          )}

          {/* Date & Time */}
          <View className="flex-row items-start mb-4">
            <Text className="text-3xl mr-3">📅</Text>
            <View className="flex-1">
              <Text className="font-bold text-xl">
                {formatDate(displayDate)}
              </Text>
              {appointment.proposed_by === "advisory" &&
                appointment.status === "solicitado" && (
                  <Text className="text-gray-500 text-sm mt-1">
                    Propuesta por la asesoría
                  </Text>
                )}
              {appointment.proposed_by === "customer" &&
                appointment.status === "solicitado" && (
                  <Text className="text-gray-500 text-sm mt-1">
                    Propuesta por ti • Pendiente de confirmación
                  </Text>
                )}
            </View>
          </View>

          {/* Type & Department */}
          <View className="flex-row gap-2 mb-4">
            <View className="bg-gray-100 px-3 py-2 rounded-lg">
              <Text className="text-gray-700">
                {TYPE_LABELS[appointment.type] || appointment.type}
              </Text>
            </View>
            <View className="bg-gray-100 px-3 py-2 rounded-lg">
              <Text className="text-gray-700">
                {DEPT_LABELS[appointment.department] || appointment.department}
              </Text>
            </View>
          </View>

          {/* Advisory */}
          <View className="flex-row items-center">
            <Text className="text-gray-500">Asesoría: </Text>
            <Text className="font-semibold">{appointment.advisory_name}</Text>
          </View>
        </View>

        {/* Reason */}
        {appointment.reason && (
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-2">Motivo de la cita</Text>
            <Text className="text-gray-700">{appointment.reason}</Text>
          </View>
        )}

        {/* Notes from advisory */}
        {appointment.notes_advisory && (
          <View className="bg-blue-50 p-4 rounded-xl mb-4">
            <Text className="text-blue-800 font-semibold mb-1">
              📝 Notas de la asesoría
            </Text>
            <Text className="text-blue-700">{appointment.notes_advisory}</Text>
          </View>
        )}

        {/* Cancellation reason */}
        {appointment.status === "cancelado" &&
          appointment.cancellation_reason && (
            <View className="bg-red-50 p-4 rounded-xl mb-4">
              <Text className="text-red-800 font-semibold mb-1">
                Motivo de cancelación
              </Text>
              <Text className="text-red-700">
                {appointment.cancellation_reason}
              </Text>
              {appointment.cancelled_by && (
                <Text className="text-red-600 text-sm mt-1">
                  Cancelado por:{" "}
                  {appointment.cancelled_by === "customer"
                    ? "Cliente"
                    : "Asesoría"}
                </Text>
              )}
            </View>
          )}

        {/* Chat Button */}
        <TouchableOpacity
          className="bg-white p-5 rounded-2xl mb-4 flex-row items-center"
          onPress={() => setShowChat(true)}
          accessibilityLabel="Abrir chat"
          accessibilityRole="button"
        >
          <View className="bg-purple-100 p-3 rounded-full mr-4">
            <Text className="text-2xl">💬</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-lg">Chat con la asesoría</Text>
            <Text className="text-gray-500">
              {messages.length > 0
                ? `${messages.length} mensaje(s)`
                : "Sin mensajes"}
            </Text>
          </View>
          <Text className="text-primary text-xl">›</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        {needsConfirmation && appointment.status === "solicitado" && (
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 bg-green-500 p-4 rounded-xl"
              onPress={handleConfirm}
              accessibilityLabel="Confirmar cita"
              accessibilityRole="button"
            >
              <Text className="text-white text-center font-bold text-lg">
                ✓ Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isActive && !needsConfirmation && (
          <TouchableOpacity
            className="bg-red-100 p-4 rounded-xl mb-4"
            onPress={handleCancel}
            accessibilityLabel="Cancelar cita"
            accessibilityRole="button"
          >
            <Text className="text-red-600 text-center font-semibold">
              Cancelar cita
            </Text>
          </TouchableOpacity>
        )}

        {isActive && needsConfirmation && (
          <TouchableOpacity
            className="bg-gray-100 p-4 rounded-xl mb-4"
            onPress={handleCancel}
            accessibilityLabel="Cancelar cita"
            accessibilityRole="button"
          >
            <Text className="text-gray-600 text-center font-semibold">
              Cancelar cita
            </Text>
          </TouchableOpacity>
        )}

        {/* Created date */}
        <View className="items-center py-4">
          <Text className="text-gray-400 text-sm">
            Solicitud creada el{" "}
            {new Date(appointment.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        <View className="h-10" />
      </View>
    </ScrollView>
  );
}
