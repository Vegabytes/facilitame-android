/**
 * Pantalla para crear y emitir facturas a clientes (rol asesoría)
 * Soporta: seleccionar cliente existente, buscar guardados, o crear nuevo manualmente
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchWithAuth } from "../../../../utils/api";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const IVA_OPTIONS = [
  { value: 21, label: "21% (General)" },
  { value: 10, label: "10% (Reducido)" },
  { value: 4, label: "4% (Superreducido)" },
  { value: 0, label: "0% (Exento)" },
];

const IRPF_OPTIONS = [
  { value: 0, label: "Sin IRPF" },
  { value: 7, label: "7%" },
  { value: 15, label: "15%" },
  { value: 19, label: "19%" },
];

const emptyLine = () => ({
  description: "",
  quantity: "1",
  unit_price: "",
  tax_rate: "21",
});

export default function EmitirFacturaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isClientUser, setIsClientUser] = useState(false);

  // Client mode: 'select' or 'manual'
  const [clientMode, setClientMode] = useState("select");

  // Selected client (from picker)
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  // Manual client fields
  const [manualName, setManualName] = useState("");
  const [manualNif, setManualNif] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [saveClient, setSaveClient] = useState(true);

  // Form
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [irpfRate, setIrpfRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  // Series
  const [series, setSeries] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState(null);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [showSeriesPicker, setShowSeriesPicker] = useState(false);
  const [showNewSeriesModal, setShowNewSeriesModal] = useState(false);
  const [newSeriesPrefix, setNewSeriesPrefix] = useState("");
  const [newSeriesFormat, setNewSeriesFormat] = useState("{prefix}{number}");
  const [savingSeries, setSavingSeries] = useState(false);

  // Load clients (only for advisory users; clients skip this)
  useFocusEffect(
    useCallback(() => {
      const loadClients = async () => {
        try {
          const response = await fetchWithAuth(
            "app-advisory-clients-list",
            {},
            { silent: true },
          );
          if (response?.status === "ok") {
            setClients(response.data?.clients || []);
          } else if (response?.code === 403) {
            // User is a client, not an advisory - load saved invoice clients
            setIsClientUser(true);
            try {
              const icRes = await fetchWithAuth(
                "advisory-invoice-clients",
                { action: "list" },
                { silent: true },
              );
              if (icRes?.status === "ok" && icRes.data?.clients?.length > 0) {
                const formatted = icRes.data.clients.map((c) => ({
                  id: c.id,
                  type: "invoice_client",
                  name: c.name,
                  lastname: "",
                  full_name: c.name,
                  nif_cif: c.nif_cif || "",
                  email: c.email || "",
                  address: c.address || "",
                }));
                setClients(formatted);
                setClientMode("select");
              } else {
                setClientMode("manual");
              }
            } catch (_e) {
              setClientMode("manual");
            }
          }
        } catch (_error) {
          // silent
        } finally {
          setLoadingClients(false);
        }
      };
      loadClients();
      loadSeries();
    }, []),
  );

  // Load series (asesoría: todas; cliente: las suyas + generales)
  const loadSeries = async () => {
    setLoadingSeries(true);
    try {
      const fd = new FormData();
      fd.append("action", "list");
      const res = await fetchWithAuth(
        "advisory-invoice-series-manage",
        fd,
        { silent: true, isFormData: true },
      );
      if (res?.status === "ok" && Array.isArray(res.data?.series)) {
        setSeries(res.data.series);
        // Auto-seleccionar la primera serie general si hay alguna
        if (res.data.series.length > 0 && !selectedSeriesId) {
          const general = res.data.series.find((s) => !s.customer_id);
          setSelectedSeriesId(general ? general.id : res.data.series[0].id);
        }
      }
    } catch (_e) {
      // silent
    } finally {
      setLoadingSeries(false);
    }
  };

  // Crear nueva serie (asesoría o cliente)
  const handleCreateSeries = async () => {
    const prefix = newSeriesPrefix.trim().toUpperCase();
    if (!prefix) {
      Alert.alert("Falta el prefijo", "Indica un prefijo (ej: F, A, R)");
      return;
    }
    if (!/^[A-Z0-9\-]+$/.test(prefix)) {
      Alert.alert(
        "Prefijo no válido",
        "Solo se permiten letras, números y guiones",
      );
      return;
    }
    setSavingSeries(true);
    try {
      const fd = new FormData();
      fd.append("prefix", prefix);
      fd.append("format", newSeriesFormat.trim() || "{prefix}{number}");
      const res = await fetchWithAuth("advisory-invoice-series-manage", fd, {
        isFormData: true,
        silent: true,
      });
      if (res?.status === "ok") {
        const newId = res.data?.series_id;
        setShowNewSeriesModal(false);
        setNewSeriesPrefix("");
        setNewSeriesFormat("{prefix}{number}");
        await loadSeries();
        if (newId) setSelectedSeriesId(newId);
      } else {
        Alert.alert(
          "Error",
          res?.message_plain || "No se pudo crear la serie",
        );
      }
    } catch (_e) {
      Alert.alert("Error", "Error de conexión al crear la serie");
    } finally {
      setSavingSeries(false);
    }
  };

  // Line management
  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, emptyLine()]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Calculations
  const calcTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    lines.forEach((line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unit_price) || 0;
      const lineSubtotal = qty * price;
      const lineTaxRate = parseFloat(line.tax_rate) || 21;
      subtotal += lineSubtotal;
      taxAmount += lineSubtotal * (lineTaxRate / 100);
    });
    const taxRate = parseFloat(lines[0]?.tax_rate) || 21;
    const irpfAmount = subtotal * (irpfRate / 100);
    const total = subtotal + taxAmount - irpfAmount;
    return {
      subtotal: subtotal.toFixed(2),
      taxRate,
      taxAmount: taxAmount.toFixed(2),
      irpfAmount: irpfAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calcTotals();

  // Date handling
  const formatDisplayDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const onDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (date) setInvoiceDate(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const confirmDateIOS = () => {
    if (tempDate) setInvoiceDate(tempDate);
    setShowDatePicker(false);
    setTempDate(null);
  };

  const onDueDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDueDatePicker(false);
      if (date) setDueDate(date);
    } else {
      if (date) setTempDueDate(date);
    }
  };

  const confirmDueDateIOS = () => {
    if (tempDueDate) setDueDate(tempDueDate);
    setShowDueDatePicker(false);
    setTempDueDate(null);
  };

  const selectedSeries = series.find((s) => s.id === selectedSeriesId);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (clientMode === "select") {
      if (!selectedClient) newErrors.client = "Selecciona un cliente";
    } else {
      if (!manualName.trim()) newErrors.manualName = isClientUser
        ? "El nombre del destinatario es obligatorio"
        : "El nombre es obligatorio";
    }

    if (!invoiceDate) newErrors.date = "Selecciona una fecha";

    // Serie obligatoria: si hay series disponibles, seleccionar una; si no, crear.
    if (!selectedSeriesId && series.length > 0) {
      newErrors.series = "Selecciona una serie de facturación";
    } else if (!selectedSeriesId && series.length === 0) {
      newErrors.series = "Crea una serie antes de emitir (botón + Nueva)";
    }

    const hasValidLine = lines.some(
      (l) =>
        l.description.trim() &&
        parseFloat(l.unit_price) > 0 &&
        parseFloat(l.quantity) > 0,
    );
    if (!hasValidLine) newErrors.lines = "Añade al menos una línea con descripción y precio";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      Alert.alert("Revisa el formulario", firstError);
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async (emitAfterCreate) => {
    if (__DEV__) console.log("[EmitirFactura] handleSubmit", { emitAfterCreate, clientMode, isClientUser, selectedClient: selectedClient?.id });
    if (!validateForm()) return;

    setLoading(true);
    try {
      const year = invoiceDate.getFullYear();
      const month = String(invoiceDate.getMonth() + 1).padStart(2, "0");
      const day = String(invoiceDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const validLines = lines.filter(
        (l) => l.description.trim() && parseFloat(l.unit_price) > 0,
      );

      const formData = new FormData();

      // Client data depending on mode
      if (isClientUser && clientMode === "select" && selectedClient) {
        // Client user selected a saved contact
        formData.append("invoice_client_id", selectedClient.id);
        formData.append("client_name", selectedClient.full_name || "");
        formData.append("client_nif", selectedClient.nif_cif || "");
        if (selectedClient.address) {
          formData.append("client_address", selectedClient.address);
        }
      } else if (isClientUser) {
        // Client user manual entry
        formData.append("client_name", manualName.trim());
        formData.append("client_nif", manualNif.trim());
        formData.append("client_address", manualAddress.trim());
        if (saveClient) {
          formData.append("save_client", "1");
        }
      } else if (clientMode === "select" && selectedClient) {
        if (selectedClient.type === "invoice_client") {
          formData.append("invoice_client_id", selectedClient.id);
        } else {
          formData.append("customer_id", selectedClient.id);
        }
        formData.append("client_name", selectedClient.full_name || "");
        formData.append("client_nif", selectedClient.nif_cif || "");
        if (selectedClient.address) {
          formData.append("client_address", selectedClient.address);
        }
      } else {
        // Manual mode
        formData.append("client_name", manualName.trim());
        formData.append("client_nif", manualNif.trim());
        formData.append("client_address", manualAddress.trim());
        if (saveClient) {
          formData.append("save_client", "1");
        }
      }

      formData.append("invoice_date", dateStr);
      if (dueDate) {
        const dy = dueDate.getFullYear();
        const dm = String(dueDate.getMonth() + 1).padStart(2, "0");
        const dd = String(dueDate.getDate()).padStart(2, "0");
        formData.append("due_date", `${dy}-${dm}-${dd}`);
      }
      if (selectedSeriesId) {
        formData.append("series_id", selectedSeriesId);
      }
      formData.append("tax_rate", totals.taxRate);
      formData.append("irpf_rate", irpfRate);
      formData.append("notes", notes.trim());
      formData.append(
        "lines",
        JSON.stringify(
          validLines.map((l) => ({
            description: l.description.trim(),
            quantity: parseFloat(l.quantity) || 1,
            unit_price: parseFloat(l.unit_price) || 0,
            tax_rate: parseFloat(l.tax_rate) || 21,
          })),
        ),
      );

      // Create draft
      if (__DEV__) console.log("[EmitirFactura] Creating draft...");
      const createResponse = await fetchWithAuth(
        "advisory-issued-invoice-create",
        formData,
        { isFormData: true, silent: true },
      );

      if (__DEV__) console.log("[EmitirFactura] Create response:", createResponse?.status, createResponse?.message_plain);
      if (!createResponse || createResponse.status !== "ok") {
        const msg =
          createResponse?.message_html ||
          createResponse?.message_plain ||
          "Error al crear la factura";
        Alert.alert("Error", msg);
        return;
      }

      const invoiceId = createResponse.data?.invoice_id;
      if (!invoiceId) {
        Alert.alert("Error", "No se obtuvo el ID de la factura creada");
        return;
      }

      if (!emitAfterCreate) {
        Alert.alert(
          "Borrador creado",
          "La factura se ha guardado como borrador.",
          [{ text: "OK", onPress: () => router.back() }],
        );
        return;
      }

      // Emit invoice
      if (__DEV__) console.log("[EmitirFactura] Emitting invoice_id:", invoiceId);
      const emitFormData = new FormData();
      emitFormData.append("invoice_id", invoiceId);

      const emitResponse = await fetchWithAuth(
        "advisory-issued-invoice-emit",
        emitFormData,
        { isFormData: true, silent: true },
      );

      if (emitResponse && emitResponse.status === "ok") {
        const number = emitResponse.data?.invoice_number || "";
        let msg = `Factura ${number} emitida correctamente.`;
        if (emitResponse.data?.fiscal?.success) {
          msg += "\nEnviada a Hacienda correctamente.";
        }
        Alert.alert("Factura emitida", msg, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          "Aviso",
          "La factura se creó como borrador pero no se pudo emitir: " +
            (emitResponse?.message_plain || "Error desconocido"),
        );
      }
    } catch (error) {
      console.error("[EmitirFactura] Error:", error);
      Alert.alert("Error", "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Client picker filter
  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          (c.full_name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
          (c.nif_cif || "").toLowerCase().includes(clientSearch.toLowerCase()),
      )
    : clients;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 100}
    >
      <ScrollView
        className="flex-1 bg-background"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
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

          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-button">
              Emitir factura
            </Text>
          </View>

          {/* Client/Recipient section */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">
              {isClientUser ? "Datos del destinatario" : "Cliente"}
            </Text>

            {/* Mode toggle - show when there are saved clients */}
            {(clients.length > 0 || !isClientUser) && (
            <View className="flex-row mb-3 bg-gray-100 rounded-xl p-1">
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  clientMode === "select" ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setClientMode("select")}
              >
                <Text
                  className={`font-medium text-sm ${
                    clientMode === "select" ? "text-primary" : "text-gray-500"
                  }`}
                >
                  Seleccionar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  clientMode === "manual" ? "bg-white shadow-sm" : ""
                }`}
                onPress={() => setClientMode("manual")}
              >
                <Text
                  className={`font-medium text-sm ${
                    clientMode === "manual" ? "text-primary" : "text-gray-500"
                  }`}
                >
                  Nuevo cliente
                </Text>
              </TouchableOpacity>
            </View>
            )}

            {clientMode === "select" && (clients.length > 0 || !isClientUser) ? (
              <>
                {errors.client && (
                  <Text className="text-red-500 text-sm mb-2">{errors.client}</Text>
                )}
                <TouchableOpacity
                  className={`h-14 px-4 bg-white rounded-2xl border-2 justify-center ${
                    errors.client ? "border-red-500" : "border-bright"
                  }`}
                  onPress={() => setShowClientPicker(true)}
                >
                  <Text
                    className={selectedClient ? "text-black" : "text-gray-400"}
                  >
                    {selectedClient
                      ? `${selectedClient.full_name}${selectedClient.nif_cif ? ` (${selectedClient.nif_cif})` : ""}`
                      : "Buscar cliente..."}
                  </Text>
                </TouchableOpacity>
                {selectedClient?.type === "invoice_client" && (
                  <Text className="text-xs text-gray-400 mt-1">Cliente de facturación guardado</Text>
                )}
              </>
            ) : (
              <>
                {/* Manual client fields */}
                <View className="gap-3">
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Nombre / Razón social *</Text>
                    {errors.manualName && (
                      <Text className="text-red-500 text-xs mb-1">{errors.manualName}</Text>
                    )}
                    <TextInput
                      className={`h-12 px-4 bg-gray-50 rounded-xl border ${
                        errors.manualName ? "border-red-500" : "border-gray-200"
                      }`}
                      value={manualName}
                      onChangeText={setManualName}
                      placeholder="Ej: Empresa S.L."
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">NIF / CIF</Text>
                    <TextInput
                      className="h-12 px-4 bg-gray-50 rounded-xl border border-gray-200"
                      value={manualNif}
                      onChangeText={setManualNif}
                      placeholder="Ej: B12345678"
                      autoCapitalize="characters"
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Dirección</Text>
                    <TextInput
                      className="h-12 px-4 bg-gray-50 rounded-xl border border-gray-200"
                      value={manualAddress}
                      onChangeText={setManualAddress}
                      placeholder="Ej: Calle Mayor 1, 28001 Madrid"
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-1">
                    <Text className="text-sm text-gray-600">Guardar para futuras facturas</Text>
                    <Switch
                      value={saveClient}
                      onValueChange={setSaveClient}
                      trackColor={{ false: "#e5e7eb", true: "#86EFAC" }}
                      thumbColor={saveClient ? "#22C55E" : "#9ca3af"}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Invoice date */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Fecha de factura</Text>
            {errors.date && (
              <Text className="text-red-500 text-sm mb-2">{errors.date}</Text>
            )}
            <TouchableOpacity
              className="h-14 px-4 bg-white rounded-2xl border-2 border-bright justify-center"
              onPress={() => setShowDatePicker(true)}
            >
              <Text className="text-black">
                {formatDisplayDate(invoiceDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={invoiceDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                locale="es-ES"
              />
            )}

            {showDatePicker && Platform.OS === "ios" && (
              <Modal transparent animationType="fade" visible={showDatePicker}>
                <View className="flex-1 justify-end bg-black/40">
                  <View className="bg-white p-4 rounded-t-xl">
                    <DateTimePicker
                      value={tempDate || invoiceDate}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                      locale="es-ES"
                      textColor="#000"
                    />
                    <View className="flex-row justify-between mt-2 mb-6">
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setTempDate(null);
                        }}
                        className="px-4 py-2"
                      >
                        <Text className="text-red-500 text-base">
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmDateIOS}
                        className="px-4 py-2"
                      >
                        <Text className="text-primary text-base font-semibold">
                          Confirmar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>

          {/* Series */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-bold text-lg">Serie de facturación *</Text>
              <TouchableOpacity
                onPress={() => setShowNewSeriesModal(true)}
                accessibilityLabel="Crear nueva serie"
              >
                <Text className="text-primary font-medium">+ Nueva</Text>
              </TouchableOpacity>
            </View>
            {errors.series && (
              <Text className="text-red-500 text-sm mb-2">{errors.series}</Text>
            )}
            <TouchableOpacity
              className={`h-14 px-4 bg-white rounded-2xl border-2 justify-center ${
                errors.series ? "border-red-500" : "border-bright"
              }`}
              onPress={() => setShowSeriesPicker(true)}
              disabled={loadingSeries}
            >
              <Text className={selectedSeries ? "text-black" : "text-gray-400"}>
                {loadingSeries
                  ? "Cargando series..."
                  : selectedSeries
                    ? `${selectedSeries.prefix} — ${selectedSeries.customer_name}`
                    : series.length === 0
                      ? "No hay series — pulsa + Nueva"
                      : "Selecciona una serie..."}
              </Text>
            </TouchableOpacity>
            {selectedSeries && (
              <Text className="text-xs text-gray-400 mt-1">
                Próximo número: {selectedSeries.prefix}
                {selectedSeries.next_number}
              </Text>
            )}
          </View>

          {/* Due date */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-bold text-lg">Fecha de vencimiento</Text>
              {dueDate && (
                <TouchableOpacity
                  onPress={() => setDueDate(null)}
                  accessibilityLabel="Quitar fecha de vencimiento"
                >
                  <Text className="text-red-500 font-medium text-sm">
                    Quitar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              className="h-14 px-4 bg-white rounded-2xl border-2 border-bright justify-center"
              onPress={() => setShowDueDatePicker(true)}
            >
              <Text className={dueDate ? "text-black" : "text-gray-400"}>
                {dueDate ? formatDisplayDate(dueDate) : "Sin vencimiento (opcional)"}
              </Text>
            </TouchableOpacity>

            {showDueDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={onDueDateChange}
                locale="es-ES"
              />
            )}

            {showDueDatePicker && Platform.OS === "ios" && (
              <Modal transparent animationType="fade" visible={showDueDatePicker}>
                <View className="flex-1 justify-end bg-black/40">
                  <View className="bg-white p-4 rounded-t-xl">
                    <DateTimePicker
                      value={tempDueDate || dueDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={onDueDateChange}
                      locale="es-ES"
                      textColor="#000"
                    />
                    <View className="flex-row justify-between mt-2 mb-6">
                      <TouchableOpacity
                        onPress={() => {
                          setShowDueDatePicker(false);
                          setTempDueDate(null);
                        }}
                        className="px-4 py-2"
                      >
                        <Text className="text-red-500 text-base">
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmDueDateIOS}
                        className="px-4 py-2"
                      >
                        <Text className="text-primary text-base font-semibold">
                          Confirmar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>

          {/* Invoice lines */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Conceptos</Text>
            {errors.lines && (
              <Text className="text-red-500 text-sm mb-2">{errors.lines}</Text>
            )}

            {lines.map((line, index) => (
              <View
                key={index}
                className="border-2 border-gray-200 rounded-xl p-3 mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-medium text-gray-600">
                    Línea {index + 1}
                  </Text>
                  {lines.length > 1 && (
                    <TouchableOpacity onPress={() => removeLine(index)}>
                      <Text className="text-red-500 text-sm font-medium">
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  placeholder="Descripción del concepto"
                  value={line.description}
                  onChangeText={(v) => updateLine(index, "description", v)}
                  accessibilityLabel={`Descripción línea ${index + 1}`}
                />

                <View className="flex-row gap-2 mt-2">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Cantidad</Text>
                    <TextInput
                      className="h-11 px-3 bg-gray-50 rounded-xl border border-gray-200 text-center"
                      value={line.quantity}
                      onChangeText={(v) => updateLine(index, "quantity", v)}
                      keyboardType="decimal-pad"
                      placeholder="1"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">
                      Precio (€)
                    </Text>
                    <TextInput
                      className="h-11 px-3 bg-gray-50 rounded-xl border border-gray-200 text-center"
                      value={line.unit_price}
                      onChangeText={(v) => updateLine(index, "unit_price", v)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">IVA %</Text>
                    <TextInput
                      className="h-11 px-3 bg-gray-50 rounded-xl border border-gray-200 text-center"
                      value={line.tax_rate}
                      onChangeText={(v) => updateLine(index, "tax_rate", v)}
                      keyboardType="decimal-pad"
                      placeholder="21"
                    />
                  </View>
                </View>

                {/* Line total */}
                <Text className="text-right text-gray-500 text-sm mt-2">
                  Subtotal:{" "}
                  {(
                    (parseFloat(line.quantity) || 0) *
                    (parseFloat(line.unit_price) || 0)
                  ).toFixed(2)}{" "}
                  €
                </Text>
              </View>
            ))}

            <TouchableOpacity
              className="border-2 border-dashed border-primary rounded-xl p-3 items-center"
              onPress={addLine}
            >
              <Text className="text-primary font-medium">+ Añadir línea</Text>
            </TouchableOpacity>
          </View>

          {/* IRPF */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Retención IRPF</Text>
            <View className="flex-row flex-wrap gap-2">
              {IRPF_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className={`px-4 py-3 rounded-xl border-2 ${
                    irpfRate === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onPress={() => setIrpfRate(opt.value)}
                >
                  <Text
                    className={`font-medium ${
                      irpfRate === opt.value ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Totals */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Totales</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="font-medium">{totals.subtotal} €</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">
                  IVA ({totals.taxRate}%)
                </Text>
                <Text className="font-medium">{totals.taxAmount} €</Text>
              </View>
              {irpfRate > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">IRPF ({irpfRate}%)</Text>
                  <Text className="font-medium text-red-500">
                    -{totals.irpfAmount} €
                  </Text>
                </View>
              )}
              <View className="border-t border-gray-200 pt-2 flex-row justify-between">
                <Text className="font-bold text-lg">Total</Text>
                <Text className="font-extrabold text-lg text-primary">
                  {totals.total} €
                </Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Notas (opcional)</Text>
            <Input
              placeholder="Notas o comentarios sobre la factura..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              maxLength={1000}
              accessibilityLabel="Notas de la factura"
            />
          </View>

          {/* Action buttons */}
          <View className="gap-3 mb-6">
            <Button
              onPress={() => handleSubmit(true)}
              loading={loading}
              disabled={loading}
              accessibilityLabel="Emitir factura"
            >
              Emitir factura
            </Button>

            <TouchableOpacity
              className="bg-white border-2 border-primary rounded-2xl p-4 items-center"
              onPress={() => handleSubmit(false)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-primary font-bold text-base">
                Guardar como borrador
              </Text>
            </TouchableOpacity>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Client picker modal */}
      <Modal
        visible={showClientPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background">
          <View className="p-5 pb-3 border-b border-gray-200 bg-white">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-extrabold">
                Seleccionar cliente
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowClientPicker(false);
                  setClientSearch("");
                }}
              >
                <Text className="text-red-500 font-medium text-base">
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              className="h-12 px-4 bg-gray-100 rounded-xl"
              placeholder="Buscar por nombre o NIF..."
              value={clientSearch}
              onChangeText={setClientSearch}
              autoFocus
            />
          </View>

          <ScrollView className="flex-1 p-5">
            {loadingClients ? (
              <Text className="text-gray-500 text-center py-10">
                Cargando clientes...
              </Text>
            ) : filteredClients.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-gray-500 text-center mb-3">
                  No se encontraron clientes
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowClientPicker(false);
                    setClientSearch("");
                    setClientMode("manual");
                  }}
                >
                  <Text className="text-primary font-medium">
                    + Crear cliente nuevo
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredClients.map((client) => (
                <TouchableOpacity
                  key={`${client.type || "platform"}-${client.id}`}
                  className={`bg-white p-4 rounded-xl mb-2 border-2 ${
                    selectedClient?.id === client.id &&
                    (selectedClient?.type || "platform") === (client.type || "platform")
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() => {
                    setSelectedClient(client);
                    setShowClientPicker(false);
                    setClientSearch("");
                    setErrors((e) => ({ ...e, client: null }));
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-base flex-1">
                      {client.full_name}
                    </Text>
                    {client.type === "invoice_client" && (
                      <View className="bg-gray-100 px-2 py-0.5 rounded">
                        <Text className="text-xs text-gray-500">Guardado</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row gap-3 mt-1">
                    {client.nif_cif ? (
                      <Text className="text-gray-500 text-sm">
                        NIF: {client.nif_cif}
                      </Text>
                    ) : null}
                    {client.email ? (
                      <Text className="text-gray-500 text-sm">
                        {client.email}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Series picker modal */}
      <Modal
        visible={showSeriesPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background">
          <View className="p-5 pb-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
            <Text className="text-xl font-extrabold">Seleccionar serie</Text>
            <TouchableOpacity onPress={() => setShowSeriesPicker(false)}>
              <Text className="text-red-500 font-medium text-base">Cerrar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 p-5">
            {loadingSeries ? (
              <Text className="text-gray-500 text-center py-10">
                Cargando series...
              </Text>
            ) : series.length === 0 ? (
              <View className="items-center py-10">
                <Text className="text-gray-500 text-center mb-3">
                  No hay series creadas
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowSeriesPicker(false);
                    setShowNewSeriesModal(true);
                  }}
                >
                  <Text className="text-primary font-medium">
                    + Crear primera serie
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              series.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  className={`bg-white p-4 rounded-xl mb-2 border-2 ${
                    selectedSeriesId === s.id
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onPress={() => {
                    setSelectedSeriesId(s.id);
                    setShowSeriesPicker(false);
                    setErrors((e) => ({ ...e, series: null }));
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-base">{s.prefix}</Text>
                    <Text className="text-xs text-gray-500">
                      Próx: {s.prefix}
                      {s.next_number}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm mt-1">
                    {s.customer_name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* New series modal */}
      <Modal
        visible={showNewSeriesModal}
        animationType="fade"
        transparent
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-5">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-xl font-extrabold mb-1">Nueva serie</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Crea una serie general para numerar tus facturas
            </Text>

            <Text className="text-xs text-gray-500 mb-1">Prefijo *</Text>
            <TextInput
              className="h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 mb-3"
              value={newSeriesPrefix}
              onChangeText={setNewSeriesPrefix}
              placeholder="Ej: F, A, R, 2026-"
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text className="text-xs text-gray-500 mb-1">Formato</Text>
            <TextInput
              className="h-12 px-4 bg-gray-50 rounded-xl border border-gray-200 mb-1"
              value={newSeriesFormat}
              onChangeText={setNewSeriesFormat}
              placeholder="{prefix}{number}"
              autoCapitalize="none"
            />
            <Text className="text-xs text-gray-400 mb-4">
              Usa {"{prefix}"} y {"{number}"} (ej: F1, F2...)
            </Text>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 items-center"
                onPress={() => {
                  setShowNewSeriesModal(false);
                  setNewSeriesPrefix("");
                }}
                disabled={savingSeries}
              >
                <Text className="font-medium text-gray-600">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl bg-primary items-center"
                onPress={handleCreateSeries}
                disabled={savingSeries}
              >
                <Text className="font-bold text-white">
                  {savingSeries ? "Creando..." : "Crear"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
