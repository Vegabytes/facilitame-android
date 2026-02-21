import { Tabs, Redirect } from "expo-router";
import { Image, View, Platform } from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import { usePathname } from "expo-router";

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
  const { hasServicesEnabled, hasAdvisory, isGuest, refreshServicesStatus, isReady } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Refrescar estado de servicios al montar el layout
  useEffect(() => {
    const loadServices = async () => {
      await refreshServicesStatus();
      setServicesLoaded(true);
    };
    loadServices();
  }, []);

  // Esperar a que se cargue el estado de servicios antes de renderizar
  if (!servicesLoaded) {
    return null;
  }

  // Determinar visibilidad de tabs según tipo de usuario
  // Invitado: Inicio, Servicios, Mis Solicitudes, Perfil (sin Asesoría)
  // Sin asesoría: Inicio, Servicios, Mis Servicios, Perfil
  // Con asesoría sin servicios: Asesoría, Perfil
  // Con asesoría con servicios: Todo
  const showInicio = hasServicesEnabled;
  const showServicios = hasServicesEnabled;
  const showMisSolicitudes = hasServicesEnabled;
  const showAsesoria = hasAdvisory && !isGuest;

  // Redirigir al usuario a la pestaña correcta según su configuración
  // Si tiene asesoría pero no servicios, redirigir a asesoría cuando intenta acceder a tabs de servicios
  if (isReady && !hasServicesEnabled && hasAdvisory && !isGuest) {
    // Si está en una ruta de servicios, redirigir a asesoría
    if (pathname === "/" || pathname.includes("/inicio") || pathname.includes("/servicios") || pathname.includes("/mis-solicitudes")) {
      return <Redirect href="/(app)/tabs/asesorias" />;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 65 + Math.max(insets.bottom, 5),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          marginTop: 2,
          marginBottom: 0,
          fontSize: 10,
          fontWeight: "bold",
          color: "black",
        },
        animation: "fade",
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* 1. Inicio - Solo visible si tiene servicios y NO es invitado */}
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
          href: showInicio ? undefined : null,
          tabBarItemStyle: showInicio ? {} : { display: "none" },
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
      {/* 2. Servicios - Visible si tiene servicios (incluyendo invitados) */}
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
          href: showServicios ? undefined : null,
          tabBarItemStyle: showServicios ? {} : { display: "none" },
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
      {/* 3. Asesoría - Solo visible si tiene asesoría vinculada y NO es invitado */}
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
          href: showAsesoria ? undefined : null,
          tabBarItemStyle: showAsesoria ? {} : { display: "none" },
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
          href: showMisSolicitudes ? undefined : null,
          tabBarItemStyle: showMisSolicitudes ? {} : { display: "none" },
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
