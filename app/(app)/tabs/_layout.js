import { Tabs } from "expo-router";
import ServiciosInf from "../../../assets/icons/ServiciosInf";
import ServiciosInfActive from "../../../assets/icons/ServiciosInfActive";
import MisSolicitudes from "../../../assets/icons/MisSolicitudes";
import MisSolicitudesActive from "../../../assets/icons/MisSolicitudesActive";
import InicioActive from "../../../assets/icons/Inicio";
import MiCuentaActive from "../../../assets/icons/MiCuentaActive";
import { Image } from "react-native";

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
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Image
                source={require("../../../assets/inicio-active.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/inicio.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
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
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Image
                source={require("../../../assets/servicios-active.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/servicios.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
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
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Image
                source={require("../../../assets/mis-solicitudes-active.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/mis-solicitudes.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
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
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Image
                source={require("../../../assets/mi-cuenta-active.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
              />
            ) : (
              <Image
                source={require("../../../assets/mi-cuenta.png")}
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "contain",
                }}
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
