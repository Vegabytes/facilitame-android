import { usePathname, useRouter } from "expo-router";
import he from "he";
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { fetchWithAuth } from "./../utils/api";
import { SolicitudContext } from "../context/SolicitudContext";
import EstadoColor from "./EstadoColor";

const getMimeType = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();
  const mimeTypes = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
  };
  return mimeTypes[extension] || "application/octet-stream";
};

const SolicitudTabOfertas = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { solicitud } = useContext(SolicitudContext);
  const navigation = useNavigation();
  console.log("🔵 solicitud:", solicitud);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(false);

  const stripHtmlTags = (html) => {
    const stripped = html.replace(/<\/?[^>]+(>|$)/g, "");
    return he.decode(stripped);
  };

  const handleOfferPress = (offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const handleDownload = async () => {
    if (!selectedOffer?.id) return;

    try {
      const response = await fetchWithAuth(`app-offer-fetch/`, {
        file_id: selectedOffer.id,
      });

      console.log(response);

      if (response.status !== "ok") {
        console.error("Error al descargar el archivo");
        return;
      }

      const { b64, filename } = response.data;

      if (!b64 || !filename) {
        console.error("Datos inválidos en la respuesta del servidor");
        return;
      }

      const mimeType = getMimeType(filename);
      console.log("MIME type:", mimeType);

      // Manejo específico para web
      if (Platform.OS === "web") {
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("Archivo guardado en:", fileUri);

      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        console.log("Android Content URI:", contentUri);

        IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // FLAG_ACTIVITY_NEW_TASK
          type: mimeType,
        });
      } else if (Platform.OS === "ios") {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, { mimeType: mimeType });
        } else {
          Alert.alert("Error", "No se puede abrir el archivo en este dispositivo.");
        }
      }
    } catch (error) {
      console.error("Error al manejar la descarga:", error);
    }
  };

  const handleAccept = () => {
    Alert.alert("Confirmar Aceptación", "¿Estás seguro de aceptar la oferta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aceptar",
        onPress: async () => {
          if (!selectedOffer?.id || !solicitud?.id) {
            console.error("Datos insuficientes");
            return;
          }
          setLoading(true);
          try {
            const response = await fetchWithAuth("offer-accept", {
              request_id: solicitud.id,
              offer_id: selectedOffer.id,
            });
            if (response.status === "ok") {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "ok" }],
                }),
              );
            } else {
              console.error("Error en la aceptación de la oferta");
            }
          } catch (error) {
            console.error("Error en la aceptación:", error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert("Confirmar Rechazo", "¿Estás seguro de rechazar la oferta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        onPress: async () => {
          if (!selectedOffer?.id || !solicitud?.id) {
            console.error("Datos insuficientes");
            return;
          }
          setLoading(true);
          try {
            const response = await fetchWithAuth("offer-reject", {
              request_id: solicitud.id,
              offer_id: selectedOffer.id,
              reject_reason: "",
            });
            if (response.status === "ok") {
              router.replace(`${pathname}?id=${solicitud.id}`);
            } else {
              console.error("Error en el rechazo de la oferta");
            }
          } catch (error) {
            console.error("Error en el rechazo:", error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {solicitud?.offers && solicitud.offers.length > 0 ? (
          solicitud.offers.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              onPress={() => handleOfferPress(item)}
              style={{
                marginBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#97E9E8",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  padding: 16,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={require("./../assets/offer.png")}
                    style={{ width: 36, height: 36, resizeMode: "contain" }}
                  />
                </View>
                <View
                  style={{
                    marginLeft: 10,
                    paddingRight: 10,
                    flex: 1,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                    {item.offer_title || ""}
                  </Text>
                  <EstadoColor status_id={item.status_id}>
                    {item.status_name}
                  </EstadoColor>
                  <Text>
                    {stripHtmlTags(item.offer_content)?.length > 100
                      ? stripHtmlTags(item.offer_content).slice(0, 100) + "..."
                      : stripHtmlTags(item.offer_content) || ""}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <>
            <Text style={styles.emptyText}>
              Aún no hay ofertas disponibles.
            </Text>
            <Text style={styles.emptyText}>
              ¡Te avisaremos en cuanto tu asesor cargue la primera!
            </Text>
          </>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedOffer && (
              <>
                <Text style={styles.offerTitle}>
                  {selectedOffer.offer_title}
                </Text>
                <Text style={styles.modalText}>
                  {stripHtmlTags(selectedOffer.offer_content)}
                </Text>
                <TouchableOpacity
                  onPress={handleDownload}
                  style={[styles.primaryButton, { marginBottom: 30 }]}
                >
                  <Text style={styles.buttonText}>Ver oferta</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  {[2, 8].includes(solicitud.status_id) &&
                    ![5, 7].includes(selectedOffer.status_id) && (
                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          { flex: 1, marginRight: 5 },
                        ]}
                        onPress={handleAccept}
                      >
                        <Text style={styles.buttonText}>Aceptar</Text>
                      </TouchableOpacity>
                    )}

                  {[2, 8].includes(solicitud.status_id) &&
                    [2].includes(selectedOffer.status_id) && (
                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,
                          { flex: 1, marginLeft: 5 },
                        ]}
                        onPress={handleReject}
                      >
                        <Text style={{ color: "black" }}>Rechazar</Text>
                      </TouchableOpacity>
                    )}
                </View>
              </>
            )}
            <View style={{ marginTop: 30 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingVertical: 10,
                }}
              >
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // display: "flex",
    // flex: 1,
  },
  listContent: {
    // paddingBottom: 20,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
    color: "#888",
  },
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
  modalText: {
    marginBottom: 15,
    fontSize: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#30D4D1",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});

export default SolicitudTabOfertas;
