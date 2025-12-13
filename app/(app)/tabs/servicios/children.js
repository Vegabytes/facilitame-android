import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fetchWithAuth } from "./../../../../utils/api.js";

export default function ChildrenScreen() {
  const { id, category_name, category_img_uri } = useLocalSearchParams();
  const router = useRouter();
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubcategorias = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("app-subcategories-get", {
        parent_id: id,
      });

      if (!response || !Array.isArray(response.data)) {
        throw new Error("La API no devolvió los datos esperados.");
      }

      setSubcategorias(response.data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los subcategorias.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubcategorias();
    }, [id]),
  );

  return (
    <ScrollView className="bg-background py-4 px-6">
      <View className="my-5">
        <Text className="text-2xl font-extrabold">{category_name}</Text>
      </View>

      {loading ? (
        <View className="flex items-center justify-center py-10">
          <ActivityIndicator size="large" color="#30D4D1" />
        </View>
      ) : (
        subcategorias.map((servicio) => (
          <Pressable
            onPress={() => {
              router.push(
                `/tabs/servicios/form?id=${servicio.id}&category_name=${servicio.name}&category_img_uri=${category_img_uri}`,
              );
            }}
          >
            <View className="w-full h-auto m-0 p-5 flex-row items-center gap-5 rounded-2xl bg-white mb-5">
              <View key={servicio.id} className="p-4">
                <Text className="font-extrabold">{servicio.name}</Text>
              </View>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
