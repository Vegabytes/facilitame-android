import { Tabs } from "expo-router";
import { Image } from "react-native";

function TabIcon({ source }) {
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{ width: 30, height: 30 }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 60,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          marginTop: 3,
          marginBottom: 0,
          fontWeight: "bold",
          color: "black",
        },
        animation: "fade",
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={
                focused
                  ? require("../../../assets/inicio-active.png")
                  : require("../../../assets/inicio.png")
              }
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: route.name }],
            });
          },
        })}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          tabBarLabel: "Servicios",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={
                focused
                  ? require("../../../assets/servicios-active.png")
                  : require("../../../assets/servicios.png")
              }
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: route.name }],
            });
          },
        })}
      />
      <Tabs.Screen
        name="mis-solicitudes"
        options={{
          tabBarLabel: "Mis solicitudes",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={
                focused
                  ? require("../../../assets/mis-solicitudes-active.png")
                  : require("../../../assets/mis-solicitudes.png")
              }
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: route.name }],
            });
          },
        })}
      />
      <Tabs.Screen
        name="mi-cuenta"
        options={{
          tabBarLabel: "Mi cuenta",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={
                focused
                  ? require("../../../assets/mi-cuenta-active.png")
                  : require("../../../assets/mi-cuenta.png")
              }
            />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.reset({
              index: 0,
              routes: [{ name: route.name }],
            });
          },
        })}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: {
            display: "none",
          },
        }}
      />
    </Tabs>
  );
}
