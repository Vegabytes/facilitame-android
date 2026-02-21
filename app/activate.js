/**
 * Pantalla de activación de cuenta (deep link)
 * Maneja /activate?token=xxx desde emails de activación
 * Si el usuario necesita contraseña, muestra formulario.
 * Si ya tiene contraseña, activa directamente.
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

export default function ActivateScreen() {
  const { token } = useLocalSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading"); // loading, password, success, error
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Enlace de activación no válido");
      setStatus("error");
      return;
    }
    checkToken();
  }, [token]);

  const checkToken = async () => {
    try {
      const response = await fetchPublic("activate-check", { token });

      if (response.status === "ok") {
        if (response.data?.already_active || response.data?.activated) {
          setSuccessMessage(response.message || "¡Cuenta activada! Ya puedes iniciar sesión");
          setStatus("success");
        } else if (response.data?.needs_password) {
          setStatus("password");
        } else {
          setSuccessMessage("¡Cuenta activada! Ya puedes iniciar sesión");
          setStatus("success");
        }
      } else {
        setErrorMessage(response.message || "Error al verificar el enlace");
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage(ERROR_MESSAGES.network);
      setStatus("error");
    }
  };

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

  const handleActivate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPublic("activate-with-password", {
        token,
        password: password.trim(),
        password_confirm: passwordConfirm.trim(),
      });

      if (response.status === "ok") {
        setSuccessMessage(response.message || "¡Cuenta activada! Ya puedes iniciar sesión");
        setStatus("success");
      } else {
        setErrorMessage(response.message || "Error al activar la cuenta");
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

  // Loading
  if (status === "loading") {
    return (
      <SafeAreaView
        className="flex-1 bg-background justify-center items-center"
        style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
      >
        <ActivityIndicator size="large" color="#30D4D1" />
        <Text className="text-button mt-4 text-lg">Verificando enlace...</Text>
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
            ¡Cuenta activada!
          </Text>
          <Text className="text-lg font-bold text-button text-center">
            {successMessage}
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

  // Error
  if (status === "error") {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
      >
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-2xl font-extrabold text-button mb-4">
            Error de activación
          </Text>
          <Text className="text-lg text-button text-center mb-6">
            {errorMessage}
          </Text>
          <TouchableOpacity
            className="h-16 mt-4 bg-button w-full rounded-full mb-2 border border-button flex flex-row justify-center items-center"
            onPress={goToLogin}
          >
            <Text className="text-white text-center text-lg">Ir al inicio de sesión</Text>
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
          ¡Último paso!
        </Text>
        <Text className="text-button text-center mb-8 text-lg font-semibold">
          Crea una contraseña para tu cuenta
        </Text>

        <Input
          placeholder="Contraseña"
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
          onPress={handleActivate}
          loading={isLoading}
          disabled={isLoading}
          className="mt-6"
        >
          Activar cuenta
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
