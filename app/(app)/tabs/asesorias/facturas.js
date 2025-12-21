/**
 * Pantalla de facturas enviadas a la asesoría
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { fetchWithAuth } from "../../../../utils/api";
import { API_URL } from "../../../../utils/constants";
import { getAuthToken } from "../../../../utils/storage";

const TAGS = {
  restaurante: "Restaurante",
  gasolina: "Gasolina",
  proveedores: "Proveedores",
  material_oficina: "Mat. oficina",
  viajes: "Viajes",
  servicios: "Servicios",
  otros: "Otros",
};

export default function FacturasScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("gasto");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);

  const loadInvoices = useCallback(async () => {
    try {
      const params = { limit: 50 };
      if (filter === "gasto" || filter === "ingreso") {
        params.type = filter;
      }

      const response = await fetchWithAuth("app-advisory-invoices", params, {
        silent: true,
      });

      if (response?.status === "ok") {
        setInvoices(response.data?.invoices || []);
        setCanSend(response.data?.can_send || false);
        setStats(response.data?.stats || null);
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
      loadInvoices();
    }, [loadInvoices]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvoices();
  }, [loadInvoices]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoy";
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

  const formatFileSize = (mb) => {
    if (!mb) return "";
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const openFile = async (invoice) => {
    try {
      const token = await getAuthToken();
      const url = `${API_URL}/file-download?type=advisory_invoice&id=${invoice.id}&auth_token=${token}`;
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert("Error", "No se pudo abrir el archivo");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles(result.assets);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudieron seleccionar los archivos");
    }
  };

  const uploadInvoice = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert("Error", "Selecciona al menos un archivo");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      selectedFiles.forEach((file, index) => {
        formData.append("invoice_file[]", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        });
      });

      formData.append("type", selectedType);
      if (selectedTag) {
        formData.append("tag", selectedTag);
      }

      const response = await fetchWithAuth(
        "advisory-upload-invoice",
        formData,
        {},
      );

      if (response?.status === "ok") {
        Alert.alert(
          "Enviado",
          response.message_html || "Factura(s) enviada(s) correctamente",
        );
        setModalVisible(false);
        setSelectedFiles([]);
        setSelectedType("gasto");
        setSelectedTag("");
        loadInvoices();
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo enviar la factura");
    } finally {
      setUploading(false);
    }
  };

  const renderInvoice = useCallback(({ item }) => {
    const isGasto = item.type === "gasto";

    return (
      <TouchableOpacity
        className={`bg-white p-4 rounded-xl mb-3 border-l-4 ${
          item.is_processed ? "border-green-500" : "border-amber-500"
        }`}
        onPress={() => openFile(item)}
        accessibilityLabel={`Factura: ${item.original_name}`}
        accessibilityRole="button"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="font-bold text-base" numberOfLines={1}>
              {item.original_name || item.filename}
            </Text>
          </View>
          <Text className="text-gray-400 text-xs">
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          {/* Tipo */}
          <View
            className={`px-2 py-1 rounded-full ${
              isGasto ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isGasto ? "text-red-700" : "text-green-700"
              }`}
            >
              {isGasto ? "Gasto" : "Ingreso"}
            </Text>
          </View>

          {/* Estado */}
          <View
            className={`px-2 py-1 rounded-full ${
              item.is_processed ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.is_processed ? "text-green-700" : "text-amber-700"
              }`}
            >
              {item.is_processed ? "Procesada" : "Pendiente"}
            </Text>
          </View>

          {/* Tag */}
          {item.tag && TAGS[item.tag] && (
            <View className="bg-gray-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-gray-600">{TAGS[item.tag]}</Text>
            </View>
          )}

          {/* Size */}
          {item.file_size > 0 && (
            <Text className="text-gray-400 text-xs">
              {formatFileSize(item.file_size)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const ListHeaderComponent = useMemo(
    () => (
      <View className="mb-4">
        {/* Stats */}
        {stats && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-primary">
                {stats.total || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Total</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-amber-500">
                {stats.pending || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Pendientes</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-green-500">
                {stats.processed || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Procesadas</Text>
            </View>
          </View>
        )}

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
            className={`px-4 py-2 rounded-full ${
              filter === "gasto" ? "bg-primary" : "bg-white"
            }`}
            onPress={() => setFilter("gasto")}
            accessibilityLabel="Mostrar gastos"
            accessibilityRole="button"
          >
            <Text
              className={`font-medium ${
                filter === "gasto" ? "text-white" : "text-gray-600"
              }`}
            >
              Gastos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filter === "ingreso" ? "bg-primary" : "bg-white"
            }`}
            onPress={() => setFilter("ingreso")}
            accessibilityLabel="Mostrar ingresos"
            accessibilityRole="button"
          >
            <Text
              className={`font-medium ${
                filter === "ingreso" ? "text-white" : "text-gray-600"
              }`}
            >
              Ingresos
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [stats, filter],
  );

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
          <Text className="text-2xl font-extrabold text-button">
            Mis Facturas
          </Text>
          {canSend && (
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-full"
              onPress={() => setModalVisible(true)}
              accessibilityLabel="Enviar factura"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">+ Enviar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">📄</Text>
            <Text className="text-gray-500 text-center text-lg">
              {canSend
                ? "No has enviado facturas aún"
                : "El envío de facturas no está disponible"}
            </Text>
            {canSend && (
              <TouchableOpacity
                className="mt-4 bg-primary px-6 py-3 rounded-full"
                onPress={() => setModalVisible(true)}
                accessibilityLabel="Enviar primera factura"
                accessibilityRole="button"
              >
                <Text className="text-white font-semibold">
                  Enviar primera factura
                </Text>
              </TouchableOpacity>
            )}
            {!canSend && (
              <Text className="text-gray-400 text-center mt-2 px-6">
                Tu asesoría tiene el plan gratuito que no incluye esta función.
                Contacta con ellos para más información.
              </Text>
            )}
          </View>
        }
      />

      {/* Modal enviar factura */}
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
              onPress={() => {
                setModalVisible(false);
                setSelectedFiles([]);
              }}
              className="mr-3"
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <Text className="text-primary text-lg">✕</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg flex-1">Enviar Factura</Text>
          </View>

          <View className="flex-1 p-5">
            {/* Selector de archivos */}
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-5"
              onPress={pickDocument}
              accessibilityLabel="Seleccionar archivos"
              accessibilityRole="button"
            >
              <View className="bg-primary/10 p-4 rounded-full mb-3">
                <Text className="text-3xl">📎</Text>
              </View>
              <Text className="font-semibold text-lg">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} archivo(s) seleccionado(s)`
                  : "Seleccionar archivos"}
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                PDF, JPG o PNG (máx. 10MB)
              </Text>
            </TouchableOpacity>

            {/* Archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <View className="mb-5">
                {selectedFiles.map((file, index) => (
                  <View
                    key={index}
                    className="bg-white p-3 rounded-xl mb-2 flex-row items-center"
                  >
                    <Text className="text-xl mr-3">📄</Text>
                    <Text className="flex-1" numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      accessibilityLabel="Eliminar archivo"
                      accessibilityRole="button"
                    >
                      <Text className="text-red-500">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Tipo */}
            <Text className="font-semibold mb-2">Tipo</Text>
            <View className="flex-row gap-3 mb-5">
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  selectedType === "gasto"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setSelectedType("gasto")}
                accessibilityLabel="Gasto"
                accessibilityRole="button"
              >
                <Text
                  className={`font-semibold ${
                    selectedType === "gasto" ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  ↓ Gasto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  selectedType === "ingreso"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setSelectedType("ingreso")}
                accessibilityLabel="Ingreso"
                accessibilityRole="button"
              >
                <Text
                  className={`font-semibold ${
                    selectedType === "ingreso"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  ↑ Ingreso
                </Text>
              </TouchableOpacity>
            </View>

            {/* Etiqueta */}
            <Text className="font-semibold mb-2">Etiqueta (opcional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {Object.entries(TAGS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  className={`px-4 py-2 rounded-full ${
                    selectedTag === key ? "bg-primary" : "bg-white"
                  }`}
                  onPress={() => setSelectedTag(selectedTag === key ? "" : key)}
                  accessibilityLabel={label}
                  accessibilityRole="button"
                >
                  <Text
                    className={`font-medium ${
                      selectedTag === key ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón enviar */}
            <TouchableOpacity
              className={`p-4 rounded-xl items-center ${
                uploading || selectedFiles.length === 0
                  ? "bg-gray-300"
                  : "bg-primary"
              }`}
              onPress={uploadInvoice}
              disabled={uploading || selectedFiles.length === 0}
              accessibilityLabel="Enviar factura"
              accessibilityRole="button"
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Enviar factura
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
