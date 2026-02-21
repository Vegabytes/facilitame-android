/**
 * Pantalla de métricas del cliente (ingresos, gastos, balance)
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";

const PERIODS = [
  { key: "mensual", label: "Mensual" },
  { key: "trimestral", label: "Trimestral" },
  { key: "anual", label: "Anual" },
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

export default function MetricasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("mensual");
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState(null);
  const [byMonth, setByMonth] = useState([]);

  const loadMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams({ period, year });
      const response = await fetchWithAuth(
        `customer-metrics?${params.toString()}`,
        {},
        { silent: true },
      );

      if (response?.status === "ok" && response.data) {
        setSummary(response.data.summary || null);
        setByMonth(response.data.by_month || []);
      }
    } catch (_error) {
      // Silenciar
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, year]);

  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [loadMetrics]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMetrics();
  }, [loadMetrics]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0,00 €";
    return parseFloat(amount).toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    });
  };

  const balanceColor = useMemo(() => {
    if (!summary) return "text-gray-700";
    const balance = parseFloat(summary.balance || 0);
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-700";
  }, [summary]);

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
          Métricas
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period filters */}
        <View className="flex-row mb-3 gap-2">
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              className={`px-4 py-2 rounded-full ${
                period === p.key ? "bg-primary" : "bg-white"
              }`}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                className={`font-medium ${
                  period === p.key ? "text-white" : "text-gray-600"
                }`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Year filter */}
        <View className="flex-row mb-4 gap-2">
          {YEARS.map((y) => (
            <TouchableOpacity
              key={y}
              className={`px-3 py-1.5 rounded-full ${
                year === y ? "bg-gray-800" : "bg-white"
              }`}
              onPress={() => setYear(y)}
            >
              <Text
                className={`text-sm font-medium ${
                  year === y ? "text-white" : "text-gray-600"
                }`}
              >
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI Cards */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white p-4 rounded-xl items-center">
            <Text className="text-green-600 text-xl font-bold">
              {formatCurrency(summary?.total_ingresos)}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">Ingresos</Text>
          </View>
          <View className="flex-1 bg-white p-4 rounded-xl items-center">
            <Text className="text-red-500 text-xl font-bold">
              {formatCurrency(summary?.total_gastos)}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">Gastos</Text>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl items-center mb-4">
          <Text className={`text-2xl font-bold ${balanceColor}`}>
            {formatCurrency(summary?.balance)}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">Balance</Text>
        </View>

        {/* Monthly breakdown */}
        {byMonth.length > 0 && (
          <View className="bg-white rounded-xl overflow-hidden">
            <View className="flex-row bg-gray-50 px-4 py-3 border-b border-gray-100">
              <Text className="flex-1 font-bold text-xs text-gray-500">
                PERIODO
              </Text>
              <Text className="w-24 text-right font-bold text-xs text-gray-500">
                INGRESOS
              </Text>
              <Text className="w-24 text-right font-bold text-xs text-gray-500">
                GASTOS
              </Text>
              <Text className="w-24 text-right font-bold text-xs text-gray-500">
                BALANCE
              </Text>
            </View>
            {byMonth.map((row, index) => {
              const rowBalance =
                parseFloat(row.ingresos || 0) - parseFloat(row.gastos || 0);
              return (
                <View
                  key={row.periodo || index}
                  className={`flex-row px-4 py-3 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <Text className="flex-1 text-sm text-gray-700">
                    {row.periodo}
                  </Text>
                  <Text className="w-24 text-right text-sm text-green-600">
                    {formatCurrency(row.ingresos)}
                  </Text>
                  <Text className="w-24 text-right text-sm text-red-500">
                    {formatCurrency(row.gastos)}
                  </Text>
                  <Text
                    className={`w-24 text-right text-sm font-medium ${
                      rowBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(rowBalance)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {byMonth.length === 0 && (
          <View className="items-center py-10">
            <Text className="text-5xl mb-4">📊</Text>
            <Text className="text-gray-500 text-center text-lg">
              No hay datos para este periodo
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-6">
              Las métricas se generan a partir de tus facturas registradas
            </Text>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
