/**
 * Pantalla de inicio de sesión
 */

import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { fetchPublic } from "../../utils/api";
import { Button, Input } from "../../components/ui";
import { VALIDATION_REGEX } from "../../utils/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const { login, isAuthenticated, isReady, hasServicesEnabled, hasAdvisory, isGuest } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado, según el tipo de usuario
  useEffect(() => {
    if (isAuthenticated && isReady) {
      if (!hasServicesEnabled && hasAdvisory && !isGuest) {
        router.replace("/(app)/tabs/asesorias");
      } else {
        router.replace("/(app)/tabs/inicio");
      }
    }
  }, [isAuthenticated, isReady, hasServicesEnabled, hasAdvisory, isGuest, router]);

  /**
   * Valida los campos del formulario
   */
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!VALIDATION_REGEX.email.test(email.trim())) {
      newErrors.email = "El email no es válido";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Realiza el proceso de login
   */
  const performLogin = async (userEmail, userPassword, isGuest = false) => {
    const setLoading = isGuest ? setIsGuestLoading : setIsLoading;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPublic("login", {
        email: userEmail,
        password: userPassword,
      });

      if (response.status === "ok" && response.auth_token) {
        await login(response.auth_token);
      } else {
        setErrorMessage(response.message_plain || "Error en la autenticación");
      }
    } catch (error) {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el login normal
   */
  const handleLogin = async () => {
    if (!validateForm()) return;
    await performLogin(email.trim(), password);
  };

  /**
   * Maneja el login como invitado
   * Usa endpoint dedicado para obtener token de invitado (sin credenciales en código)
   */
  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchPublic("guest-login", {
        device: "mobile",
      });

      if (response.status === "ok" && response.auth_token) {
        await login(response.auth_token);
      } else {
        setErrorMessage(response.message_plain || "Error al acceder como invitado");
      }
    } catch (error) {
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-5 bg-primary">
      {/* Logo con texto */}
      <View className="w-full aspect-[500/82] self-center">
        <Image
          source={require("../../assets/facilitame-letras-logo.png")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Logo principal */}
      <View className="w-[125px] aspect-square self-center mb-10 mt-8">
        <Image
          source={require("../../assets/facilitame-logo-principal.png")}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>

      {/* Campos de formulario */}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: null });
        }}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email}
      />

      <Input
        placeholder="Contraseña"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: null });
        }}
        secureTextEntry
        error={errors.password}
      />

      {/* Botón de acceder */}
      <Button
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading || isGuestLoading}
        className="mt-2"
      >
        Acceder
      </Button>

      {/* Enlace de recuperar contraseña */}
      <TouchableOpacity
        className="mt-4 w-full"
        onPress={() => router.push("/(auth)/password-recovery")}
      >
        <Text className="text-button text-center text-lg font-semibold">
          ¿Has olvidado tu contraseña?
        </Text>
      </TouchableOpacity>

      {/* Mensaje de error */}
      {errorMessage ? (
        <Text className="text-center my-4 text-white font-bold bg-red-500/20 p-3 rounded-lg w-full">
          {errorMessage}
        </Text>
      ) : (
        <View className="my-4" />
      )}

      {/* Texto invitado */}
      <Text className="text-center my-3 text-button">
        Si quieres conocer qué te puede ofrecer Facilítame...
      </Text>

      {/* Botón de acceso como invitado */}
      <Button
        variant="outline"
        onPress={handleGuestLogin}
        loading={isGuestLoading}
        disabled={isLoading || isGuestLoading}
      >
        Accede como invitado
      </Button>

      {/* Enlace de registro */}
      <TouchableOpacity
        className="mt-6 w-full"
        onPress={() => router.push("/(auth)/form-selector")}
      >
        <View className="flex-row justify-center gap-2">
          <Text className="text-button text-center text-lg font-bold">
            ¿Aún no tienes una cuenta?
          </Text>
          <Text className="text-button text-center text-lg font-extrabold">
            ¡Regístrate ahora!
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
