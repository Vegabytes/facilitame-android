import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, Image } from "react-native";

export default function SignUpOkScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.replace("/tabs/inicio");
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <View className="flex flex-1 bg-background justify-center items-center">
      <Image
        source={require("../../../../assets/icon-check-circle.png")}
        className="h-32 w-32 object-contain mb-5"
      ></Image>
      <Text className="text-4xl font-extrabold text-button mb-2">
        ¡Solicitud recibida!
      </Text>
      <Text className="text-lg font-bold text-button text-center">
        Nos pondremos en contacto contigo cuanto antes
      </Text>
    </View>
  );
}
