/**
 * Pantalla de listado de solicitudes del usuario
 */

import React, { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import { LoadingScreen, ErrorScreen } from "../../../../components/ui";
import SolicitudCard from "../../../../components/SolicitudCard";

export default function MisSolicitudesScreen() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState([]);
  const [incidentCount, setIncidentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Carga las solicitudes del usuario
   */
  const fetchSolicitudes = useCallback(async () => {
    setError(null);

    try {
      const response = await fetchWithAuth("app-user-get-requests", null, {
        silent: true,
      });

      if (response && response.data) {
        setSolicitudes(response.data);
        // Contar solicitudes con incidencias abiertas
        const withIncidents = response.data.filter(s => s.has_incident).length;
        setIncidentCount(withIncidents);
      } else {
        setSolicitudes([]);
        setIncidentCount(0);
      }
    } catch (err) {
      setError(err.message || "Error al cargar las solicitudes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes();
    }, [fetchSolicitudes])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  // Estado de carga
  if (loading) {
    return <LoadingScreen />;
  }

  // Estado de error
  if (error) {
    return <ErrorScreen message={error} onRetry={fetchSolicitudes} />;
  }

  // Componente de header con acceso a incidencias
  const ListHeader = () => (
    <View className="mb-4">
      <TouchableOpacity
        className="bg-white p-4 rounded-2xl flex-row items-center"
        onPress={() => router.push("/(app)/tabs/incidencias")}
        activeOpacity={0.7}
      >
        <View className="h-12 w-12 rounded-full bg-yellow-100 items-center justify-center mr-4">
          <Text className="text-2xl">⚠️</Text>
        </View>
        <View className="flex-1">
          <Text className="font-extrabold text-base">Mis incidencias</Text>
          <Text className="text-gray-500 text-sm">
            Ver incidencias reportadas
          </Text>
        </View>
        {incidentCount > 0 && (
          <View className="bg-red-500 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">{incidentCount}</Text>
          </View>
        )}
        <Text className="text-gray-400 text-xl ml-2">›</Text>
      </TouchableOpacity>
    </View>
  );

  // Lista vacía
  if (solicitudes.length === 0) {
    return (
      <View className="flex-1 bg-background px-5 pt-5">
        <Text className="text-2xl font-extrabold my-5">Mis solicitudes</Text>
        <ListHeader />
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-center">
            No tienes solicitudes todavía.{"\n"}
            Solicita un servicio para empezar.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-5 pt-5">
      <Text className="text-2xl font-extrabold my-5">Mis solicitudes</Text>
      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SolicitudCard solicitud={item} />}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}
