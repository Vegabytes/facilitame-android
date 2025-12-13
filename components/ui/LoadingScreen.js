/**
 * Componente de pantalla de carga reutilizable
 * Muestra un indicador de carga centrado con fondo opcional
 */

import { View, ActivityIndicator, Text } from "react-native";
import { COLORS } from "../../utils/constants";

export default function LoadingScreen({
  message = null,
  size = "large",
  color = COLORS.primary,
  fullScreen = true
}) {
  const containerClass = fullScreen
    ? "flex-1 justify-center items-center bg-background"
    : "justify-center items-center py-10";

  return (
    <View className={containerClass}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text className="mt-4 text-gray-600 text-center">{message}</Text>
      )}
    </View>
  );
}
