import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";

const BackButton = ({ title = "Atrás", to }) => {
  const router = useRouter();

  const handlePress = () => {
    if (to) {
      router.push(to);
    } else {
      router.back();
    }
  };

  return (
    Platform.OS === "ios" && (
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.text}>
          ↤{"  "}
          {title}
        </Text>
      </TouchableOpacity>
    )
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#97E9E8",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default BackButton;
