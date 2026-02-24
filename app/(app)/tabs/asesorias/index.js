/**
 * Pantalla principal de Asesorías
 * Muestra opciones si tiene asesoría vinculada, o formulario para vincular
 */

import { useState, useCallback } from "react";
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

// All menu items by ID
const ALL_OPTIONS = {
  "tu-asesor": { id: "tu-asesor", name: "Tu Asesor", icon: "👤", description: "Chat directo con tu asesor", route: "/tabs/asesorias/tu-asesor", statKey: "general_chat_unread" },
  "facturas": { id: "facturas", name: "Facturas", icon: "📄", description: "Facturas y documentos", route: "/tabs/asesorias/facturas" },
  "citas": { id: "citas", name: "Citas", icon: "📅", description: "Gestionar tus citas", route: "/tabs/asesorias/citas", statKey: "appointments_needs_confirmation" },
  "comunicados": { id: "comunicados", name: "Comunicados", icon: "💬", description: "Mensajes de tu asesoría", route: "/tabs/asesorias/comunicaciones", statKey: "communications_unread" },
  "enviar-factura": { id: "enviar-factura", name: "Enviar Factura", icon: "📤", description: "Sube una factura", route: "/tabs/asesorias/facturas?autoUpload=true" },
  "nueva-cita": { id: "nueva-cita", name: "Nueva cita", icon: "➕", description: "Solicitar una cita", route: "/tabs/asesorias/nueva-cita" },
  "contratos": { id: "contratos", name: "Contratos", icon: "📋", description: "Contratos laborales", route: "/tabs/asesorias/contratos" },
  "nominas": { id: "nominas", name: "Nóminas", icon: "💰", description: "Nóminas mensuales", route: "/tabs/asesorias/nominas" },
  "metricas": { id: "metricas", name: "Métricas", icon: "📊", description: "Ingresos, gastos y balance", route: "/tabs/asesorias/metricas" },
  "emitir-factura": { id: "emitir-factura", name: "Emitir Factura", icon: "🧾", description: "Crear facturas a clientes", route: "/tabs/asesorias/emitir-factura", requiresEmit: true },
  "info": { id: "info", name: "Mi asesoría", icon: "🏢", description: "Información de contacto", route: "/tabs/asesorias/info" },
};

// Grid preferred order (top 2x2)
const GRID_PREFERRED = ["tu-asesor", "facturas", "citas", "comunicados"];
// Fixed list items (always 1st and 2nd in bottom list)
const LIST_FIXED = ["enviar-factura", "nueva-cita"];
// Variable list items (can rotate up to grid if needed)
const LIST_VARIABLE = ["contratos", "nominas", "metricas", "emitir-factura", "info"];

