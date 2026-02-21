/**
 * Pantalla de facturas: enviadas a la asesoría + facturas emitidas
 * Dos pestañas: "Enviadas" (documentos subidos) y "Emitidas" (facturas creadas)
 */

import { useState, useCallback, useMemo, useEffect } from "react";
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
  TextInput,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
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

const STATUS_CONFIG = {
  borrador: { label: "Borrador", bg: "bg-gray-100", text: "text-gray-700" },
  emitida: { label: "Emitida", bg: "bg-blue-100", text: "text-blue-700" },
  pagada: { label: "Pagada", bg: "bg-green-100", text: "text-green-700" },
  anulada: { label: "Anulada", bg: "bg-red-100", text: "text-red-700" },
};

export default function FacturasScreen() {
  const router = useRouter();
  const { autoUpload } = useLocalSearchParams();

  // Tab: "enviadas" o "emitidas"
  const [activeTab, setActiveTab] = useState("enviadas");

  // --- Enviadas (documentos subidos) ---
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoUploadTriggered, setAutoUploadTriggered] = useState(false);
  const [autoUploadLoading, setAutoUploadLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("gasto");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [customNames, setCustomNames] = useState({});

  // --- Emitidas (facturas creadas) ---
  const [issuedInvoices, setIssuedInvoices] = useState([]);
  const [issuedLoading, setIssuedLoading] = useState(false);
  const [issuedStats, setIssuedStats] = useState(null);
  const [issuedFilter, setIssuedFilter] = useState("all");

  // Load enviadas
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

  // Load emitidas
  const loadIssuedInvoices = useCallback(async () => {
    setIssuedLoading(true);
    try {
      const params = { limit: 50 };
      if (issuedFilter !== "all") {
        params.status = issuedFilter;
      }

      const response = await fetchWithAuth("app-advisory-issued-invoices", params, {
        silent: true,
      });

      if (response?.status === "ok") {
        setIssuedInvoices(response.data?.invoices || []);
        setIssuedStats(response.data?.stats || null);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setIssuedLoading(false);
    }
  }, [issuedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
      loadIssuedInvoices();
    }, [loadInvoices, loadIssuedInvoices]),
  );

  // Auto-abrir modal de envío si viene con autoUpload=true
  useEffect(() => {
    if (autoUpload === "true" && canSend && !loading && !autoUploadTriggered) {
      setAutoUploadTriggered(true);
      setTimeout(() => {
        setModalVisible(true);
        setTimeout(() => {
          showSourcePicker();
        }, 300);
      }, 100);
    }
  }, [autoUpload, canSend, loading, autoUploadTriggered]);

  const pickDocumentAuto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        multiple: true,
        copyToCacheDirectory: true,
      });

      setAutoUploadLoading(false);

      if (!result.canceled && result.assets) {
        setSelectedFiles(result.assets);
        setModalVisible(true);
      }
    } catch (_error) {
      setAutoUploadLoading(false);
      Alert.alert("Error", "No se pudieron seleccionar los archivos");
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === "enviadas") {
      loadInvoices();
    } else {
      loadIssuedInvoices().finally(() => setRefreshing(false));
    }
  }, [activeTab, loadInvoices, loadIssuedInvoices]);

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

  const showSourcePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tomar foto", "Elegir de galeria", "Seleccionar documento"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickFromCamera();
          } else if (buttonIndex === 2) {
            pickFromGallery();
          } else if (buttonIndex === 3) {
            pickDocument();
          }
        }
      );
    } else {
      setSourceModalVisible(true);
    }
  };

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a la camara para tomar fotos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          uri: asset.uri,
          name: `Factura_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a la galeria para seleccionar fotos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName || `Imagen_${Date.now()}_${index}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudieron seleccionar las imagenes");
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
        setSelectedFiles((prev) => [...prev, ...result.assets]);
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
        const displayName = customNames[index] || file.name;
        formData.append("custom_names[]", displayName);
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
        setCustomNames({});
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

  // Abrir PDF de factura emitida
  const openIssuedInvoicePdf = async (invoice) => {
    try {
      const token = await getAuthToken();
      const url = `${API_URL}/file-download?type=issued_invoice&id=${invoice.id}&auth_token=${token}`;
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert("Error", "No se pudo abrir el PDF de la factura");
    }
  };

  // Cambiar estado de factura (emitida → pagada/anulada)
  const changeInvoiceStatus = async (invoice, newStatus) => {
    const statusLabels = { pagada: "pagada", anulada: "anulada" };
    Alert.alert(
      "Cambiar estado",
      `Marcar factura ${invoice.invoice_number} como ${statusLabels[newStatus]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append("action", "update_status");
              formData.append("invoice_id", invoice.id);
              formData.append("status", newStatus);

              const response = await fetchWithAuth(
                "advisory-issued-invoice-emit",
                formData,
                { isFormData: true },
              );

              if (response?.status === "ok") {
                Alert.alert("Estado actualizado", response.message_plain || `Factura marcada como ${statusLabels[newStatus]}`);
                loadIssuedInvoices();
              } else {
                Alert.alert("Error", response?.message_plain || "No se pudo actualizar el estado");
              }
            } catch (_error) {
              Alert.alert("Error", "Error de conexion");
            }
          },
        },
      ]
    );
  };

  // Mostrar opciones al pulsar factura emitida
  const showIssuedInvoiceOptions = (invoice) => {
    if (invoice.status === "borrador") {
      emitDraft(invoice);
      return;
    }

    const options = ["Ver factura"];
    const actions = [() => openIssuedInvoicePdf(invoice)];

    if (invoice.status === "emitida") {
      options.push("Marcar como pagada");
      actions.push(() => changeInvoiceStatus(invoice, "pagada"));
    }

    if (invoice.status === "emitida" || invoice.status === "borrador") {
      options.push("Anular factura");
      actions.push(() => changeInvoiceStatus(invoice, "anulada"));
    }

    options.push("Cancelar");

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: options.indexOf("Anular factura"),
        },
        (buttonIndex) => {
          if (buttonIndex < actions.length) {
            actions[buttonIndex]();
          }
        }
      );
    } else {
      // Android: use Alert with buttons (max 3)
      const alertButtons = [];
      if (invoice.status === "emitida") {
        alertButtons.push({
          text: "Marcar pagada",
          onPress: () => changeInvoiceStatus(invoice, "pagada"),
        });
      }
      alertButtons.push({
        text: "Ver factura",
        onPress: () => openIssuedInvoicePdf(invoice),
      });
      alertButtons.push({ text: "Cerrar", style: "cancel" });

      Alert.alert(
        invoice.invoice_number || "Factura",
        `${invoice.client_name} - ${invoice.total_formatted}`,
        alertButtons,
      );
    }
  };

  // Emitir borrador
  const emitDraft = async (invoice) => {
    Alert.alert(
      "Emitir factura",
      `Emitir la factura por ${invoice.total_formatted} a ${invoice.client_name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Emitir",
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append("invoice_id", invoice.id);

              const response = await fetchWithAuth(
                "advisory-issued-invoice-emit",
                formData,
                { isFormData: true },
              );

              if (response?.status === "ok") {
                Alert.alert("Factura emitida", response.message_plain || "Factura emitida correctamente");
                loadIssuedInvoices();
              } else {
                Alert.alert("Error", response?.message_plain || "No se pudo emitir");
              }
            } catch (_error) {
              Alert.alert("Error", "Error de conexion");
            }
          },
        },
      ]
    );
  };

  // Render enviada (documento subido)
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

          {item.tag && TAGS[item.tag] && (
            <View className="bg-gray-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-gray-600">{TAGS[item.tag]}</Text>
            </View>
          )}

          {item.file_size > 0 && (
            <Text className="text-gray-400 text-xs">
              {formatFileSize(item.file_size)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  // Render emitida (factura creada)
  const renderIssuedInvoice = useCallback(({ item }) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.borrador;
    const isDraft = item.status === "borrador";

    return (
      <TouchableOpacity
        className={`bg-white p-4 rounded-xl mb-3 border-l-4 ${
          isDraft ? "border-gray-400" : item.status === "pagada" ? "border-green-500" : item.status === "anulada" ? "border-red-500" : "border-blue-500"
        }`}
        onPress={() => showIssuedInvoiceOptions(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Factura ${item.invoice_number}`}
        accessibilityRole="button"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="font-bold text-base" numberOfLines={1}>
              {isDraft ? "Borrador" : item.invoice_number}
            </Text>
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {item.client_name}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-bold text-base text-primary">
              {item.total_formatted}
            </Text>
            <Text className="text-gray-400 text-xs">
              {item.invoice_date_formatted}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          <View className={`px-2 py-1 rounded-full ${statusCfg.bg}`}>
            <Text className={`text-xs font-medium ${statusCfg.text}`}>
              {statusCfg.label}
            </Text>
          </View>

          {isDraft && (
            <Text className="text-primary text-xs font-medium">
              Pulsa para emitir
            </Text>
          )}

          {!isDraft && (
            <Text className="text-gray-400 text-xs font-medium">
              Pulsa para opciones
            </Text>
          )}

          {item.client_nif && (
            <Text className="text-gray-400 text-xs">{item.client_nif}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  const keyExtractor = useCallback((item) => item.id.toString(), []);
  const issuedKeyExtractor = useCallback((item) => `issued-${item.id}`, []);

  // Header for enviadas tab
  const EnviadasHeader = useMemo(
    () => (
      <View className="mb-4">
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

        <View className="flex-row mb-4 gap-2">
          {["all", "gasto", "ingreso"].map((f) => (
            <TouchableOpacity
              key={f}
              className={`px-4 py-2 rounded-full ${
                filter === f ? "bg-primary" : "bg-white"
              }`}
              onPress={() => setFilter(f)}
            >
              <Text
                className={`font-medium ${
                  filter === f ? "text-white" : "text-gray-600"
                }`}
              >
                {f === "all" ? "Todas" : f === "gasto" ? "Gastos" : "Ingresos"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [stats, filter],
  );

  // Header for emitidas tab
  const EmitidasHeader = useMemo(
    () => (
      <View className="mb-4">
        {issuedStats && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-primary">
                {issuedStats.total || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Total</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-gray-500">
                {issuedStats.borradores || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Borradores</Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl items-center">
              <Text className="text-2xl font-bold text-green-500">
                {issuedStats.pagadas || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Pagadas</Text>
            </View>
          </View>
        )}

        {issuedStats?.importe_total && (
          <View className="bg-white p-3 rounded-xl items-center mb-4">
            <Text className="text-gray-500 text-xs">Importe total</Text>
            <Text className="text-xl font-bold text-primary">
              {issuedStats.importe_total}
            </Text>
          </View>
        )}

        <View className="flex-row mb-4 gap-2 flex-wrap">
          {[
            { key: "all", label: "Todas" },
            { key: "borrador", label: "Borradores" },
            { key: "emitida", label: "Emitidas" },
            { key: "pagada", label: "Pagadas" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              className={`px-4 py-2 rounded-full ${
                issuedFilter === f.key ? "bg-primary" : "bg-white"
              }`}
              onPress={() => setIssuedFilter(f.key)}
            >
              <Text
                className={`font-medium ${
                  issuedFilter === f.key ? "text-white" : "text-gray-600"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [issuedStats, issuedFilter],
  );

  if (loading || autoUploadLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
        {autoUploadLoading && (
          <Text className="text-gray-500 mt-4">Abriendo selector de archivos...</Text>
        )}
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
          <Text className="text-2xl font-extrabold text-button">
            Mis Facturas
          </Text>
          {activeTab === "enviadas" && canSend && (
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-full"
              onPress={() => setModalVisible(true)}
              accessibilityLabel="Enviar factura"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">+ Enviar</Text>
            </TouchableOpacity>
          )}
          {activeTab === "emitidas" && (
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-full"
              onPress={() => router.push("/tabs/asesorias/emitir-factura")}
              accessibilityLabel="Nueva factura"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">+ Nueva</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-2">
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === "enviadas" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("enviadas")}
          >
            <Text
              className={`font-medium ${
                activeTab === "enviadas" ? "text-primary" : "text-gray-500"
              }`}
            >
              Enviadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === "emitidas" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("emitidas")}
          >
            <View className="flex-row items-center">
              <Text
                className={`font-medium ${
                  activeTab === "emitidas" ? "text-primary" : "text-gray-500"
                }`}
              >
                Emitidas
              </Text>
              {issuedStats?.borradores > 0 && (
                <View className="bg-amber-500 rounded-full px-1.5 py-0.5 ml-1.5">
                  <Text className="text-white text-[10px] font-bold">
                    {issuedStats.borradores}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab content: Enviadas */}
      {activeTab === "enviadas" && (
        <FlatList
          data={invoices}
          renderItem={renderInvoice}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={EnviadasHeader}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-5xl mb-4">📄</Text>
              <Text className="text-gray-500 text-center text-lg">
                {canSend
                  ? "No has enviado facturas aun"
                  : "El envio de facturas no esta disponible"}
              </Text>
              {canSend && (
                <TouchableOpacity
                  className="mt-4 bg-primary px-6 py-3 rounded-full"
                  onPress={() => setModalVisible(true)}
                >
                  <Text className="text-white font-semibold">
                    Enviar primera factura
                  </Text>
                </TouchableOpacity>
              )}
              {!canSend && (
                <Text className="text-gray-400 text-center mt-2 px-6">
                  Tu asesoria tiene el plan gratuito que no incluye esta funcion.
                  Contacta con ellos para mas informacion.
                </Text>
              )}
            </View>
          }
        />
      )}

      {/* Tab content: Emitidas */}
      {activeTab === "emitidas" && (
        <>
          {issuedLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#30D4D1" />
            </View>
          ) : (
            <FlatList
              data={issuedInvoices}
              renderItem={renderIssuedInvoice}
              keyExtractor={issuedKeyExtractor}
              contentContainerStyle={{ padding: 20, paddingTop: 10 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListHeaderComponent={EmitidasHeader}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Text className="text-5xl mb-4">🧾</Text>
                  <Text className="text-gray-500 text-center text-lg">
                    No has emitido facturas aun
                  </Text>
                  <TouchableOpacity
                    className="mt-4 bg-primary px-6 py-3 rounded-full"
                    onPress={() => router.push("/tabs/asesorias/emitir-factura")}
                  >
                    <Text className="text-white font-semibold">
                      Emitir primera factura
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </>
      )}

      {/* Modal enviar factura */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-background">
          <View className="bg-white p-4 border-b border-gray-100 flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedFiles([]);
                setCustomNames({});
              }}
              className="mr-3"
              accessibilityLabel="Cerrar"
              accessibilityRole="button"
            >
              <Text className="text-primary text-lg">✕</Text>
            </TouchableOpacity>
            <Text className="font-bold text-lg flex-1">Enviar Factura</Text>
          </View>

          <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-5"
              onPress={showSourcePicker}
              accessibilityLabel="Seleccionar archivos"
              accessibilityRole="button"
            >
              <View className="bg-primary/10 p-4 rounded-full mb-3">
                <Text className="text-3xl">📎</Text>
              </View>
              <Text className="font-semibold text-lg">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} archivo(s) seleccionado(s)`
                  : "Anadir archivos"}
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                Camara, galeria o documento
              </Text>
            </TouchableOpacity>

            {selectedFiles.length > 0 && (
              <View className="mb-5" style={{ maxHeight: 260 }}>
                <ScrollView nestedScrollEnabled={true}>
                  {selectedFiles.map((file, index) => (
                    <View
                      key={index}
                      className="bg-white p-3 rounded-xl mb-2"
                    >
                      <View className="flex-row items-center mb-2">
                        <Text className="text-xl mr-3">📄</Text>
                        <Text className="flex-1 text-gray-400 text-xs" numberOfLines={1}>
                          {file.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                            setCustomNames((prev) => {
                              const newNames = { ...prev };
                              delete newNames[index];
                              return newNames;
                            });
                          }}
                          accessibilityLabel="Eliminar archivo"
                          accessibilityRole="button"
                        >
                          <Text className="text-red-500">✕</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        className="bg-gray-100 p-2 rounded-lg text-gray-800"
                        placeholder="Nombre para mostrar"
                        placeholderTextColor="#999"
                        value={customNames[index] ?? file.name}
                        onChangeText={(text) => {
                          setCustomNames((prev) => ({
                            ...prev,
                            [index]: text,
                          }));
                        }}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="font-semibold mb-2">Tipo</Text>
            <View className="flex-row gap-3 mb-5">
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  selectedType === "gasto"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setSelectedType("gasto")}
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

            <Text className="font-semibold mb-2">Etiqueta (opcional)</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {Object.entries(TAGS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  className={`px-4 py-2 rounded-full ${
                    selectedTag === key ? "bg-primary" : "bg-white"
                  }`}
                  onPress={() => setSelectedTag(selectedTag === key ? "" : key)}
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

            <TouchableOpacity
              className={`p-4 rounded-xl items-center ${
                uploading || selectedFiles.length === 0
                  ? "bg-gray-300"
                  : "bg-primary"
              }`}
              onPress={uploadInvoice}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Enviar factura
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal seleccion de fuente (Android) */}
      <Modal
        visible={sourceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSourceModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setSourceModalVisible(false)}
        >
          <View className="bg-white rounded-t-3xl p-5 pb-10">
            <Text className="text-lg font-bold text-center mb-5">
              Seleccionar origen
            </Text>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() => {
                setSourceModalVisible(false);
                pickFromCamera();
              }}
            >
              <Text className="text-2xl mr-4">📷</Text>
              <View className="flex-1">
                <Text className="font-semibold">Tomar foto</Text>
                <Text className="text-gray-500 text-sm">Usar la camara</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() => {
                setSourceModalVisible(false);
                pickFromGallery();
              }}
            >
              <Text className="text-2xl mr-4">🖼️</Text>
              <View className="flex-1">
                <Text className="font-semibold">Elegir de galeria</Text>
                <Text className="text-gray-500 text-sm">Seleccionar fotos existentes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() => {
                setSourceModalVisible(false);
                pickDocument();
              }}
            >
              <Text className="text-2xl mr-4">📄</Text>
              <View className="flex-1">
                <Text className="font-semibold">Seleccionar documento</Text>
                <Text className="text-gray-500 text-sm">PDF u otros archivos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 items-center"
              onPress={() => setSourceModalVisible(false)}
            >
              <Text className="text-gray-500 font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
