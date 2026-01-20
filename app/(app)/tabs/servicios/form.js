import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  ActionSheetIOS,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fetchWithAuth } from "./../../../../utils/api.js";

export default function FormScreen() {
  const { id, category_name, category_img_uri } = useLocalSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedValues, setSelectedValues] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [date, setDate] = useState(new Date());
  const [phone, setPhone] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("0");

  const [documentQueue, setDocumentQueue] = useState([]);

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

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setSelectedDocument(asset.uri);
    setSelectedImage(null);
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
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      setSelectedDocument(null);
    }
  };

  const addDocumentToQueue = () => {
    if (selectedDocType === "0") {
      Alert.alert("Error", "Debe seleccionar un tipo de documento.");
      return;
    }
    const fileUri = selectedImage || selectedDocument;
    if (!fileUri) {
      Alert.alert("Error", "Debe seleccionar un documento o tomar una foto.");
      return;
    }
    let fileName = "";
    let fileType = "";
    if (selectedImage) {
      fileName = "photo.jpg";
      fileType = "image/jpeg";
    } else if (selectedDocument) {
      fileName = fileUri.split("/").pop();
      fileType = getMimeType(fileName);
    }

    const documentItem = {
      id: Date.now().toString(),
      fileUri,
      fileName,
      fileType,
      docType: selectedDocType,
    };

    setDocumentQueue([...documentQueue, documentItem]);
    setSelectedImage(null);
    setSelectedDocument(null);
    setSelectedDocType("0");
  };

  const removeDocumentFromQueue = (id) => {
    setDocumentQueue(documentQueue.filter((doc) => doc.id !== id));
  };

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("app-service-form-get", {
        service_id: id,
      });

      if (!response || !response.data || !response.data.form_elements) {
        throw new Error("La API no devolvió los datos esperados.");
      }

      setFormData(response.data.form_elements);
      setPhone(response.data.service_info.phone);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos del formulario.");
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (phone && phone.trim() !== "") {
      Linking.openURL(`tel:${phone}`).catch((err) => {
        Alert.alert("Error", "No se pudo realizar la llamada.");
      });
    } else {
      Alert.alert(
        "Número no disponible",
        "El número de teléfono no está disponible.",
      );
    }
  };

  const submitForm = async () => {
    let body;
    if (documentQueue.length > 0) {
      body = new FormData();
      body.append("category_id", id);
      body.append("form", JSON.stringify(Object.values(selectedValues)));

      documentQueue.forEach((doc) => {
        body.append("documents[]", {
          uri: doc.fileUri,
          name: doc.fileName,
          type: doc.fileType,
        });
        body.append("file_type_ids[]", doc.docType);
      });
    } else {
      body = {
        category_id: id,
        form: JSON.stringify(Object.values(selectedValues)),
      };
    }

    try {
      const response = await fetchWithAuth(
        "app-service-form-main-submit",
        body,
      );
      if (response.status === "ok") {
        setDocumentQueue([]);
        router.replace(`/tabs/servicios/ok`);
      } else {
        throw new Error(response.message || "Error al enviar el formulario.");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFormData();
    }, [id]),
  );

  return (
    <ScrollView className="bg-background py-4 px-6">
      <View className="pb-10">
        <View className="w-full h-auto mb-5 p-5 flex-column gap-5 rounded-2xl bg-primary">
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-extrabold">{category_name}</Text>
            <Image
              source={{ uri: category_img_uri }}
              className="h-9 w-9 object-contain"
            />
          </View>
          <Text className="text-base font-bold text-justify">
            Envía tu factura, póliza o contrato actual y obtén un presupuesto
            100% personalizado en poco tiempo
          </Text>
        </View>

        <View className="w-full h-auto p-4 border-2 border-primary bg-white rounded-3xl mb-5">
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-40 rounded-lg mb-2"
            />
          )}
          {selectedDocument && (
            <View className="flex-row items-center justify-between bg-white p-3 rounded-lg mb-5 gap-5">
              <Text
                className="text-gray-700 flex-1 truncate"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedDocument.split("/").pop()}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDocument(null);
                  setSelectedImage(null);
                }}
              >
                <Text className="text-red-500">Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="mb-4 border-2 border-primary bg-white rounded-3xl ps-5">
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
                style={{ paddingVertical: 16, paddingRight: 16 }}
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
                onValueChange={(value) => setSelectedDocType(value)}
                style={{ width: "100%", color: "#333" }}
                accessibilityLabel="document-type-picker"
                testID="document-type-picker"
              >
                <Picker.Item label="Tipo de documento" value="0" />
                <Picker.Item label="Póliza" value="1" />
                <Picker.Item label="Factura" value="2" />
                <Picker.Item label="Contrato" value="3" />
                <Picker.Item label="Documento" value="99" />
              </Picker>
            )}
          </View>

          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              className="flex-1 px-3 py-5 bg-primary rounded-lg flex-row justify-center"
              onPress={pickDocument}
            >
              <Image
                source={require("../../../../assets/icon-document.png")}
                className="h-9 w-9 object-contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 px-3 py-5 bg-primary rounded-lg flex-row justify-center"
              onPress={takePhoto}
            >
              <Image
                source={require("../../../../assets/icon-camera.png")}
                className="h-9 w-9 object-contain"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-button p-3 w-full rounded-full mt-4"
            onPress={addDocumentToQueue}
          >
            <Text className="text-white text-center text-lg">
              Añadir documento
            </Text>
          </TouchableOpacity>
        </View>

        {documentQueue.length > 0 && (
          <View className="mb-5">
            <Text className="font-bold mb-2">Documentos añadidos:</Text>
            {documentQueue.map((doc) => (
              <View
                key={doc.id}
                className="flex-row items-center justify-between bg-white p-3 rounded-lg mb-2"
              >
                <View>
                  <Text className="font-semibold">
                    {doc.fileName.length > 15
                      ? doc.fileName.substring(0, 15) + "..."
                      : doc.fileName}
                  </Text>
                  <Text className="text-sm">
                    {doc.docType === "1"
                      ? "Póliza"
                      : doc.docType === "2"
                        ? "Factura"
                        : doc.docType === "3"
                          ? "Contrato"
                          : doc.docType === "99"
                            ? "Documento"
                            : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeDocumentFromQueue(doc.id)}
                >
                  <Text className="text-red-500">Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {loading ? (
          <View className="flex items-center justify-center py-10">
            <ActivityIndicator size="large" color="#30D4D1" />
          </View>
        ) : (
          <View className="w-full h-auto m-0">
            {formData.length > 0 ? (
              formData.map((field) => (
                <View key={field.id} className="mb-2">
                  <Text className="font-bold mb-1 ps-4">{field.name}</Text>
                  {renderInputField(
                    field,
                    selectedValues,
                    setSelectedValues,
                    setShowDatePicker,
                    setCurrentDateField,
                    setDate,
                  )}
                </View>
              ))
            ) : (
              <Text className="text-center text-gray-500">
                No hay campos disponibles para este formulario.
              </Text>
            )}
          </View>
        )}

        {/* DateTimePicker - Android */}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const formattedDateForServer = selectedDate.toISOString().split("T")[0];
                const formattedDateForDisplay = selectedDate.toLocaleDateString("es-ES");
                setSelectedValues((prev) => ({
                  ...prev,
                  [currentDateField]: formattedDateForServer,
                  [`${currentDateField}_display`]: formattedDateForDisplay,
                }));
              }
            }}
          />
        )}
        {/* DateTimePicker - iOS con Modal */}
        {showDatePicker && Platform.OS === "ios" && (
          <Modal transparent animationType="fade" visible={showDatePicker}>
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
              <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  textColor="#000"
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, marginBottom: 30 }}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                  >
                    <Text style={{ color: "#FF231F", fontSize: 16 }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const formattedDateForServer = date.toISOString().split("T")[0];
                      const formattedDateForDisplay = date.toLocaleDateString("es-ES");
                      setSelectedValues((prev) => ({
                        ...prev,
                        [currentDateField]: formattedDateForServer,
                        [`${currentDateField}_display`]: formattedDateForDisplay,
                      }));
                      setShowDatePicker(false);
                    }}
                    style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                  >
                    <Text style={{ color: "#30D4D1", fontSize: 16, fontWeight: "600" }}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <TouchableOpacity
          className="bg-button p-4 w-full rounded-full mb-5 mt-5"
          onPress={submitForm}
        >
          <Text className="text-white text-center text-lg">
            Enviar solicitud
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-background px-4 py-3 w-full rounded-full border border-white flex-row justify-center gap-5 items-center"
          onPress={handleCall}
        >
          <Text className="text-button font-bold text-center text-lg">
            o llámanos si tienes dudas
          </Text>
          <Image
            source={require("../../../../assets/icon-call.png")}
            className="h-9 w-9 object-contain"
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function renderInputField(
  field,
  selectedValues,
  setSelectedValues,
  setShowDatePicker,
  setCurrentDateField,
  setDate,
) {
  switch (field.type) {
    case "text":
    case "input":
      return (
        <TextInput
          className="w-full p-2 border-2 border-primary bg-white rounded-3xl ps-5 py-4"
          placeholder={field.name}
          value={selectedValues[field.key] || ""}
          onChangeText={(text) =>
            setSelectedValues({
              ...selectedValues,
              [field.key]: {
                value: text,
                name: field.name,
                key: field.key,
              },
            })
          }
          accessibilityLabel={field.name}
          testID={`input-${field.key}`}
          key={field.key}
        />
      );
    case "number":
      return (
        <TextInput
          className="w-full p-2 border-2 border-primary bg-white rounded-3xl ps-5 py-4"
          placeholder={field.name}
          keyboardType="numeric"
          value={selectedValues[field.key] || ""}
          onChangeText={(text) =>
            setSelectedValues({
              ...selectedValues,
              [field.key]: {
                value: text,
                name: field.name,
                key: field.key,
              },
            })
          }
          accessibilityLabel={field.name}
          testID={`number-${field.key}`}
          key={field.key}
        />
      );
    case "date":
      return (
        <TouchableOpacity
          onPress={() => {
            setCurrentDateField(field.key);
            setDate(new Date());
            setShowDatePicker(true);
          }}
          accessibilityLabel={`date-picker-${field.key}`}
          testID={`date-${field.key}`}
          key={field.key}
        >
          <TextInput
            className="w-full p-2 border-2 border-primary bg-white rounded-3xl ps-5 py-4"
            placeholder="Seleccione una fecha"
            value={selectedValues[`${field.key}_display`] || ""}
            editable={false}
          />
        </TouchableOpacity>
      );
    case "textarea":
      return (
        <TextInput
          className="w-full p-2 border-2 border-primary bg-white rounded-3xl ps-5 py-4"
          placeholder={field.name}
          multiline
          numberOfLines={4}
          value={selectedValues[field.key] || ""}
          onChangeText={(text) =>
            setSelectedValues({
              ...selectedValues,
              [field.key]: {
                value: text,
                name: field.name,
                key: field.key,
              },
            })
          }
          accessibilityLabel={field.name}
          testID={`textarea-${field.key}`}
          key={field.key}
        />
      );
    case "select":
      let options = [];
      try {
        options = field.values ? JSON.parse(field.values) : [];
        if (!Array.isArray(options)) options = [];
      } catch (error) {
        options = [];
      }

      if (Platform.OS === "ios") {
        const currentValue = selectedValues[field.key]?.value || "";
        const displayLabel = currentValue || "Seleccione una opción";

        return (
          <TouchableOpacity
            key={field.key}
            onPress={() => {
              const optionLabels = ["Seleccione una opción", ...options, "Cancelar"];
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options: optionLabels,
                  cancelButtonIndex: optionLabels.length - 1,
                },
                (buttonIndex) => {
                  if (buttonIndex > 0 && buttonIndex < optionLabels.length - 1) {
                    setSelectedValues({
                      ...selectedValues,
                      [field.key]: {
                        value: options[buttonIndex - 1],
                        name: field.name,
                        key: field.key,
                      },
                    });
                  }
                }
              );
            }}
            className="w-full border-2 border-primary bg-white rounded-3xl ps-5"
            style={{ paddingVertical: 16, paddingRight: 16 }}
            accessibilityLabel={`picker-${field.key}`}
            testID={`select-${field.key}`}
          >
            <Text style={{ color: currentValue ? "#333" : "#999" }}>{displayLabel}</Text>
          </TouchableOpacity>
        );
      }

      return (
        <View
          className="w-full border-2 border-primary bg-white rounded-3xl ps-5"
          key={field.key}
        >
          <Picker
            selectedValue={selectedValues[field.key]?.value || ""}
            onValueChange={(value) =>
              setSelectedValues({
                ...selectedValues,
                [field.key]: {
                  value: value,
                  name: field.name,
                  key: field.key,
                },
              })
            }
            style={{ width: "100%", color: "#333" }}
            accessibilityLabel={`picker-${field.key}`}
            testID={`select-${field.key}`}
          >
            <Picker.Item label="Seleccione una opción" value="" />
            {options.length > 0 ? (
              options.map((option, index) => (
                <Picker.Item key={index} label={option} value={option} />
              ))
            ) : (
              <Picker.Item label="No hay opciones" value="no-options" />
            )}
          </Picker>
        </View>
      );
    default:
      return (
        <Text
          className="text-gray-500"
          accessibilityLabel={`unsupported-${field.key}`}
          testID={`unsupported-${field.key}`}
          key={field.key}
        >
          Tipo de campo no soportado: {field.type}
        </Text>
      );
  }
}
