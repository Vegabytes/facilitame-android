/**
 * Pantalla de restablecimiento de contraseña (deep link)
 * Maneja /restore?token=xxx desde emails de recuperación
 */

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { fetchPublic } from "../utils/api";
import { Button, Input } from "../components/ui";
import { ERROR_MESSAGES } from "../utils/constants";

export default function RestoreScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("form"); // form, success, error
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Enlace de recuperación no válido");
      setStatus("error");
    }
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = "Debe contener letras y números";
    }

    if (!passwordConfirm.trim()) {
      newErrors.passwordConfirm = "Confirma la contraseña";
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRestore = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPublic("restore", {
        token,
        password: password.trim(),
        "confirm-password": passwordConfirm.trim(),
      });

      if (response.status === "ok") {
        setStatus("success");
      } else {
        const msg = response.message || response.message_plain || "";
        if (msg.includes("caducado")) {
          setErrorMessage("Este enlace de recuperación ha caducado. Solicita uno nuevo.");
        } else if (msg.includes("utilizado")) {
          setErrorMessage("Este enlace ya ha sido utilizado. Solicita uno nuevo si lo necesitas.");
        } else if (msg.includes("no coinciden")) {
          setErrorMessage("Las contraseñas no coinciden");
        } else {
          setErrorMessage(msg || "Error al restablecer la contraseña");
        }
      }
    } catch (error) {
      setErrorMessage(ERROR_MESSAGES.network);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    router.replace("/(auth)/login");
  };

  const goToRecovery = () => {
    router.replace("/(auth)/password-recovery");
  };

  // Error (invalid/expired token)
  if (status === "error") {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
      >
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-2xl font-extrabold text-button mb-4">
            Enlace no válido
          </Text>
          <Text className="text-lg text-button text-center mb-6">
            {errorMessage}
          </Text>
          <TouchableOpacity
            className="h-16 mt-4 bg-button w-full rounded-full mb-2 border border-button flex flex-row justify-center items-center"
            onPress={goToRecovery}
          >
            <Text className="text-white text-center text-lg">Solicitar nuevo enlace</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-4" onPress={goToLogin}>
            <Text className="text-button font-semibold text-center">
              Ir al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success
  if (status === "success") {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
      >
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-6xl mb-5">✓</Text>
          <Text className="text-4xl font-extrabold text-button mb-2">
            ¡Contraseña actualizada!
          </Text>
          <Text className="text-lg font-bold text-button text-center">
            Ya puedes iniciar sesión con tu nueva contraseña
          </Text>
          <TouchableOpacity
            className="h-16 mt-10 bg-button w-full rounded-full mb-2 border border-button flex flex-row justify-center items-center"
            onPress={goToLogin}
          >
            <Text className="text-white text-center text-lg">Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Password form
  return (
    <SafeAreaView
      className="flex-1"
      style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
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
        <Text className="text-button font-black text-center mb-3 text-xl">
          Nueva contraseña
        </Text>
        <Text className="text-button text-center mb-8 text-lg font-semibold">
          Introduce tu nueva contraseña
        </Text>

        <Input
          placeholder="Nueva contraseña"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          }}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          error={errors.password}
        />

        <Input
          placeholder="Confirmar contraseña"
          value={passwordConfirm}
          onChangeText={(text) => {
            setPasswordConfirm(text);
            if (errors.passwordConfirm) setErrors((e) => ({ ...e, passwordConfirm: undefined }));
          }}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          error={errors.passwordConfirm}
          className="mt-3"
        />

        <Text className="text-gray-500 text-sm mt-2 text-center">
          Mínimo 8 caracteres con letras y números
        </Text>

        {errorMessage ? (
          <Text className="text-center my-4 text-white font-bold bg-red-500/30 p-3 rounded-lg w-full">
            {errorMessage}
          </Text>
        ) : null}

        <Button
          onPress={handleRestore}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Restablecer contraseña
        </Button>

        <TouchableOpacity className="mt-4" onPress={goToLogin}>
          <Text className="text-button font-semibold text-center">
            Volver al inicio de sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
