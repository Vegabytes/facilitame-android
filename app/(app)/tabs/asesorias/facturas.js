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
  TextInput,
  ScrollView,
  ActionSheetIOS,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { fetchWithAuth } from "../../../../utils/api";

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
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [customNames, setCustomNames] = useState({});
  const [ocrResults, setOcrResults] = useState({});
  const [ocrLoadingMap, setOcrLoadingMap] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  // --- Emitidas (facturas creadas) ---
  const [canEmit, setCanEmit] = useState(false);
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
      // Check emit permission
      fetchWithAuth("app-user-advisory", {}, { silent: true }).then((res) => {
        if (res?.status === "ok") {
          setCanEmit(res.data?.can_emit_invoices || false);
        }
      });
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

  const [previewLoading, setPreviewLoading] = useState(false);

  const openInvoicePreview = async (invoiceId, type) => {
    try {
      setPreviewLoading(true);
      const res = await fetchWithAuth("app-invoice-preview", {
        invoice_id: invoiceId,
        type,
      });
      if (res.status === "ok" && res.data?.html) {
        router.push({ pathname: "/webview", params: { html: res.data.html } });
      } else {
        Alert.alert("Error", res.message || "No se pudo cargar la factura");
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudo abrir la factura");
    } finally {
      setPreviewLoading(false);
    }
  };

  const openFile = async (invoice) => {
    openInvoicePreview(invoice.id, "advisory_invoice");
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
        const allFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(allFiles);
        tryOcrDetection(allFiles);
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
        const allFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(allFiles);
        tryOcrDetection(allFiles);
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
        const newFiles = [...selectedFiles, ...result.assets];
        setSelectedFiles(newFiles);
        tryOcrDetection(newFiles);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudieron seleccionar los archivos");
    }
  };

  const isImageFile = (f) =>
    f.mimeType === "image/jpeg" ||
    f.mimeType === "image/png" ||
    f.name?.endsWith(".jpg") ||
    f.name?.endsWith(".jpeg") ||
    f.name?.endsWith(".png");

  const isOcrCompatible = (f) =>
    f.mimeType === "application/pdf" ||
    isImageFile(f) ||
    f.name?.endsWith(".pdf");

  const tryOcrDetection = async (files) => {
    const ocrIndexes = [];
    files.forEach((f, i) => {
      if (isOcrCompatible(f)) ocrIndexes.push(i);
    });
    if (ocrIndexes.length === 0) {
      setOcrResults({});
      return;
    }
    // Mark all as loading
    setOcrLoadingMap((prev) => {
      const next = { ...prev };
      ocrIndexes.forEach((i) => { next[i] = true; });
      return next;
    });
    // Launch OCR calls in parallel
    await Promise.allSettled(
      ocrIndexes.map(async (idx) => {
        try {
          const file = files[idx];
          const isPdf = file.mimeType === "application/pdf" || file.name?.endsWith(".pdf");
          const fd = new FormData();
          fd.append("file", {
            uri: file.uri,
            name: file.name || (isPdf ? "invoice.pdf" : "invoice.jpg"),
            type: file.mimeType || (isPdf ? "application/pdf" : "image/jpeg"),
          });
          const res = await fetchWithAuth("advisory-invoice-upload-ocr", fd, {
            silent: true,
          });
          if (res?.status === "ok" && res.data?.fields) {
            const f = res.data.fields;
            console.log("[FACTURAS] OCR result idx=" + idx + " | docType=" + (f.document_type || "none") + " issuer=" + (f.issuer_name || "null") + " total=" + (f.total_amount || "null") + " nif=" + (f.issuer_nif || "null"));
            setOcrResults((prev) => ({
              ...prev,
              [idx]: { fields: f, validation: res.data.validation || null },
            }));
          } else {
            console.log("[FACTURAS] OCR failed for idx=" + idx + " | status=" + (res?.status || "null"));
            // OCR failed or returned no fields - mark as failed
            setOcrResults((prev) => ({
              ...prev,
              [idx]: { fields: {}, validation: { status: "error" } },
            }));
          }
        } catch (_e) {
          // OCR error - mark as failed
          setOcrResults((prev) => ({
            ...prev,
            [idx]: { fields: {}, validation: { status: "error" } },
          }));
        } finally {
          setOcrLoadingMap((prev) => ({ ...prev, [idx]: false }));
        }
      }),
    );
  };

  // Auto-detect document type from OCR results (only if user hasn't manually set it)
  useEffect(() => {
    if (selectedDocType) return; // user already chose
    const ocrKeys = Object.keys(ocrResults);
    if (ocrKeys.length === 0) return;
    // Use first file's OCR to suggest doc type
    const firstOcr = ocrResults[ocrKeys[0]];
    const dt = firstOcr?.fields?.document_type;
    if (dt === "factura") setSelectedDocType("factura");
    else if (dt === "factura_simplificada") setSelectedDocType("ticket");
    else if (dt === "recibo_tpv") setSelectedDocType("recibo_tpv");
  }, [ocrResults]);

  const countOcrFields = (data) => {
    if (!data?.fields) return 0;
    const keys = ['issuer_name', 'issuer_nif', 'total_amount', 'base_amount', 'iva_percent', 'invoice_number'];
    return keys.filter((k) => data.fields[k]).length;
  };

  const DOC_TYPE_LABELS = {
    factura: "Factura",
    factura_simplificada: "Factura simplificada (ticket)",
    recibo_tpv: "Recibo de TPV",
    otro: "Documento",
  };

  const renderOcrResult = (ocr) => {
    if (!ocr?.fields) return null;
    const fieldCount = countOcrFields(ocr);
    const docType = ocr.fields.document_type || null;
    const isTPV = docType === "recibo_tpv";
    const isApiError = ocr.validation?.status === "api_error" || ocr.validation?.status === "error";
    const isVerified = !isTPV && !isApiError && ocr.validation?.status === "ok";
    const isNone = !isTPV && !isApiError && fieldCount === 0;
    const bgColor = isApiError ? "bg-orange-50" : isTPV ? "bg-amber-50" : isNone ? "bg-red-50" : "bg-blue-50";

    const badgeColor = isApiError ? "#ea580c" : isTPV ? "#d97706" : isVerified ? "#059669" : isNone ? "#ef4444" : "#d97706";
    const badgeText = isApiError
      ? "⚠ Error al leer — vuelve a intentarlo"
      : isTPV
        ? "⚠ No es factura"
        : isVerified
          ? "✓ Verificada"
          : isNone
            ? "✕ Sin datos detectados"
            : "⚠ Parcial";

    return (
      <View className={`p-2 rounded-lg mt-2 ${bgColor}`}>
        {isApiError ? (
          <View>
            <Text className="text-orange-700 text-xs">
              No se pudo analizar esta imagen ahora mismo. Puedes volver a subir el archivo o enviarla tal cual.
            </Text>
          </View>
        ) : isTPV ? (
          <View>
            <Text className="text-amber-700 text-xs font-semibold mb-1">
              Recibo de pago con tarjeta (no es factura)
            </Text>
            {ocr.fields.issuer_name ? (
              <Text className="text-gray-600 text-xs">
                {ocr.fields.issuer_name}
                {ocr.fields.total_amount ? ` · ${parseFloat(ocr.fields.total_amount).toFixed(2)} €` : ""}
              </Text>
            ) : null}
            <Text className="text-amber-600 text-xs mt-1">
              Pide la factura al comercio para deducir el IVA
            </Text>
          </View>
        ) : isVerified ? (
          <View>
            {docType && docType !== "factura" ? (
              <Text className="text-gray-400 text-xs mb-0.5">{DOC_TYPE_LABELS[docType] || docType}</Text>
            ) : null}
            <Text className="text-gray-600 text-xs">
              {ocr.fields.issuer_name
                ? `${ocr.fields.issuer_name}${ocr.fields.issuer_nif ? ` (${ocr.fields.issuer_nif})` : ""}`
                : ""}
              {ocr.fields.total_amount
                ? `${ocr.fields.issuer_name ? " · " : ""}${parseFloat(ocr.fields.total_amount).toFixed(2)} EUR`
                : ""}
            </Text>
          </View>
        ) : (
          <View>
            {docType ? (
              <Text className="text-gray-400 text-xs mb-1">{DOC_TYPE_LABELS[docType] || docType}</Text>
            ) : null}
            {[
              { key: "issuer_name", label: "Emisor" },
              { key: "issuer_nif", label: "NIF emisor" },
              { key: "invoice_number", label: "Nº factura" },
              { key: "total_amount", label: "Total", format: (v) => `${parseFloat(v).toFixed(2)} €` },
              { key: "base_amount", label: "Base imponible", format: (v) => `${parseFloat(v).toFixed(2)} €` },
              { key: "iva_percent", label: "IVA", format: (v) => `${v}%` },
            ].map(({ key, label, format }) => (
              <View key={key} className="flex-row items-center mb-0.5">
                <Text style={{ color: ocr.fields[key] ? "#059669" : "#ef4444", fontSize: 11 }}>
                  {ocr.fields[key] ? "✓" : "✗"}
                </Text>
                <Text className="text-xs ml-1" style={{ color: ocr.fields[key] ? "#374151" : "#9ca3af" }}>
                  {label}{ocr.fields[key] ? `: ${format ? format(ocr.fields[key]) : ocr.fields[key]}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View className="flex-row items-center mt-1">
          <Text className="text-xs font-semibold" style={{ color: badgeColor }}>
            {badgeText}
          </Text>
        </View>
      </View>
    );
  };

  const uploadInvoice = async (skipOcrCheck, overrideFiles, overrideNames, overrideOcr) => {
    const files = overrideFiles || selectedFiles;
    const names = overrideNames || customNames;
    const ocr = overrideOcr || ocrResults;

    if (files.length === 0) {
      Alert.alert("Error", "Selecciona al menos un archivo");
      return;
    }

    // Verificar archivos con OCR pobre (menos de 2 campos detectados o sin OCR)
    if (!skipOcrCheck) {
      const poorIndexes = [];
      const goodIndexes = [];
      files.forEach((file, idx) => {
        if (isOcrCompatible(file)) {
          const isTPV = ocr[idx]?.fields?.document_type === "recibo_tpv";
          if (isTPV || !ocr[idx] || countOcrFields(ocr[idx]) < 2) {
            poorIndexes.push(idx);
          } else {
            goodIndexes.push(idx);
          }
        } else {
          goodIndexes.push(idx);
        }
      });

      if (poorIndexes.length > 0) {
        const poorNames = poorIndexes.map((i) => names[i] || files[i].name);
        const goodCount = goodIndexes.length;

        const buttons = [{ text: "Volver", style: "cancel" }];

        if (goodCount > 0) {
          buttons.push({
            text: `Enviar ${goodCount} correcta${goodCount > 1 ? "s" : ""}`,
            onPress: () => {
              // Build filtered data and upload directly (no stale closure)
              const newFiles = goodIndexes.map((i) => files[i]);
              const newNames = {};
              const newOcr = {};
              goodIndexes.forEach((oldIdx, newIdx) => {
                if (names[oldIdx]) newNames[newIdx] = names[oldIdx];
                if (ocr[oldIdx]) newOcr[newIdx] = ocr[oldIdx];
              });
              // Update UI state
              setSelectedFiles(newFiles);
              setCustomNames(newNames);
              setOcrResults(newOcr);
              setOcrLoadingMap({});
              // Upload with filtered data directly
              uploadInvoice(true, newFiles, newNames, newOcr);
            },
          });
        }

        Alert.alert(
          "Archivos con problemas",
          `${poorNames.join(", ")} no se ha${poorIndexes.length > 1 ? "n" : ""} podido leer correctamente.\n\n${
            goodCount > 0
              ? `Puedes enviar las ${goodCount} restante${goodCount > 1 ? "s" : ""} o volver para quitar/repetir las fotos.`
              : "Vuelve para quitar o repetir las fotos."
          }`,
          buttons,
        );
        return;
      }
    }
    setUploading(true);

    try {
      const formData = new FormData();

      files.forEach((file, index) => {
        formData.append("invoice_file[]", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        });
        const displayName = names[index] || file.name;
        formData.append("custom_names[]", displayName);
      });

      formData.append("type", selectedType);
      if (selectedDocType) {
        formData.append("document_type", selectedDocType);
      }
      if (selectedTag) {
        formData.append("tag", selectedTag);
      }

      // Enviar datos OCR por archivo (indexado por posición)
      if (Object.keys(ocr).length > 0) {
        const ocrArray = {};
        Object.entries(ocr).forEach(([idx, data]) => {
          ocrArray[idx] = {
            document_type: data.fields.document_type || null,
            issuer_name: data.fields.issuer_name || null,
            issuer_nif: data.fields.issuer_nif || null,
            total_amount: data.fields.total_amount || null,
            base_amount: data.fields.base_amount || null,
            iva_percent: data.fields.iva_percent || null,
            iva_amount: data.fields.iva_amount || null,
            invoice_number: data.fields.invoice_number || null,
            invoice_date: data.fields.invoice_date || null,
            validation_status: data.validation?.status || 'none',
          };
        });
        formData.append("ocr_data", JSON.stringify(ocrArray));
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
        setOcrResults({});
        setOcrLoadingMap({});
        setSelectedType("gasto");
        setSelectedDocType("");
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
    openInvoicePreview(invoice.id, "issued_invoice");
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
  }, [showIssuedInvoiceOptions]);

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
      {/* Loading overlay for invoice preview */}
      {previewLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 999, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#30D4D1" />
        </View>
      )}
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

        {/* Tabs - only show if canEmit */}
        {canEmit && (
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
        )}
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
                setOcrResults({});
                setOcrLoadingMap({});
                setSelectedDocType("");
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
                        {isImageFile(file) ? (
                          <TouchableOpacity onPress={() => setPreviewImage(file.uri)} className="mr-3">
                            <Image
                              source={{ uri: file.uri }}
                              style={{ width: 36, height: 36, borderRadius: 6 }}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        ) : (
                          <Text className="text-xl mr-3">📄</Text>
                        )}
                        <Text className="flex-1 text-gray-400 text-xs" numberOfLines={1}>
                          {file.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            const removed = index;
                            setSelectedFiles((prev) => prev.filter((_, i) => i !== removed));
                            const reindex = (prev) => {
                              const next = {};
                              Object.entries(prev).forEach(([k, v]) => {
                                const ki = parseInt(k, 10);
                                if (ki < removed) next[ki] = v;
                                else if (ki > removed) next[ki - 1] = v;
                              });
                              return next;
                            };
                            setCustomNames(reindex);
                            setOcrResults(reindex);
                            setOcrLoadingMap(reindex);
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
                      {/* Per-file OCR loading */}
                      {ocrLoadingMap[index] && (
                        <View className="bg-blue-50 p-2 rounded-lg mt-2 flex-row items-center">
                          <ActivityIndicator size="small" color="#30D4D1" />
                          <Text className="ml-2 text-gray-500 text-xs">Analizando...</Text>
                        </View>
                      )}
                      {/* Per-file OCR result */}
                      {ocrResults[index] && !ocrLoadingMap[index] && renderOcrResult(ocrResults[index])}
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

            <Text className="font-semibold mb-2">Documento</Text>
            <View className="flex-row gap-3 mb-5">
              {[
                { key: "factura", label: "Factura", border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600" },
                { key: "ticket", label: "Ticket", border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  className={`flex-1 p-4 rounded-xl border-2 items-center ${
                    selectedDocType === opt.key
                      ? `${opt.border} ${opt.bg}`
                      : "border-gray-200 bg-white"
                  }`}
                  onPress={() => setSelectedDocType(selectedDocType === opt.key ? "" : opt.key)}
                >
                  <Text
                    className={`font-semibold ${
                      selectedDocType === opt.key ? opt.text : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
                uploading || selectedFiles.length === 0 || Object.values(ocrLoadingMap).some(Boolean)
                  ? "bg-gray-300"
                  : "bg-primary"
              }`}
              onPress={() => uploadInvoice(false)}
              disabled={uploading || selectedFiles.length === 0 || Object.values(ocrLoadingMap).some(Boolean)}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : Object.values(ocrLoadingMap).some(Boolean) ? (
                <Text className="text-gray-500 font-bold text-lg">
                  Analizando facturas...
                </Text>
              ) : (
                <Text className="text-white font-bold text-lg">
                  Enviar factura
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Overlay preview imagen (dentro del modal para que funcione en iOS y Android) */}
          {!!previewImage && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setPreviewImage(null)}
            >
              <Image
                source={{ uri: previewImage }}
                style={{
                  width: Dimensions.get("window").width - 40,
                  height: Dimensions.get("window").height * 0.7,
                }}
                resizeMode="contain"
              />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 16 }}>Toca para cerrar</Text>
            </TouchableOpacity>
          )}
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
