/**
 * Pantalla de listado de incidencias del usuario
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import { LoadingScreen, ErrorScreen } from "../../../../components/ui";

// Estados de incidencias
const INCIDENT_STATUS = {
  1: { label: "Abierta", bg: "#fff8dd", text: "#f6c000" },
  2: { label: "En revisión", bg: "#e9f3ff", text: "#00c2cb" },
  3: { label: "Resuelta", bg: "#dfffea", text: "#17c653" },
  4: { label: "Cerrada", bg: "#f1f1f1", text: "#666666" },
};

function IncidentCard({ incident, onPress }) {
  const status = INCIDENT_STATUS[incident.status_id] || INCIDENT_STATUS[1];

  return (
    <TouchableOpacity onPress={onPress}>
      <View className="bg-white p-5 mb-4 rounded-2xl">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="font-extrabold text-base">
              {incident.category_name}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {incident.incident_category_name}
            </Text>
          </View>
          <View
            style={{ backgroundColor: status.bg }}
            className="px-3 py-1 rounded-full"
          >
            <Text style={{ color: status.text }} className="text-xs font-bold">
              {status.label}
            </Text>
          </View>
        </View>

        {incident.details && (
          <Text className="text-gray-600 mb-3" numberOfLines={2}>
            {incident.details}
          </Text>
        )}

        <View className="flex-row justify-between border-t border-gray-100 pt-3">
          <View>
            <Text className="text-gray-400 text-xs">Creada</Text>
            <Text className="text-sm">{incident.created_at}</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-400 text-xs">Actualizada</Text>
            <Text className="text-sm">{incident.updated_at}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function IncidenciasScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchIncidents = useCallback(async () => {
    setError(null);

    try {
      const response = await fetchWithAuth("app-incidents-list", null, {
        silent: true,
      });

      if (response?.status === "ok" && response.data) {
        setIncidents(response.data);
        setPagination(response.pagination || null);
      } else {
        setIncidents([]);
      }
    } catch (err) {
      setError(err.message || "Error al cargar las incidencias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIncidents();
    }, [fetchIncidents]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIncidents();
  }, [fetchIncidents]);

  const handleIncidentPress = (incident) => {
    router.push(`/(app)/tabs/mis-solicitudes/solicitud?id=${incident.request_id}`);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={fetchIncidents} />;
  }

  if (incidents.length === 0) {
    return (
      <View className="flex-1 bg-background px-5 pt-5">
        <Text className="text-2xl font-extrabold my-5">Mis incidencias</Text>
        <View className="flex-1 justify-center items-center">
          <Text className="text-6xl mb-4">✅</Text>
          <Text className="text-gray-500 text-center text-lg">
            No tienes incidencias
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Todas tus solicitudes funcionan correctamente
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-5 pt-5">
      <Text className="text-2xl font-extrabold my-5">Mis incidencias</Text>

      {pagination && pagination.total_records > 0 && (
        <Text className="text-gray-500 mb-3">
          {pagination.total_records} incidencia
          {pagination.total_records !== 1 ? "s" : ""}
        </Text>
      )}

      <FlatList
        data={incidents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <IncidentCard
            incident={item}
            onPress={() => handleIncidentPress(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
