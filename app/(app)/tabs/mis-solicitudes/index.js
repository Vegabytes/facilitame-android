/**
 * Pantalla de listado de solicitudes del usuario
 */

import React, { useCallback, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import { LoadingScreen, ErrorScreen } from "../../../../components/ui";
import SolicitudCard from "../../../../components/SolicitudCard";

export default function MisSolicitudesScreen() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga las solicitudes del usuario
   */
  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth("app-user-get-requests", null, {
        silent: true,
      });

      if (response && response.data) {
        setSolicitudes(response.data);
      } else {
        setSolicitudes([]);
      }
    } catch (err) {
      setError(err.message || "Error al cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes();
    }, [fetchSolicitudes])
  );

  // Estado de carga
  if (loading) {
    return <LoadingScreen />;
  }

  // Estado de error
  if (error) {
    return <ErrorScreen message={error} onRetry={fetchSolicitudes} />;
  }

  // Lista vacía
  if (solicitudes.length === 0) {
    return (
      <View className="flex-1 bg-background px-5 pt-5">
        <Text className="text-2xl font-extrabold my-5">Mis solicitudes</Text>
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
