/**
 * Componente de input reutilizable
 * Soporta diferentes tipos y estados de error
 * Incluye toggle para mostrar/ocultar contraseña
 */

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

export default function Input({
  label = null,
  placeholder,
  value,
  onChangeText,
  error = null,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  numberOfLines = 1,
  editable = true,
  className = "",
}) {
  const [showPassword, setShowPassword] = useState(false);
  const borderClass = error ? "border-red-500" : "border-bright";
  const heightClass = multiline ? "h-auto min-h-[100px]" : "h-14";

  // Determinar si debe ocultar el texto (solo si es secure y no se ha activado showPassword)
  const isSecure = secureTextEntry && !showPassword;

  return (
    <View className={`w-full mb-2 ${className}`}>
      {label && (
        <Text className="font-semibold mb-1 ml-1 text-gray-700">{label}</Text>
      )}
      <View className="relative">
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          className={`w-full ${heightClass} px-5 ${secureTextEntry ? 'pr-20' : ''} bg-white rounded-2xl border-2 ${borderClass} ${!editable ? 'bg-gray-100' : ''}`}
          style={multiline ? { textAlignVertical: 'top', paddingTop: 12 } : {}}
        />
        {secureTextEntry && (
          <TouchableOpacity
            className="absolute right-4 top-0 bottom-0 justify-center px-2"
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            accessibilityRole="button"
          >
            <Text className="text-sm text-gray-500 font-medium">
              {showPassword ? "Ocultar" : "Mostrar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-white text-sm mt-1 ml-1 bg-red-500/80 px-2 py-1 rounded">
          {error}
        </Text>
      )}
    </View>
  );
}
