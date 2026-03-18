/**
 * Pantalla de nóminas: ver nóminas + subir (solo asesoría)
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
import { API_URL } from "../../../../utils/constants";
import { getAuthToken } from "../../../../utils/storage";

const STATUS_CONFIG = {
  pendiente: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  procesada: { label: "Procesada", bg: "bg-blue-100", text: "text-blue-700" },
  pagada: { label: "Pagada", bg: "bg-green-100", text: "text-green-700" },
};

const MONTH_NAMES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function NominasScreen() {
  const router = useRouter();
  const { autoUpload } = useLocalSearchParams();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [autoUploadTriggered, setAutoUploadTriggered] = useState(false);

  // Upload state (solo para asesoria)
  const [canUpload, setCanUpload] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [ocrResults, setOcrResults] = useState({});
  const [ocrLoadingMap, setOcrLoadingMap] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const loadPayrolls = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-advisory-payrolls",
        {},
        { silent: true },
      );

      if (response?.status === "ok") {
        setPayrolls(response.data?.payrolls || []);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayrolls();
      // Check if user can upload (is advisory user)
      fetchWithAuth("app-user-advisory", {}, { silent: true }).then((res) => {
        if (res?.status === "ok") {
          setCanUpload(res.data?.is_advisory_user || false);
        }
      });
    }, [loadPayrolls]),
  );

  // Auto-open upload modal when coming from menu shortcut
  useEffect(() => {
    if (autoUpload === "true" && canUpload && !loading && !autoUploadTriggered) {
      setAutoUploadTriggered(true);
      setTimeout(() => {
        setModalVisible(true);
        setTimeout(() => showSourcePicker(), 300);
      }, 100);
    }
  }, [autoUpload, canUpload, loading, autoUploadTriggered]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPayrolls();
  }, [loadPayrolls]);

  const filteredPayrolls = useMemo(() => {
    if (filter === "all") return payrolls;
    return payrolls.filter((p) => p.status === filter);
  }, [payrolls, filter]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return parseFloat(amount).toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  const formatYearMonth = (ym) => {
    if (!ym) return "";
    const parts = ym.split("-");
    if (parts.length !== 2) return ym;
    const month = parseInt(parts[1], 10);
    return `${MONTH_NAMES[month] || parts[1]} ${parts[0]}`;
  };

  const openFile = async (payroll) => {
    if (!payroll.filename) {
      Alert.alert("Sin archivo", "Esta nómina no tiene archivo adjunto");
      return;
    }
    try {
      const token = await getAuthToken();
      const url = `${API_URL}/file-download?type=advisory_payroll&id=${payroll.id}&auth_token=${token}`;
      await Linking.openURL(url);
    } catch (_error) {
      Alert.alert("Error", "No se pudo abrir el archivo");
    }
  };

  const stats = useMemo(() => {
    const pendientes = payrolls.filter((p) => p.status === "pendiente").length;
    const procesadas = payrolls.filter((p) => p.status === "procesada").length;
    const pagadas = payrolls.filter((p) => p.status === "pagada").length;
    return { pendientes, procesadas, pagadas, total: payrolls.length };
  }, [payrolls]);

  const changePayrollStatus = useCallback(async (payrollId, currentStatus) => {
    const options = [
      { text: "Pendiente", value: "pendiente" },
      { text: "Procesada", value: "procesada" },
      { text: "Pagada", value: "pagada" },
    ].filter((o) => o.value !== currentStatus);

    const buttons = options.map((o) => ({
      text: o.text,
      onPress: async () => {
        try {
          const res = await fetchWithAuth("app-advisory-payroll-update-status", {
            payroll_id: payrollId,
            status: o.value,
          });
          if (res?.status === "ok") {
            loadPayrolls();
          } else {
            Alert.alert("Error", res?.message || "No se pudo actualizar");
          }
        } catch (_e) {
          Alert.alert("Error", "Error de conexión");
        }
      },
    }));
    buttons.push({ text: "Cancelar", style: "cancel" });
    Alert.alert("Cambiar estado", "Selecciona el nuevo estado", buttons);
  }, [loadPayrolls]);

  // --- Upload helpers ---
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

  const showSourcePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tomar foto", "Elegir de galería", "Seleccionar documento"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromCamera();
          else if (buttonIndex === 2) pickFromGallery();
          else if (buttonIndex === 3) pickDocument();
        },
      );
    } else {
      setSourceModalVisible(true);
    }
  };

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara para tomar fotos");
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
          name: `Nomina_${Date.now()}.jpg`,
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
        Alert.alert("Permiso denegado", "Necesitamos acceso a la galería para seleccionar fotos");
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
          name: asset.fileName || `Nomina_${Date.now()}_${index}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
        }));
        const allFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(allFiles);
        tryOcrDetection(allFiles);
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudieron seleccionar las imágenes");
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

  const tryOcrDetection = async (files) => {
    const ocrIndexes = [];
    files.forEach((f, i) => {
      if (isOcrCompatible(f) && !ocrResults[i] && !ocrLoadingMap[i]) ocrIndexes.push(i);
    });
    if (ocrIndexes.length === 0) return;

    // Mark as loading
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
            name: file.name || (isPdf ? "payroll.pdf" : "payroll.jpg"),
            type: file.mimeType || (isPdf ? "application/pdf" : "image/jpeg"),
          });
          const res = await fetchWithAuth("advisory-payroll-upload-ocr", fd, {
            silent: true,
          });
          if (res?.status === "ok" && res.data?.fields) {
            const f = res.data.fields;
            setOcrResults((prev) => ({
              ...prev,
              [idx]: {
                fields: f,
                validation: res.data.validation || null,
                matched_customer: res.data.matched_customer || null,
              },
            }));
          } else {
            setOcrResults((prev) => ({
              ...prev,
              [idx]: { fields: {}, validation: { status: "error" } },
            }));
          }
        } catch (_e) {
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

  const countOcrFields = (data) => {
    if (!data?.fields) return 0;
    const keys = ["employee_name", "company_nif", "salary_gross", "salary_net", "period_month"];
    return keys.filter((k) => data.fields[k]).length;
  };

  const renderPayrollOcrResult = (ocr) => {
    if (!ocr?.fields) return null;
    const fieldCount = countOcrFields(ocr);
    const isVerified = fieldCount >= 3;
    const isNone = fieldCount === 0;
    const bgColor = isNone ? "bg-red-50" : "bg-blue-50";

    const badgeColor = isVerified ? "#059669" : isNone ? "#ef4444" : "#d97706";
    const badgeText = isVerified ? "✓ Verificada" : isNone ? "✕ Sin datos detectados" : "⚠ Parcial";

    return (
      <View className={`p-2 rounded-lg ${bgColor}`}>
        {isVerified ? (
          <View>
            <Text className="text-gray-600 text-xs">
              {ocr.fields.employee_name || ""}
              {ocr.fields.company_nif ? ` · ${ocr.fields.company_nif}` : ""}
            </Text>
            {(ocr.fields.salary_net || ocr.fields.salary_gross) ? (
              <Text className="text-gray-600 text-xs mt-0.5">
                {ocr.fields.salary_net ? `Neto: ${parseFloat(ocr.fields.salary_net).toFixed(2)}€` : ""}
                {ocr.fields.salary_gross ? `${ocr.fields.salary_net ? " · " : ""}Bruto: ${parseFloat(ocr.fields.salary_gross).toFixed(2)}€` : ""}
              </Text>
            ) : null}
            {ocr.fields.period_month && ocr.fields.period_year ? (
              <Text className="text-gray-400 text-xs mt-0.5">
                {MONTH_NAMES[ocr.fields.period_month]} {ocr.fields.period_year}
              </Text>
            ) : null}
            {ocr.matched_customer ? (
              <Text className="text-primary text-xs font-medium mt-0.5">
                → {ocr.matched_customer.name} {ocr.matched_customer.lastname || ""}
              </Text>
            ) : null}
          </View>
        ) : (
          <View>
            {[
              { key: "employee_name", label: "Empleado" },
              { key: "company_nif", label: "NIF empresa" },
              { key: "salary_gross", label: "Salario bruto", format: (v) => `${parseFloat(v).toFixed(2)} €` },
              { key: "salary_net", label: "Salario neto", format: (v) => `${parseFloat(v).toFixed(2)} €` },
              { key: "period_month", label: "Periodo", format: (v, f) => f.period_year ? `${MONTH_NAMES[v]} ${f.period_year}` : MONTH_NAMES[v] },
            ].map(({ key, label, format }) => (
              <View key={key} className="flex-row items-center mb-0.5">
                <Text style={{ color: ocr.fields[key] ? "#059669" : "#ef4444", fontSize: 11 }}>
                  {ocr.fields[key] ? "✓" : "✗"}
                </Text>
                <Text className="text-xs ml-1" style={{ color: ocr.fields[key] ? "#374151" : "#9ca3af" }}>
                  {label}{ocr.fields[key] ? `: ${format ? format(ocr.fields[key], ocr.fields) : ocr.fields[key]}` : ""}
                </Text>
              </View>
            ))}
            {ocr.matched_customer ? (
              <Text className="text-primary text-xs font-medium mt-0.5">
                → {ocr.matched_customer.name} {ocr.matched_customer.lastname || ""}
              </Text>
            ) : null}
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

  const getCurrentYearMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const uploadPayrolls = async (skipOcrCheck, overrideFiles, overrideOcr) => {
    const files = overrideFiles || selectedFiles;
    const ocr = overrideOcr || ocrResults;

    if (files.length === 0) {
      Alert.alert("Error", "Selecciona al menos un archivo");
      return;
    }

    // Check files with poor OCR (< 2 fields or no OCR result)
    if (!skipOcrCheck) {
      const poorIndexes = [];
      const goodIndexes = [];
      files.forEach((file, idx) => {
        if (isOcrCompatible(file)) {
          if (!ocr[idx] || countOcrFields(ocr[idx]) < 2) {
            poorIndexes.push(idx);
          } else {
            goodIndexes.push(idx);
          }
        } else {
          goodIndexes.push(idx);
        }
      });

      if (poorIndexes.length > 0) {
        const poorNames = poorIndexes.map((i) => files[i].name);
        const goodCount = goodIndexes.length;

        const buttons = [{ text: "Volver", style: "cancel" }];

        if (goodCount > 0) {
          buttons.push({
            text: `Enviar ${goodCount} correcta${goodCount > 1 ? "s" : ""}`,
            onPress: () => {
              const newFiles = goodIndexes.map((i) => files[i]);
              const newOcr = {};
              goodIndexes.forEach((oldIdx, newIdx) => {
                if (ocr[oldIdx]) newOcr[newIdx] = ocr[oldIdx];
              });
              // Update UI state
              setSelectedFiles(newFiles);
              setOcrResults(newOcr);
              setOcrLoadingMap({});
              // Upload with filtered data directly (no stale closure)
              uploadPayrolls(true, newFiles, newOcr);
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

      files.forEach((file) => {
        formData.append("files[]", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        });
      });

      // Default year_month = current month
      formData.append("year_month", getCurrentYearMonth());

      // Send OCR data indexed by file position
      if (Object.keys(ocr).length > 0) {
        const ocrArray = {};
        const yearMonthMap = {};

        Object.entries(ocr).forEach(([idx, data]) => {
          ocrArray[idx] = {
            employee_name: data.fields.employee_name || null,
            company_nif: data.fields.company_nif || null,
            company_name: data.matched_customer
              ? `${data.matched_customer.name} ${data.matched_customer.lastname || ""}`.trim()
              : null,
            salary_gross: data.fields.salary_gross || null,
            salary_net: data.fields.salary_net || null,
            irpf: data.fields.irpf || null,
            period_month: data.fields.period_month || null,
            period_year: data.fields.period_year || null,
          };

          // Per-file year_month from OCR
          if (data.fields.period_year && data.fields.period_month) {
            yearMonthMap[idx] = `${data.fields.period_year}-${String(data.fields.period_month).padStart(2, "0")}`;
          }
        });

        formData.append("ocr_data", JSON.stringify(ocrArray));
        if (Object.keys(yearMonthMap).length > 0) {
          formData.append("year_month_map", JSON.stringify(yearMonthMap));
        }
      }

      const response = await fetchWithAuth("advisory-payroll-upload-bulk", formData, {});

      if (response?.status === "ok") {
        const data = response.data || {};
        const msg = `${data.matched || 0} asignadas, ${data.unmatched || 0} sin asignar`;
        Alert.alert("Nóminas subidas", msg);
        setModalVisible(false);
        setSelectedFiles([]);
        setOcrResults({});
        setOcrLoadingMap({});
        loadPayrolls();
      } else {
        Alert.alert("Error", response?.message || "No se pudieron subir las nóminas");
      }
    } catch (_error) {
      Alert.alert("Error", "No se pudieron enviar las nóminas");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setOcrResults((prev) => {
      const next = { ...prev };
      delete next[index];
      // Re-index results above removed index
      const reindexed = {};
      Object.entries(next).forEach(([k, v]) => {
        const ki = parseInt(k, 10);
        reindexed[ki > index ? ki - 1 : ki] = v;
      });
      return reindexed;
    });
    setOcrLoadingMap((prev) => {
      const next = { ...prev };
      delete next[index];
      const reindexed = {};
      Object.entries(next).forEach(([k, v]) => {
        const ki = parseInt(k, 10);
        reindexed[ki > index ? ki - 1 : ki] = v;
      });
      return reindexed;
    });
  };

  // --- Render ---
  const renderPayroll = useCallback(
    ({ item }) => {
      const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pendiente;

      return (
        <TouchableOpacity
          className={`bg-white p-4 rounded-xl mb-3 border-l-4 ${
            item.status === "pagada"
              ? "border-green-500"
              : item.status === "procesada"
                ? "border-blue-500"
                : "border-amber-500"
          }`}
          onPress={() => openFile(item)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="font-bold text-base" numberOfLines={1}>
                {item.employee_name}
              </Text>
              <Text className="text-primary text-sm font-medium">
                {formatYearMonth(item.year_month)}
              </Text>
            </View>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${statusConf.bg}`}
              onPress={() => changePayrollStatus(item.id, item.status)}
            >
              <Text className={`text-xs font-medium ${statusConf.text}`}>
                {statusConf.label} ▾
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              {item.salary_gross > 0 && (
                <View>
                  <Text className="text-gray-400 text-xs">Bruto</Text>
                  <Text className="text-gray-700 text-sm font-medium">
                    {formatCurrency(item.salary_gross)}
                  </Text>
                </View>
              )}
              {item.salary_net > 0 && (
                <View>
                  <Text className="text-gray-400 text-xs">Neto</Text>
                  <Text className="text-green-600 text-sm font-bold">
                    {formatCurrency(item.salary_net)}
                  </Text>
                </View>
              )}
            </View>
            {item.filename && (
              <Text className="text-gray-400 text-xs">📄 PDF</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [changePayrollStatus],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const ListHeaderComponent = useMemo(
    () => (
      <View className="mb-4">
        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-amber-500">
              {stats.pendientes}
            </Text>
            <Text className="text-gray-500 text-xs">Pendientes</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-blue-500">
              {stats.procesadas}
            </Text>
            <Text className="text-gray-500 text-xs">Procesadas</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-green-500">
              {stats.pagadas}
            </Text>
            <Text className="text-gray-500 text-xs">Pagadas</Text>
          </View>
        </View>

        {/* Filtros */}
        <View className="flex-row mb-4 gap-2">
          {[
            { key: "all", label: "Todas" },
            { key: "pendiente", label: "Pendientes" },
            { key: "pagada", label: "Pagadas" },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              className={`px-4 py-2 rounded-full ${
                filter === f.key ? "bg-primary" : "bg-white"
              }`}
              onPress={() => setFilter(f.key)}
            >
              <Text
                className={`font-medium ${
                  filter === f.key ? "text-white" : "text-gray-600"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
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
          <Text className="text-button text-lg font-semibold">← Volver</Text>
        </TouchableOpacity>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-extrabold text-button">
            Nóminas
          </Text>
          {canUpload && (
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-full"
              onPress={() => {
                setModalVisible(true);
                setTimeout(() => showSourcePicker(), 300);
              }}
            >
              <Text className="text-white font-semibold">+ Subir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredPayrolls}
        renderItem={renderPayroll}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">💰</Text>
            <Text className="text-gray-500 text-center text-lg">
              No hay nóminas registradas
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-6">
              {canUpload
                ? "Pulsa '+ Subir' para añadir nóminas"
                : "Tu asesoría añadirá aquí tus nóminas mensuales"}
            </Text>
          </View>
        }
      />

      {/* Modal upload */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (!uploading) {
            setModalVisible(false);
            setSelectedFiles([]);
            setOcrResults({});
            setOcrLoadingMap({});
          }
        }}
      >
        <View className="flex-1 bg-background">
          <ScrollView className="flex-1 p-5">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <TouchableOpacity
                onPress={() => {
                  if (!uploading) {
                    setModalVisible(false);
                    setSelectedFiles([]);
                    setOcrResults({});
                    setOcrLoadingMap({});
                  }
                }}
              >
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold">Subir Nóminas</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Drop zone */}
            <TouchableOpacity
              className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-2xl p-8 items-center mb-5"
              onPress={showSourcePicker}
              activeOpacity={0.7}
            >
              <Text className="text-4xl mb-2">📎</Text>
              <Text className="text-base font-semibold text-gray-600">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} archivo(s) seleccionado(s)`
                  : "Seleccionar archivos"}
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Cámara, galería o documento
              </Text>
            </TouchableOpacity>

            {/* File cards with OCR */}
            {selectedFiles.length > 0 && (
              <View className="mb-5" style={{ maxHeight: 350 }}>
                <ScrollView nestedScrollEnabled={true}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} className="bg-white p-3 rounded-xl mb-2">
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
                        <Text className="flex-1 text-gray-600 text-sm" numberOfLines={1}>
                          {file.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeFile(index)}
                          accessibilityLabel="Eliminar archivo"
                        >
                          <Text className="text-red-500">✕</Text>
                        </TouchableOpacity>
                      </View>

                      {/* OCR loading */}
                      {ocrLoadingMap[index] && (
                        <View className="bg-blue-50 p-2 rounded-lg flex-row items-center">
                          <ActivityIndicator size="small" color="#30D4D1" />
                          <Text className="ml-2 text-gray-500 text-xs">Analizando...</Text>
                        </View>
                      )}

                      {/* OCR result */}
                      {ocrResults[index] && !ocrLoadingMap[index] && renderPayrollOcrResult(ocrResults[index])}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Upload button */}
            <TouchableOpacity
              className={`p-4 rounded-xl items-center ${
                uploading || selectedFiles.length === 0 || Object.values(ocrLoadingMap).some(Boolean)
                  ? "bg-gray-300"
                  : "bg-primary"
              }`}
              onPress={() => uploadPayrolls(false)}
              disabled={uploading || selectedFiles.length === 0 || Object.values(ocrLoadingMap).some(Boolean)}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : Object.values(ocrLoadingMap).some(Boolean) ? (
                <Text className="text-gray-500 font-bold text-lg">
                  Analizando nóminas...
                </Text>
              ) : (
                <Text className="text-white font-bold text-lg">
                  Subir nóminas
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal selección de fuente (Android) */}
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
                <Text className="text-gray-500 text-sm">Usar la cámara</Text>
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
                <Text className="font-semibold">Elegir de galería</Text>
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

      {/* Modal preview imagen */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/90 items-center justify-center"
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{
                width: Dimensions.get("window").width - 40,
                height: Dimensions.get("window").height * 0.7,
              }}
              resizeMode="contain"
            />
          )}
          <Text className="text-white/70 text-sm mt-4">Toca para cerrar</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
