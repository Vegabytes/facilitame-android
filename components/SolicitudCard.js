import { useRouter } from "expo-router";
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import EstadoColor from "./EstadoColor";

const SolicitudCard = ({ solicitud }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/(app)/tabs/mis-solicitudes/solicitud?id=${solicitud.id}`)
      }
    >
      <View className="bg-white p-5 mb-5 rounded-lg flex flex-column">
        <View className="flex flex-row justify-start gap-5 items-center">
          <View>
            <Image
              source={
                solicitud.category_img_uri
                  ? { uri: `${solicitud.category_img_uri}` }
                  : ""
              }
              className="h-10 w-10 object-contain"
            />
          </View>
          <View>
            <Text className="font-extrabold text-lg">
              {solicitud.category_name || "Título de la solicitud"}
            </Text>
            <Text>
              {solicitud.request_info || "Descripción de la solicitud"}
            </Text>
          </View>
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: "#30D4D1",
            marginTop: 10,
            marginBottom: 15,
          }}
        />

        <View className="flex flex-row justify-between">
          <View
            className=""
            style={{
              flex: 2,
              flexDirection: "column",
              justifyContent: "space-between",
              paddingBottom: 4,
            }}
          >
            <Text>Solicitud</Text>
            <Text>{solicitud.created_at_display}</Text>
          </View>
          <View className="flex flex-column items-center" style={{ flex: 4 }}>
            <Text>Estado</Text>
            <EstadoColor status_id={solicitud.status_id}>
              {solicitud.status}
            </EstadoColor>
            {/* <Text>{solicitud.status}</Text> */}
          </View>
          <View
            className=""
            style={{
              flex: 2,
              flexDirection: "column",
              justifyContent: "space-between",
              paddingBottom: 4,
            }}
          >
            <Text className="">Actualizado</Text>
            <Text className="">{solicitud.updated_at_display}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SolicitudCard;
