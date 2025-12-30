import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";

function TabIcon({ source, sourceActive, focused }) {
  // Si hay versión activa, usar esa imagen cuando está focused
  if (sourceActive) {
    return (
      <Image
        source={focused ? sourceActive : source}
        resizeMode="contain"
        style={{ width: 30, height: 30 }}
      />
    );
  }

  // Si no hay versión activa, aplicar tintColor
  return (
    <Image
      source={source}
      resizeMode="contain"
      style={{
        width: 30,
        height: 30,
        tintColor: focused ? "#30D4D1" : "#888888"
      }}
    />
  );
}

export default function TabsLayout() {
  const { hasServicesEnabled } = useAuth();

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
      {/* 1. Inicio - Solo visible si tiene servicios */}
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/inicio.png")}
              sourceActive={require("../../../assets/inicio-active.png")}
              focused={focused}
            />
          ),
          href: hasServicesEnabled ? undefined : null,
          tabBarItemStyle: hasServicesEnabled ? {} : { display: "none" },
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
      {/* 2. Servicios - Solo visible si tiene servicios */}
      <Tabs.Screen
        name="servicios"
        options={{
          tabBarLabel: "Servicios",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/servicios.png")}
              sourceActive={require("../../../assets/servicios-active.png")}
              focused={focused}
            />
          ),
          href: hasServicesEnabled ? undefined : null,
          tabBarItemStyle: hasServicesEnabled ? {} : { display: "none" },
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
      {/* 3. Asesoría */}
      <Tabs.Screen
        name="asesorias"
        options={{
          tabBarLabel: "Asesoría",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/icon-document.png")}
              focused={focused}
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
      {/* 4. Mis Servicios - Solo visible si tiene servicios */}
      <Tabs.Screen
        name="mis-solicitudes"
        options={{
          tabBarLabel: "Mis Servicios",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/mis-solicitudes.png")}
              sourceActive={require("../../../assets/mis-solicitudes-active.png")}
              focused={focused}
            />
          ),
          href: hasServicesEnabled ? undefined : null,
          tabBarItemStyle: hasServicesEnabled ? {} : { display: "none" },
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
      {/* 5. Perfil */}
      <Tabs.Screen
        name="mi-cuenta"
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/mi-cuenta.png")}
              sourceActive={require("../../../assets/mi-cuenta-active.png")}
              focused={focused}
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
      {/* Ocultos */}
      <Tabs.Screen
        name="notificaciones"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: {
            display: "none",
          },
        }}
      />
      <Tabs.Screen
        name="incidencias"
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
