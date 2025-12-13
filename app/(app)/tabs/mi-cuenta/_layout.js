import { Stack } from "expo-router";

export default function MiCuentaLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        headerShown: false,
      }}
    />
  );
}
