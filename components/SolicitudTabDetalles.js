import React, { useContext } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SolicitudContext } from "../context/SolicitudContext";

const SolicitudTabDetalles = () => {
  const { solicitud } = useContext(SolicitudContext);

  let formValues = [];
  if (solicitud && solicitud.form_values) {
    try {
      const parsedFormValues = JSON.parse(solicitud.form_values);
      formValues =
        typeof parsedFormValues === "string"
          ? JSON.parse(parsedFormValues)
          : parsedFormValues;
    } catch (error) {
      console.error("Error al parsear form_values:", error);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {formValues.length > 0 ? (
        formValues.map(
          (item, index) =>
            item?.name?.trim() && item?.value?.trim() ? ( // Asegura que existen antes de llamar a trim()
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
            ) : null, // Si no cumplen la condición, no renderiza nada
        )
      ) : (
        <Text style={styles.noData}>No hay datos para mostrar.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  itemContainer: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemValue: {
    fontSize: 16,
    color: "#666",
  },
  noData: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
  },
});

export default SolicitudTabDetalles;
