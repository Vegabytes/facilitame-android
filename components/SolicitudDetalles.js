import React, { useContext, useState } from "react";
import {
  Linking,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { SolicitudContext } from "../context/SolicitudContext";
import EstadoColor from "./EstadoColor";
import { fetchWithAuth } from "../utils/api";
import { usePathname, useRouter } from "expo-router";

const SolicitudDetalles = () => {
  const { solicitud } = useContext(SolicitudContext);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleCall = () => {
    if (solicitud?.category_phone && solicitud.category_phone.trim() !== "") {
      Linking.openURL(`tel:${solicitud.category_phone}`).catch((err) => {
        console.error("Error al intentar llamar:", err);
        Alert.alert("Error", "No se pudo realizar la llamada.");
      });
    } else {
      Alert.alert(
        "Número no disponible",
        "El número de teléfono no está disponible.",
      );
    }
  };

  const handleRevision = () => {
    Alert.alert(
      "Confirmación",
      "¿Quieres solicitar una revisión de tu oferta actual?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceptar",
          onPress: async () => {
            try {
              const response = await fetchWithAuth("offer-review-request", {
                request_id: solicitud.id,
              });
              if (response.status === "ok") {
                Alert.alert("Revisión", response.message_plain);
                setTimeout(() => {
                  router.replace(`${pathname}?id=${solicitud.id}`);
                }, 2000);
              } else {
                Alert.alert("Error", response.message_plain);
              }
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Error",
                "Ha ocurrido un error al solicitar la revisión",
              );
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // Variable para verificar la existencia del número de teléfono
  const phoneExists =
    solicitud?.category_phone && solicitud.category_phone.trim() !== "";

  return (
    <View className="bg-white p-5 flex flex-column mb-5 rounded-lg">
      <View className="flex flex-row justify-start gap-5 items-center">
        <View className="w-16 h-16 bg-background rounded-full justify-center items-center">
          <Image
            source={{ uri: solicitud?.category_img_url }}
            className="h-10 w-10 object-contain"
          />
        </View>
        <View className="flex flex-1">
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <Text className="text-xl font-extrabold text-center">
              {solicitud.category_name}
            </Text>
            <Text style={{ fontSize: 7 }}>#{solicitud.id}</Text>
          </View>
          <EstadoColor status_id={solicitud.status_id}>
            {solicitud.status_name}
          </EstadoColor>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View style={{ paddingVertical: 20, paddingLeft: 20 }}>
            <Image
              source={require("./../assets/three-dots.png")}
              style={{ height: 20, width: 20 }}
            />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {[7].includes(solicitud.status_id) && (
              <>
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRevision}
                >
                  <Text style={styles.buttonText}>Solicitar revisión</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Reportar incidencia</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Renderizamos el botón solo si existe un número de teléfono válido */}
            {phoneExists && (
              <TouchableOpacity onPress={handleCall} style={styles.button}>
                <Text style={styles.buttonText}>Contacta con tu asesor</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, { borderColor: "red", marginTop: 20 }]}
            >
              <Text style={[styles.buttonText, { color: "red" }]}>
                Eliminar
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.button, { borderColor: "gray" }]}
              >
                <Text style={[styles.buttonText, { color: "gray" }]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  buttonText: {
    color: "#30D4D1",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "white",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#30D4D1",
    marginBottom: 15,
  },
});

export default SolicitudDetalles;
