/**
 * Pantalla de contratos laborales del cliente
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
import { fetchWithAuth, getAuthToken } from "../../../../utils/api";
import { API_URL } from "../../../../utils/constants";

const CONTRACT_TYPES = {
  indefinido: "Indefinido",
  temporal: "Temporal",
  practicas: "Prácticas",
  formacion: "Formación",
  obra_servicio: "Obra/Servicio",
  interinidad: "Interinidad",
};

const STATUS_CONFIG = {
  activo: { label: "Activo", bg: "bg-green-100", text: "text-green-700" },
  finalizado: { label: "Finalizado", bg: "bg-gray-100", text: "text-gray-700" },
  pendiente_revision: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
};

export default function ContratosScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadContracts = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-advisory-contracts",
        {},
        { silent: true },
      );

      if (response?.status === "ok") {
        setContracts(response.data?.contracts || []);
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
      loadContracts();
    }, [loadContracts]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContracts();
  }, [loadContracts]);

  const filteredContracts = useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return parseFloat(amount).toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  const stats = useMemo(() => {
    const activos = contracts.filter((c) => c.status === "activo").length;
    const finalizados = contracts.filter((c) => c.status === "finalizado").length;
    const pendientes = contracts.filter((c) => c.status === "pendiente_revision").length;
    return { activos, finalizados, pendientes, total: contracts.length };
  }, [contracts]);

  const changeContractStatus = useCallback(async (contractId, currentStatus) => {
    const options = [
      { text: "Activo", value: "activo" },
      { text: "Finalizado", value: "finalizado" },
      { text: "Pendiente", value: "pendiente_revision" },
    ].filter((o) => o.value !== currentStatus);

    const buttons = options.map((o) => ({
      text: o.text,
      onPress: async () => {
        try {
          const res = await fetchWithAuth("app-advisory-contract-update-status", {
            contract_id: contractId,
            status: o.value,
          });
          if (res?.status === "ok") {
            loadContracts();
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
  }, [loadContracts]);

  const renderContract = useCallback(
    ({ item }) => {
      const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.activo;
      const typeName = CONTRACT_TYPES[item.contract_type] || item.contract_type;

      const openFileById = async (fileId) => {
        try {
          const token = await getAuthToken();
          const url = `${API_URL}/file-download?type=advisory_contract_file&id=${fileId}&auth_token=${token}`;
          await Linking.openURL(url);
        } catch (_error) {
          Alert.alert("Error", "No se pudo abrir el archivo");
        }
      };

      const openFile = async () => {
        const files = item.files || [];
        if (files.length === 0 && !item.first_file_id) {
          Alert.alert("Sin documento", "Este contrato no tiene documento adjunto");
          return;
        }
        if (files.length <= 1) {
          openFileById(files[0]?.id || item.first_file_id);
          return;
        }
        const buttons = files.map((f, idx) => ({
          text: f.name || `Documento ${idx + 1}`,
          onPress: () => openFileById(f.id),
        }));
        buttons.push({ text: "Cancelar", style: "cancel" });
        Alert.alert("Seleccionar documento", `${files.length} archivos adjuntos`, buttons);
      };

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openFile}
          className={`bg-white p-4 rounded-xl mb-3 border-l-4 ${
            item.status === "activo"
              ? "border-green-500"
              : item.status === "pendiente_revision"
                ? "border-amber-500"
                : "border-gray-400"
          }`}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="font-bold text-base" numberOfLines={1}>
                {item.employee_name}
              </Text>
              {item.position && (
                <Text className="text-gray-500 text-xs">{item.position}</Text>
              )}
            </View>
            <TouchableOpacity
              className={`px-3 py-1 rounded-full ${statusConf.bg}`}
              onPress={() => changeContractStatus(item.id, item.status)}
            >
              <Text className={`text-xs font-medium ${statusConf.text}`}>
                {statusConf.label} ▾
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center flex-wrap gap-2">
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-blue-700">
                {typeName}
              </Text>
            </View>

            <Text className="text-gray-500 text-xs">
              {formatDate(item.start_date)}
              {item.end_date ? ` - ${formatDate(item.end_date)}` : " - Actual"}
            </Text>

            {item.salary_gross > 0 && (
              <Text className="text-gray-600 text-xs font-medium">
                {formatCurrency(item.salary_gross)}/año
              </Text>
            )}

            {item.files_count > 0 && (
              <View className="bg-cyan-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-cyan-700">
                  📎 {item.files_count} doc(s)
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [changeContractStatus],
  );

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const ListHeaderComponent = useMemo(
    () => (
      <View className="mb-4">
        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-green-500">
              {stats.activos}
            </Text>
            <Text className="text-gray-500 text-xs">Activos</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-gray-500">
              {stats.finalizados}
            </Text>
            <Text className="text-gray-500 text-xs">Finalizados</Text>
          </View>
          <View className="flex-1 bg-white p-3 rounded-xl items-center">
            <Text className="text-2xl font-bold text-amber-500">
              {stats.pendientes}
            </Text>
            <Text className="text-gray-500 text-xs">Pendientes</Text>
          </View>
        </View>

        {/* Filtros */}
        <View className="flex-row mb-4 gap-2">
          {[
            { key: "all", label: "Todos" },
            { key: "activo", label: "Activos" },
            { key: "finalizado", label: "Finalizados" },
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
          Contratos
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredContracts}
        renderItem={renderContract}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">📋</Text>
            <Text className="text-gray-500 text-center text-lg">
              No hay contratos registrados
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-6">
              Tu asesoría añadirá aquí tus contratos laborales
            </Text>
          </View>
        }
      />
    </View>
  );
}
