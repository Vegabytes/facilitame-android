/**
 * Componente de input reutilizable
 * Soporta diferentes tipos y estados de error
 */

import { View, Text, TextInput } from "react-native";

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
  const borderClass = error ? "border-red-500" : "border-bright";
  const heightClass = multiline ? "h-auto min-h-[100px]" : "h-14";

  return (
    <View className={`w-full mb-2 ${className}`}>
      {label && (
        <Text className="font-semibold mb-1 ml-1 text-gray-700">{label}</Text>
      )}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        className={`w-full ${heightClass} px-5 bg-white rounded-2xl border-2 ${borderClass} ${!editable ? 'bg-gray-100' : ''}`}
        style={multiline ? { textAlignVertical: 'top', paddingTop: 12 } : {}}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
