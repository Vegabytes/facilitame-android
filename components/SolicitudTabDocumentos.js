import React, { useContext, useState } from "react";
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Linking,
  ActionSheetIOS,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { fetchWithAuth } from "../utils/api";
import { SolicitudContext } from "../context/SolicitudContext";

import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";

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

const SolicitudTabDocumentos = () => {
  const { solicitud, refreshSolicitud } = useContext(SolicitudContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    setSelectedDocument(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a la cámara.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const resetSelectors = () => {
    setSelectedImage(null);
    setSelectedDocument(null);
    setSelectedDocType("0");
  };

  const handleUploadDocument = async () => {
    const fileUri = selectedDocument || selectedImage;
    if (!fileUri) {
      Alert.alert(
        "",
        "Primero debes seleccionar un documento o tomar una foto.",
      );
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("request_id", solicitud.id);

      const fileName = fileUri.split("/").pop();
      const fileExtension = fileName.split(".").pop().toLowerCase();
      let fileType;
      if (fileExtension === "pdf") {
        fileType = "application/pdf";
      } else if (fileExtension === "png") {
        fileType = "image/png";
      } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
        fileType = "image/jpeg";
      } else {
        fileType = "application/octet-stream";
      }

      formData.append("document", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });
      formData.append("file_type_id", selectedDocType);

      console.log("Enviando solicitud");
      const response = await fetchWithAuth(
        "request-upload-new-document",
        formData,
      );
      console.log("Documento subido correctamente:", response);
      Alert.alert("", "Documento subido correctamente");

      resetSelectors();

      if (refreshSolicitud) refreshSolicitud();
    } catch (error) {
      console.error("Error al subir el documento:", error);
      Alert.alert("Error", "Ocurrió un problema al subir el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDocument = async (documentItem) => {
    if (!documentItem?.id) return;

    try {
      const response = await fetchWithAuth("document-fetch/", {
        file_id: documentItem.id,
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

        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: mimeType,
        });
      } else if (Platform.OS === "ios") {
        const canOpen = await Linking.canOpenURL(fileUri);
        if (canOpen) {
          await Linking.openURL(fileUri);
        } else {
          console.error("No se puede abrir el archivo en iOS.");
        }
      }
    } catch (error) {
      console.error("Error al descargar el documento:", error);
    }
  };

  const handleDeleteDocument = (documentItem) => {
    Alert.alert(
      "Eliminar documento",
      "¿Estás seguro de que deseas eliminar este documento?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetchWithAuth("document-remove", {
                file_id: documentItem.id,
              });

              if (response.status === "ok") {
                Alert.alert("Documento eliminado");
                if (refreshSolicitud) refreshSolicitud();
              } else {
                console.error("Error al eliminar el documento:", response);
                Alert.alert(
                  "Error",
                  "No se pudo eliminar el documento. Inténtalo de nuevo.",
                );
              }
            } catch (error) {
              console.error("Error al eliminar el documento:", error);
              Alert.alert(
                "Error",
                "Ocurrió un problema al eliminar el documento",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 50 }}>
      {/* Contenedor para la selección y vista previa del archivo */}
      <View
        style={{
          padding: 10,
          borderWidth: 1,
          borderColor: "#30D4D1",
          backgroundColor: "#fff",
          borderRadius: 16,
          marginBottom: 20,
        }}
      >
        {selectedImage && !selectedDocument && (
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: "100%",
              height: 150,
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
        )}
        {selectedDocument && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text
              style={{ color: "#333", flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedDocument.split("/").pop()}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDocument(null)}>
              <Text style={{ color: "red" }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
        <View
          style={{
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#30D4D1",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {Platform.OS === "ios" ? (
            <TouchableOpacity
              onPress={() => {
                const options = ["Tipo de documento", "Póliza", "Factura", "Contrato", "Documento", "Cancelar"];
                const values = ["0", "1", "2", "3", "99"];
                ActionSheetIOS.showActionSheetWithOptions(
                  { options, cancelButtonIndex: 5 },
                  (buttonIndex) => {
                    if (buttonIndex < 5) {
                      setSelectedDocType(values[buttonIndex]);
                    }
                  }
                );
              }}
              style={{ height: 50, justifyContent: "center", paddingHorizontal: 10 }}
            >
              <Text style={{ color: "#333" }}>
                {selectedDocType === "0" ? "Tipo de documento" :
                 selectedDocType === "1" ? "Póliza" :
                 selectedDocType === "2" ? "Factura" :
                 selectedDocType === "3" ? "Contrato" : "Documento"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Picker
              selectedValue={selectedDocType}
              onValueChange={(itemValue) => setSelectedDocType(itemValue)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Tipo de documento" value="0" />
              <Picker.Item label="Póliza" value="1" />
              <Picker.Item label="Factura" value="2" />
              <Picker.Item label="Contrato" value="3" />
              <Picker.Item label="Documento" value="99" />
            </Picker>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: "#30D4D1",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              marginRight: Platform.OS !== "web" ? 5 : 0,
            }}
            onPress={pickDocument}
          >
            <Image
              source={require("./../assets/icon-document.png")}
              style={{ width: 36, height: 36, resizeMode: "contain" }}
            />
          </TouchableOpacity>
          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: "#30D4D1",
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 5,
              }}
              onPress={takePhoto}
            >
              <Image
                source={require("./../assets/icon-camera.png")}
                style={{ width: 36, height: 36, resizeMode: "contain" }}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "#30D4D1",
            padding: 10,
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
          onPress={handleUploadDocument}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", textAlign: "center", fontSize: 18 }}>
              Subir Documento
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reemplazando FlatList con ScrollView para mostrar los documentos */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        style={{ marginTop: 10 }}
      >
        {solicitud?.documents && solicitud.documents.length > 0 ? (
          solicitud.documents.map((item) => (
            <TouchableOpacity
              key={item.id.toString()}
              style={{
                marginBottom: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: "#30D4D1",
              }}
              onPress={() => handleDownloadDocument(item)}
            >
              <View
                style={{
                  flexDirection: "row",
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  className="bg-background rounded-full"
                >
                  <Image
                    source={require("./../assets/icon-document.png")}
                    style={{ width: 36, height: 36, resizeMode: "contain" }}
                  />
                </View>
                <View style={{ marginStart: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 600 }}>
                    {item.file_type_display || "Documento"}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "normal" }}>
                    Cargado el {item.created_at_display}
                  </Text>
                </View>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flex: 1,
                    justifyContent: "flex-end",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: "#f8285a",
                      paddingHorizontal: 10,
                      paddingVertical: 10,
                      borderRadius: 5,
                    }}
                    onPress={() => handleDeleteDocument(item)}
                  >
                    <Text style={{ color: "#f8285a" }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: "#333", textAlign: "center" }}>
            Aún no hay documentos cargados
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default SolicitudTabDocumentos;