export default function AsesoriasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAdvisory, setHasAdvisory] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [stats, setStats] = useState(null);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [canSendInvoices, setCanSendInvoices] = useState(false);
  const [canEmitInvoices, setCanEmitInvoices] = useState(false);
  const [isAdvisoryUser, setIsAdvisoryUser] = useState(false);
  const [allowChat, setAllowChat] = useState(true);
  const [sidebar, setSidebar] = useState(null);

  const loadAdvisoryData = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-user-advisory",
        {},
        { silent: true },
      );

      if (__DEV__) {
        console.log("[Asesorias] Response:", JSON.stringify(response, null, 2));
      }

      if (response?.status === "ok") {
        setHasAdvisory(response.data?.has_advisory || false);
        setAdvisory(response.data?.advisory || null);
        setStats(response.data?.stats || null);
        setNextAppointment(response.data?.next_appointment || null);
        setCanSendInvoices(response.data?.can_send_invoices || false);
        setCanEmitInvoices(response.data?.can_emit_invoices || false);
        setIsAdvisoryUser(response.data?.is_advisory_user || false);
        setAllowChat(response.data?.allow_chat !== false);
        setSidebar(response.data?.sidebar || null);
      } else if (__DEV__) {
        console.log("[Asesorias] Response status not ok:", response?.status);
      }
    } catch (error) {
      if (__DEV__) {
        console.error("[Asesorias] Error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdvisoryData();
    }, [loadAdvisoryData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAdvisoryData();
  }, [loadAdvisoryData]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#30D4D1" />
      </View>
    );
  }

  // Si NO tiene asesoría vinculada
  if (!hasAdvisory) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 py-4">
          <View className="my-5">
            <Text className="text-2xl font-extrabold">Asesorías</Text>
          </View>

          {/* Card vincular */}
          <TouchableOpacity
            className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-primary mb-4"
            onPress={() => router.push("/tabs/asesorias/vincular")}
            accessibilityLabel="Vincular asesoría"
            accessibilityRole="button"
          >
            <View className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Text className="text-3xl">🔗</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-white">
                Vincula tu asesoría
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                Introduce el código de tu asesor
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info card */}
          <View className="w-full h-auto m-0 p-5 rounded-2xl bg-white">
            <Text className="text-base font-extrabold mb-2">
              ¿No tienes código?
            </Text>
            <Text className="text-gray-600">
              Contacta con tu asesoría y solicita tu código de vinculación. El
              código tiene el formato ASE-XXXXXXXXX.
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    );
  }

  // Si TIENE asesoría vinculada
  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="px-6 py-4 mb-20">
        {/* Header con info de asesoría */}
        <View className="bg-primary rounded-3xl p-5 mb-6">
          <Text className="text-white/70 text-sm">Tu asesoría</Text>
          <Text className="text-white text-xl font-extrabold mt-1">
            {advisory?.name || "Asesoría"}
          </Text>

          {/* Próxima cita inline */}
          {nextAppointment && (
            <TouchableOpacity
              className="mt-4 bg-white/20 rounded-2xl p-3 flex-row items-center"
              onPress={() => router.push(`/tabs/asesorias/cita/${nextAppointment.id}`)}
            >
              <Text className="text-2xl mr-3">📅</Text>
              <View className="flex-1">
                <Text className="text-white/70 text-xs">Próxima cita</Text>
                <Text className="text-white font-bold text-sm">
                  {formatDate(nextAppointment.scheduled_date)}
                </Text>
              </View>
              <Text className="text-white text-lg">›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Build menu: grid + list with dynamic rotation */}
        {(() => {
          // Filter function: check if an option is allowed by advisory config
          const isAllowed = (id) => {
            if (id === "tu-asesor" && !allowChat) return false;
            if (id === "comunicados" && sidebar?.show_communications === false) return false;
            if (id === "emitir-factura" && !canEmitInvoices) return false;
            if (id === "contratos" && sidebar?.show_contracts === false) return false;
            if (id === "nominas" && sidebar?.show_payrolls === false) return false;
            if (id === "metricas" && sidebar?.show_metrics === false) return false;
            if (id === "facturas" && sidebar?.show_invoices === false) return false;
            if (id === "enviar-factura" && sidebar?.show_invoices === false) return false;
            if (id === "citas" && sidebar?.show_appointments === false) return false;
            if (id === "nueva-cita" && sidebar?.show_appointments === false) return false;
            return true;
          };

          // 1. Grid: preferred items, filtered
          const gridItems = GRID_PREFERRED.filter(isAllowed).map(id => ALL_OPTIONS[id]);

          // 2. Variable list items, filtered
          const variableItems = LIST_VARIABLE.filter(isAllowed).map(id => ALL_OPTIONS[id]);

          // 3. If grid < 4, pull from variable to fill
          const promoted = [];
          while (gridItems.length < 4 && variableItems.length > 0) {
            promoted.push(variableItems.shift());
          }
          const finalGrid = [...gridItems, ...promoted];

          // 4. Fixed list items (always 1st and 2nd) + remaining variable
          const fixedItems = LIST_FIXED.filter(isAllowed).map(id => ALL_OPTIONS[id]);
          const finalList = [...fixedItems, ...variableItems];

          return (
            <>
              {/* Grid 2x2 */}
              <View className="flex-row flex-wrap justify-between">
                {finalGrid.map((option) => {
                  const badgeCount = option.statKey ? stats?.[option.statKey] : 0;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      className="w-[48%] bg-white rounded-2xl p-4 mb-4"
                      onPress={() => router.push(option.route)}
                      activeOpacity={0.7}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View className="flex-row items-start justify-between mb-3">
                        <Text className="text-4xl">{option.icon}</Text>
                        {badgeCount > 0 && (
                          <View className="bg-red-500 px-2 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">{badgeCount}</Text>
                          </View>
                        )}
                      </View>
                      <Text className="font-extrabold text-base">{option.name}</Text>
                      <Text className="text-gray-500 text-xs mt-1">{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* List rows */}
              {finalList.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className="bg-white rounded-2xl p-4 flex-row items-center mb-3"
                  onPress={() => router.push(option.route)}
                  activeOpacity={0.7}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text className="text-4xl mr-4">{option.icon}</Text>
                  <View className="flex-1">
                    <Text className="font-extrabold text-base">{option.name}</Text>
                    <Text className="text-gray-500 text-xs">{option.description}</Text>
                  </View>
                  <Text className="text-gray-400 text-xl">›</Text>
                </TouchableOpacity>
              ))}
            </>
          );
        })()}

      </View>
    </ScrollView>
  );
}
