import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Image, TouchableOpacity } from "react-native";

export default function RequestOkScreen() {
  const router = useRouter();

  return (
    <View className="flex flex-1 bg-background justify-center items-center p-4">
      <Image
        source={require("../../assets/icon-check-circle.png")}
        className="h-32 w-32 object-contain mb-5"
      ></Image>
      <Text className="text-4xl font-extrabold text-button mb-2">
        ¡Cuenta creada!
      </Text>
      <Text className="text-lg font-bold text-button text-center">
        Te hemos enviado un email con un enlace para que la actives cuanto
        antes,
      </Text>
      <Text className="text-lg font-bold text-button text-center font-extrabold">
        ¡comprueba tu correo!
      </Text>
      <TouchableOpacity
        className="h-16 mt-10 bg-button w-full rounded-full mb-2 border border-button flex flex-row justify-center items-center"
        onPress={() => router.replace("/(auth)/login")}
      >
        <Text className="text-white text-center text-lg">Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
