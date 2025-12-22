import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { fetchWithAuth } from "../utils/api";

const TABS = ["Menos de 30 días", "Menos de 60 días", "Más de 60 días"];

export default function ProximosVencimientos() {
  const [selectedTab, setSelectedTab] = useState("Menos de 30 días");
  const [vencimientos, setVencimientos] = useState({
    "Menos de 30 días": [],
    "Menos de 60 días": [],
    "Más de 60 días": [],
  });
  const [loading, setLoading] = useState(true);

  const loadVencimientos = useCallback(async () => {
    try {
      const response = await fetchWithAuth(
        "app-requests-get-upcoming-expiration",
        {},
        { silent: true },
      );

      if (response?.status === "ok" && response.data) {
        const requests = Array.isArray(response.data)
          ? response.data
          : Object.values(response.data).filter(
              (item) => typeof item === "object",
            );

        const now = new Date();
        const grouped = {
          "Menos de 30 días": [],
          "Menos de 60 días": [],
          "Más de 60 días": [],
        };

        requests.forEach((request) => {
          if (!request.expires_at) return;

          const expiresAt = new Date(request.expires_at);
          const diffDays = Math.ceil(
            (expiresAt - now) / (1000 * 60 * 60 * 24),
          );

          const item = {
            id: request.id?.toString() || Math.random().toString(),
            categoria: request.category_name || "Sin categoría",
            detalle: request.request_info || request.description || "",
            fecha: request.expires_at_display || "",
            ahorro: request.annual_savings
              ? `${parseFloat(request.annual_savings).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`
              : "",
          };

          if (diffDays <= 30) {
            grouped["Menos de 30 días"].push(item);
          } else if (diffDays <= 60) {
            grouped["Menos de 60 días"].push(item);
          } else {
            grouped["Más de 60 días"].push(item);
          }
        });

        setVencimientos(grouped);
      }
    } catch (_error) {
      // Silenciar error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVencimientos();
  }, [loadVencimientos]);

  if (loading) {
    return (
      <View className="bg-background p-4 rounded-xl shadow-lg items-center justify-center">
        <ActivityIndicator size="small" color="#30D4D1" />
      </View>
    );
  }

  return (
    <View className="bg-background p-4 rounded-xl shadow-lg">
      {/* TABS */}
      <View className="flex-row justify-between mt-4">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            className={`flex-1 p-2 ${selectedTab === tab ? "border-b-2 border-text" : ""}`}
          >
            <Text
              className={`text-center ${selectedTab === tab ? "font-bold" : "text-gray-500"}`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTADO DE VENCIMIENTOS */}
      <View className="bg-white p-4 mt-4 rounded-xl">
        <FlatList
          scrollEnabled={false}
          data={vencimientos[selectedTab]}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center">
              No hay vencimientos
            </Text>
          }
          renderItem={({ item }) => (
            <View className="border-b border-gray-300 py-2">
              <Text className="font-bold">{item.categoria}</Text>
              <Text>{item.detalle}</Text>
              <Text className="text-gray-500">Vencimiento: {item.fecha}</Text>
              {item.ahorro && (
                <Text className="text-green-600 font-semibold">
                  Ahorro: {item.ahorro}
                </Text>
              )}
            </View>
          )}
        />
      </View>
    </View>
  );
}
