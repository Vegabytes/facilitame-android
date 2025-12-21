import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fetchWithAuth } from "./../../../../utils/api.js";

export default function ServicesScreen() {
  const router = useRouter();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateKey = new Date().toISOString().split("T")[0].replace(/-/g, "");

  const fetchServicios = async () => {
    try {
      const response = await fetchWithAuth("app-services");

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("La API no devolvió los datos esperados.");
      }

      const serviciosFiltrados = response.data
        .filter((servicio) => servicio.parent_id === null)
        .map((servicio) => ({
          id: servicio.id,
          name: servicio.name,
          category_img_uri: servicio.category_img_uri,
          hasChildren:
            servicio.subcategories && servicio.subcategories.length > 0,
        }));

      setServicios(serviciosFiltrados);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const chunkArray = (arr, size) => {
    return arr.reduce((acc, _, i) => {
      if (i % size === 0) acc.push(arr.slice(i, i + size));
      return acc;
    }, []);
  };

  const filasDeServicios = chunkArray(servicios, 3);

  return (
    <ScrollView className="bg-background py-4 px-6 pb-20">
      <View className="flex-column gap-5 mb-20">
        <View className="my-5">
          <Text className="text-2xl font-extrabold">Servicios</Text>
        </View>

        {loading ? (
          <View className="flex items-center justify-center py-10">
            <ActivityIndicator size="large" color="#30D4D1" />
          </View>
        ) : (
          filasDeServicios.map((fila, rowIndex) => (
            <View key={`row-${rowIndex}`} className="flex-row justify-between gap-4 mb-5">
              {fila.map((servicio) => (
                <Pressable
                  key={servicio.id}
                  className="flex flex-col items-center gap-3 w-24"
                  onPress={() => {
                    if (servicio.hasChildren) {
                      router.push(
                        `/tabs/servicios/children?id=${servicio.id}&category_name=${servicio.name}&category_img_uri=${servicio.category_img_uri}`,
                      );
                    } else {
                      router.push(
                        `/tabs/servicios/form?id=${servicio.id}&category_name=${servicio.name}&category_img_uri=${servicio.category_img_uri}`,
                      );
                    }
                  }}
                >
                  <View className="h-24 w-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <Image
                      source={{
                        uri: servicio.category_img_uri + "?t=" + dateKey,
                      }}
                      className="h-12 w-12 object-scale-down"
                    />
                  </View>
                  <Text className="font-extrabold text-sm w-full text-center break-words">
                    {servicio.name}
                  </Text>
                </Pressable>
              ))}
              {Array(3 - fila.length)
                .fill(null)
                .map((_, idx) => (
                  <View key={`empty-${idx}`} className="h-24 w-24" />
                ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
