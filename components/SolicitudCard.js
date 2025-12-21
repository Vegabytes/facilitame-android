import { useRouter } from "expo-router";
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import EstadoColor from "./EstadoColor";

const SolicitudCard = ({ solicitud }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(app)/tabs/mis-solicitudes/solicitud?id=${solicitud.id}`)
      }
      activeOpacity={0.7}
    >
      <View className="bg-white p-4 mb-4 rounded-2xl">
        {/* Header con imagen y título */}
        <View className="flex-row items-center gap-4 mb-3">
          <View className="h-12 w-12 rounded-full bg-background items-center justify-center overflow-hidden">
            {solicitud.category_img_uri ? (
              <Image
                source={{ uri: solicitud.category_img_uri }}
                className="h-8 w-8"
                resizeMode="contain"
              />
            ) : (
              <Text className="text-xl">📋</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="font-extrabold text-base" numberOfLines={1}>
              {solicitud.category_name || "Solicitud"}
            </Text>
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {solicitud.request_info || "Sin descripción"}
            </Text>
          </View>
        </View>

        {/* Separador */}
        <View className="h-px bg-bright mb-3" />

        {/* Info row */}
        <View className="flex-row items-center">
          <View className="flex-1">
            <Text className="text-gray-400 text-xs">Solicitud</Text>
            <Text className="text-sm">{solicitud.created_at_display}</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-gray-400 text-xs">Estado</Text>
            <EstadoColor status_id={solicitud.status_id}>
              {solicitud.status}
            </EstadoColor>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-gray-400 text-xs">Actualizado</Text>
            <Text className="text-sm">{solicitud.updated_at_display}</Text>
          </View>
        </View>

        {/* Badge de incidencia si existe */}
        {solicitud.has_incident && (
          <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center">
            <View className="bg-yellow-100 px-3 py-1 rounded-full flex-row items-center">
              <Text className="text-yellow-600 text-xs font-bold">
                ⚠️ Incidencia abierta
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SolicitudCard;
