import { Tabs } from "expo-router";
import { Image, View } from "react-native";

function TabIcon({ source, prominent, focused }) {
  if (prominent) {
    return (
      <View
        style={{
          backgroundColor: focused ? "#1E4C59" : "#30D4D1",
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
          borderWidth: focused ? 3 : 0,
          borderColor: "#30D4D1",
        }}
      >
        <Image
          source={source}
          resizeMode="contain"
          style={{ width: 28, height: 28, tintColor: "#FFFFFF" }}
        />
      </View>
    );
  }
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
      {/* 1. Inicio */}
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
      {/* 2. Servicios */}
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
      {/* 3. Asesoría (PROMINENTE - Centro) */}
      <Tabs.Screen
        name="asesorias"
        options={{
          tabBarLabel: "Asesoría",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("../../../assets/icon-document.png")}
              prominent
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
      {/* 4. Mis Servicios */}
      <Tabs.Screen
        name="mis-solicitudes"
        options={{
          tabBarLabel: "Mis Servicios",
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
      {/* 5. Perfil */}
      <Tabs.Screen
        name="mi-cuenta"
        options={{
          tabBarLabel: "Perfil",
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
    </Tabs>
  );
}
