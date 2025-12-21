/**
 * Pantalla de recuperación de contraseña
 */

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchPublic } from "../../utils/api";
import { Button, Input } from "../../components/ui";
import { VALIDATION_REGEX, ERROR_MESSAGES } from "../../utils/constants";

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = ERROR_MESSAGES.validation.required;
    } else if (!VALIDATION_REGEX.email.test(email.trim())) {
      newErrors.email = ERROR_MESSAGES.validation.email;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordRecovery = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPublic("recovery", {
        email: email.trim(),
      });

      if (response.status === "ok") {
        router.replace("/(auth)/ok-recovery");
      } else {
        // Usar message_plain para evitar XSS
        setErrorMessage(
          response.message_plain || "Error en la recuperación de contraseña"
        );
      }
    } catch (error) {
      setErrorMessage(ERROR_MESSAGES.network);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{
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
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-button font-black text-center mb-5 text-xl">
          No te preocupes.
        </Text>
        <Text className="text-button text-center mb-10 text-lg font-semibold">
          Escribe el correo electrónico que usaste en el registro y te
          ayudaremos
        </Text>

        <Input
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) setErrors({});
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />

        {errorMessage ? (
          <Text className="text-center my-4 text-white font-bold bg-red-500/30 p-3 rounded-lg w-full">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          onPress={handlePasswordRecovery}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Recuperar contraseña
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
