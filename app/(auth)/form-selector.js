import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function FormSelectorScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <View
      className="bg-primary"
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text className="text-button font-black text-3xl text-center mb-5">
        Cuéntanos un poco sobre ti
      </Text>

      <TouchableOpacity
        className="h-16 bg-background w-full rounded-full mb-4 border border-button flex flex-row justify-center items-center"
        onPress={() => router.push("/(auth)/form-particular")}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-button text-center text-lg">
            Soy un particular
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="h-16 bg-background w-full rounded-full mb-4 border border-button flex flex-row justify-center items-center"
        onPress={() => router.push("/(auth)/form-autonomo")}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-button text-center text-lg">
            Soy un autónomo
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="h-16 bg-background w-full rounded-full mb-4 border border-button flex flex-row justify-center items-center"
        onPress={() => router.push("/(auth)/form-empresa")}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-button text-center text-lg">
            Soy una empresa
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
