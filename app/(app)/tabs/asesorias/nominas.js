/**
 * Pantalla de nóminas del cliente
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

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
    }, [loadPayrolls]),
  );

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
        <Text className="text-2xl font-extrabold text-button mb-4">
          Nóminas
        </Text>
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
              Tu asesoría añadirá aquí tus nóminas mensuales
            </Text>
          </View>
        }
      />
    </View>
  );
}
