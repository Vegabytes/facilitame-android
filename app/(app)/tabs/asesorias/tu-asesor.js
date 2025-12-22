/**
 * Pantalla de chat general con la asesoría
 * Permite comunicación bidireccional con envío de archivos PDF
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import { API_URL } from "../../../../utils/constants";
import { getAuthToken } from "../../../../utils/storage";

export default function TuAsesorScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-advisory-general-chat",
        {},
        { silent: true },
      );
      if (response?.status === "ok") {
        setAdvisory(response.data?.advisory || null);
        setMessages(response.data?.messages || []);
        setUnreadCount(response.data?.unread_count || 0);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages]),
  );

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const formData = new FormData();
      formData.append("message", messageText);

      if (selectedFile) {
        formData.append("file", {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || "application/pdf",
        });
      }

      const response = await fetchWithAuth(
        "app-advisory-general-chat-send",
        formData,
        {},
      );

      if (response?.status === "ok") {
        setSelectedFile(null);
        // Añadir mensaje localmente para feedback inmediato
        setMessages((prev) => [
          ...prev,
          {
            id: response.data?.message_id || Date.now(),
            sender_type: "customer",
            content: messageText,
            file_name: selectedFile?.name || null,
            file_url: response.data?.file_url || null,
            is_read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        Alert.alert(
          "Error",
          response?.message_html || "No se pudo enviar el mensaje",
        );
        setNewMessage(messageText);
      }
    } catch (_error) {
      Alert.alert("Error", "Error de conexión");
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const openFile = async (fileUrl) => {
    try {
      const token = await getAuthToken();
      const url = `${API_URL}/${fileUrl}${fileUrl.includes("?") ? "&" : "?"}auth_token=${token}`;
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert("Error", "No se pudo abrir el archivo");
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
              {item.content && (
                <Text className={isCustomer ? "text-white" : "text-gray-800"}>
                  {item.content}
                </Text>
              )}
              {item.file_name && (
                <TouchableOpacity
                  onPress={() => item.file_url && openFile(item.file_url)}
                  className={`mt-2 p-2 rounded-lg flex-row items-center ${
                    isCustomer ? "bg-white/20" : "bg-gray-100"
                  }`}
                >
                  <Text className="text-xl mr-2">
                    {item.file_name?.endsWith(".pdf") ? "📄" : "🖼️"}
                  </Text>
                  <Text
                    className={`flex-1 text-sm ${
                      isCustomer ? "text-white" : "text-gray-700"
                    }`}
                    numberOfLines={1}
                  >
                    {item.file_name}
                  </Text>
                </TouchableOpacity>
              )}
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

  if (!advisory) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-5">
        <Text className="text-5xl mb-4">🔗</Text>
        <Text className="text-gray-500 text-center text-lg mb-4">
          No tienes asesoría vinculada
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.push("/tabs/asesorias/vincular")}
        >
          <Text className="text-white font-semibold">Vincular asesoría</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View className="bg-white p-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3"
          accessibilityLabel="Volver"
          accessibilityRole="button"
        >
          <Text className="text-primary text-lg">←</Text>
        </TouchableOpacity>
        <View className="bg-primary p-2 rounded-full mr-3">
          <Text className="text-xl">🏢</Text>
        </View>
        <View className="flex-1">
          <Text className="font-bold text-lg">{advisory.name}</Text>
          <Text className="text-gray-500 text-sm">Tu asesor</Text>
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
            <Text className="text-gray-500 text-center text-lg">
              Comienza una conversación
            </Text>
            <Text className="text-gray-400 text-center text-sm mt-1 px-6">
              Envía mensajes y archivos directamente a tu asesoría
            </Text>
          </View>
        }
      />

      {/* Selected File Preview */}
      {selectedFile && (
        <View className="bg-white mx-4 mb-2 p-3 rounded-xl flex-row items-center">
          <Text className="text-xl mr-2">
            {selectedFile.name?.endsWith(".pdf") ? "📄" : "🖼️"}
          </Text>
          <Text className="flex-1" numberOfLines={1}>
            {selectedFile.name}
          </Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Text className="text-red-500 text-lg">✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message Input */}
      <View className="bg-white p-3 flex-row items-end border-t border-gray-100">
        <TouchableOpacity
          onPress={pickDocument}
          className="p-3 mr-2"
          accessibilityLabel="Adjuntar archivo"
          accessibilityRole="button"
        >
          <Text className="text-2xl">📎</Text>
        </TouchableOpacity>
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
            (newMessage.trim() || selectedFile) && !sending
              ? "bg-primary"
              : "bg-gray-200"
          }`}
          onPress={handleSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || sending}
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
