import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";

const vencimientos = {
  "Menos de 30 días": [
    {
      id: "1",
      categoria: "Renting",
      detalle: "4089DHB",
      fecha: "May 10, 2021",
      ahorro: "1.234,56 €",
    },
    {
      id: "3",
      categoria: "Renting",
      detalle: "4089DHB",
      fecha: "May 10, 2021",
      ahorro: "1.234,56 €",
    },
  ],
  "Menos de 60 días": [
    {
      id: "2",
      categoria: "Energía y Gas",
      detalle: "Casa",
      fecha: "May 10, 2021",
      ahorro: "1.234,56 €",
    },
  ],
  "Más de 60 días": [],
};

export default function ProximosVencimientos() {
  const [selectedTab, setSelectedTab] = useState("Menos de 60 días");

  return (
    <View className="bg-background p-4 rounded-xl shadow-lg">
      {/* TABS */}
      <View className="flex-row justify-between mt-4">
        {Object.keys(vencimientos).map((tab) => (
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
              <Text className="text-green-600 font-semibold">
                Ahorro: {item.ahorro}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}
