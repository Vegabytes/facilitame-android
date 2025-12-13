/**
 * Componente de pantalla de error reutilizable
 * Muestra un mensaje de error con opción de reintentar
 */

import { View, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../../utils/constants";

export default function ErrorScreen({
  message = "Ha ocurrido un error",
  onRetry = null,
  retryText = "Reintentar",
  fullScreen = true
}) {
  const containerClass = fullScreen
    ? "flex-1 justify-center items-center bg-background p-5"
    : "justify-center items-center py-10 px-5";

  return (
    <View className={containerClass}>
      <Text className="text-lg text-center text-gray-700 mb-4">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
