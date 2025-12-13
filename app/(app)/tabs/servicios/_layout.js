import { Stack } from "expo-router";

export default function Tab2Layout() {
  return (
    <Stack
      screenOptions={{
        animation: "fade",
        headerShown: false,
      }}
    />
  );
}
