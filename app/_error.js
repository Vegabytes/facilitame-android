import React, { useEffect } from "react";
import { Alert, View, Text, StyleSheet, Button } from "react-native";

export default function ErrorScreen({ error, reset }) {
  const message = error?.message || "Ha ocurrido un error inesperado.";

  useEffect(() => {
    Alert.alert("Error", message, [
      {
        text: "Reintentar",
        onPress: () => reset(),
      },
    ]);
  }, [message, reset]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Reintentar" onPress={reset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 16, textAlign: "center", marginBottom: 20 },
});
