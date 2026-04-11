/**
 * Pantalla para vincular cuenta con asesoría usando código
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchWithAuth } from "../../../../utils/api";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

export default function VincularAsesoria() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatCode = (text) => {
    // Convertir a mayúsculas y quitar espacios
    let formatted = text.toUpperCase().replace(/\s/g, "");

    // Si empieza con ASE-, mantenerlo
    // Si no, agregarlo automáticamente si el usuario escribe el código sin prefijo
    if (
      formatted.length > 0 &&
      !formatted.startsWith("ASE-") &&
      !formatted.startsWith("ASE")
    ) {
      // Solo agregar ASE- si el usuario está escribiendo el código numérico
      if (/^\d/.test(formatted)) {
        formatted = "ASE-" + formatted;
      }
    }

    // Formatear como ASE-XXXXXXXXX
    if (formatted.startsWith("ASE") && !formatted.startsWith("ASE-")) {
      formatted = "ASE-" + formatted.substring(3);
    }

    return formatted;
  };

  const handleCodeChange = (text) => {
    setError(null);
    setCode(formatCode(text));
  };

  const validateCode = () => {
    if (!code || code.length < 5) {
      setError("Introduce un código válido");
      return false;
    }

    // Validar formato ASE-XXXXXXXXX
    const codeRegex = /^ASE-[A-Z0-9]{6,12}$/;
    if (!codeRegex.test(code)) {
      setError("El código debe tener el formato ASE-XXXXXXXXX");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateCode()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth("customer-link-advisory", {
        advisory_code: code,
      });

      if (response?.status === "ok") {
        Alert.alert(
          "¡Vinculación exitosa!",
          response.message_html ||
            "Te has vinculado correctamente a la asesoría.",
          [
            {
              text: "Continuar",
              onPress: () => router.replace("/tabs/asesorias"),
            },
          ],
        );
      } else {
        setError(
          response?.message_html ||
            response?.message_plain ||
            "No se pudo vincular con la asesoría",
        );
      }
    } catch (_err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 100}
    >
      <ScrollView className="flex-1 bg-background">
        <View className="p-5">
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Text className="text-button text-lg font-semibold">← Volver</Text>
          </TouchableOpacity>

          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-button">
              Vincular asesoría
            </Text>
            <Text className="text-base text-gray-600 mt-2">
              Introduce el código que te ha proporcionado tu asesor
            </Text>
          </View>

          {/* Formulario */}
          <View className="bg-white p-6 rounded-2xl mb-5">
            <View className="items-center mb-6">
              <View className="bg-primary/10 p-4 rounded-full mb-3">
                <Text className="text-4xl">🔐</Text>
              </View>
            </View>

            <Input
              label="Código de asesoría"
              placeholder="ASE-XXXXXXXXX"
              value={code}
              onChangeText={handleCodeChange}
              error={error}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Código de asesoría"
              accessibilityHint="Introduce el código de 12 caracteres que te proporcionó tu asesor"
            />

            <View className="mt-4">
              <Button
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !code}
                accessibilityLabel="Vincular asesoría"
              >
                Vincular
              </Button>
            </View>
          </View>

          {/* Ayuda */}
          <View className="bg-blue-50 p-4 rounded-xl mb-4">
            <Text className="text-blue-800 font-semibold mb-2">
              ¿Dónde encuentro el código?
            </Text>
            <Text className="text-blue-700">
              Tu asesor te proporcionará un código único con el formato
              ASE-XXXXXXXXX. Este código te permite acceder a todas las
              funcionalidades de comunicación con tu asesoría.
            </Text>
          </View>

          <View className="bg-amber-50 p-4 rounded-xl">
            <Text className="text-amber-800 font-semibold mb-2">
              ¿Problemas para vincular?
            </Text>
            <Text className="text-amber-700">
              Verifica que el código esté bien escrito. Si el problema persiste,
              contacta directamente con tu asesoría para obtener un nuevo
              código.
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
