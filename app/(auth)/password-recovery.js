import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handlePasswordRecovery = async () => {
    let valid = true;
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "El email es obligatorio";
      valid = false;
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim())) {
      newErrors.email = "El email no es válido";
      valid = false;
    }
    setErrors(newErrors);

    if (!valid) {
      return;
    }

    setErrorMessage("");

    try {
      const payload = {
        email,
      };

      const formBody = Object.keys(payload)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`,
        )
        .join("&");

      const response = await fetch("https://app.facilitame.es/api/recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      });

      const json = await response.json();

      if (json.status === "ok") {
        router.replace("/(auth)/ok-recovery");
      } else {
        setErrorMessage(
          json.message_html || "Error en la recuperación de contraseña",
        );
      }
    } catch (error) {
      setErrorMessage("Error en la recuperación de contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <ScrollView
        className="bg-background p-4"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          className="text-button font-black text-center mb-5"
          style={{ fontSize: 20 }}
        >
          No te preocupes.
        </Text>
        <Text
          className="text-button text-center mb-10"
          style={{ fontSize: 18, fontWeight: 600 }}
        >
          Escribe el correo electrónico que usaste en el registro y te
          ayudaremos
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          className="w-full h-14 px-5 mb-10 bg-white rounded-2xl border-bright border-2"
        />
        {errors.email && <Text style={{ color: "red" }}>{errors.email}</Text>}

        {errorMessage !== "" && (
          <Text style={{ color: "red", marginBottom: 20, fontWeight: 800 }}>
            {errorMessage}
          </Text>
        )}

        <TouchableOpacity
          className="h-16 bg-button w-full rounded-full mb-2 flex flex-row items-center justify-center"
          onPress={handlePasswordRecovery}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-center text-lg">
              Recuperar contraseña
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
