import { useRouter } from "expo-router";
import React from "react";
import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import SolicitudTabOfertas from "./SolicitudTabOfertas";
import SolicitudTabDocumentos from "./SolicitudTabDocumentos";
import SolicitudTabDetalles from "./SolicitudTabDetalles";

const SolicitudTabNavigator = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Ofertas");

  return (
    <View className="bg-white px-2 rounded-lg" style={{ paddingTop: 5 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {["Ofertas", "Detalles", "Documentos"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ display: "flex", flex: 1, alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 15,
                padding: 10,
                paddingBottom: 5,
                marginBottom: 20,
                fontWeight: activeTab === tab ? "bold" : "normal",
                borderBottomWidth: activeTab === tab ? 3 : 0,
                borderBottomColor: "#30D4D1",
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === "Ofertas" && <SolicitudTabOfertas />}
      {activeTab === "Detalles" && <SolicitudTabDetalles />}
      {activeTab === "Documentos" && <SolicitudTabDocumentos />}
    </View>
  );
};

export default SolicitudTabNavigator;
