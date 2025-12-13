/**
 * Componente de botón reutilizable
 * Soporta diferentes variantes y estados
 */

import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

const VARIANTS = {
  primary: {
    container: "bg-button",
    text: "text-white",
  },
  secondary: {
    container: "bg-primary",
    text: "text-white",
  },
  outline: {
    container: "bg-background border border-button",
    text: "text-button",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-button",
  },
};

const SIZES = {
  sm: {
    container: "h-10 px-4",
    text: "text-sm",
  },
  md: {
    container: "h-14 px-6",
    text: "text-base",
  },
  lg: {
    container: "h-16 px-8",
    text: "text-lg",
  },
};

export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  fullWidth = true,
  className = "",
}) {
  const variantStyle = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyle = SIZES[size] || SIZES.lg;
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50" : "";

  return (
    <TouchableOpacity
      className={`${variantStyle.container} ${sizeStyle.container} ${widthClass} ${disabledClass} rounded-full flex-row items-center justify-center ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text className={`${variantStyle.text} ${sizeStyle.text} font-semibold text-center`}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
