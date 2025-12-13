/**
 * Componente de tarjeta reutilizable
 * Base para contenedores con estilo consistente
 */

import { View, Text } from "react-native";

const VARIANTS = {
  white: "bg-white",
  primary: "bg-primary",
  dark: "bg-button",
};

export default function Card({
  children,
  variant = "white",
  title = null,
  className = "",
  padding = true,
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.white;
  const paddingClass = padding ? "p-5" : "";

  return (
    <View className={`${variantClass} ${paddingClass} rounded-2xl mb-3 ${className}`}>
      {title && (
        <Text className="text-xl font-semibold text-button mb-4">{title}</Text>
      )}
      {children}
    </View>
  );
}
