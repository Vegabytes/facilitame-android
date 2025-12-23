/**
 * Pantalla para solicitar nueva cita con la asesoría
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchWithAuth } from "../../../../utils/api";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";

const TYPES = [
  {
    value: "llamada",
    label: "📞 Llamada telefónica",
    desc: "Te llamaremos al teléfono registrado",
  },
  {
    value: "reunion_virtual",
    label: "💻 Videollamada",
    desc: "Recibirás un enlace para la reunión",
  },
  {
    value: "reunion_presencial",
    label: "🏢 Presencial",
    desc: "Acude a la oficina de la asesoría",
  },
];

const DEPARTMENTS = [
  { value: "contabilidad", label: "📊 Contabilidad" },
  { value: "fiscalidad", label: "📋 Fiscalidad" },
  { value: "laboral", label: "👥 Laboral" },
  { value: "gestion", label: "📁 Gestión" },
];

export default function NuevaCitaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [advisoryId, setAdvisoryId] = useState(null);
  const [advisoryName, setAdvisoryName] = useState("");

  // Form fields
  const [type, setType] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

  // Date/Time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Cargar datos de asesoría
  useFocusEffect(
    useCallback(() => {
      const loadAdvisory = async () => {
        try {
          const response = await fetchWithAuth(
            "app-user-advisory",
            {},
            { silent: true },
          );
          if (response?.status === "ok" && response.data?.has_advisory) {
            setAdvisoryId(response.data.advisory.id);
            setAdvisoryName(response.data.advisory.name);
          } else {
            Alert.alert("Error", "No tienes asesoría vinculada");
            router.back();
          }
        } catch (_error) {
          router.back();
        }
      };
      loadAdvisory();
    }, [router]),
  );

  const validateForm = () => {
    const newErrors = {};

    if (!type) newErrors.type = "Selecciona un tipo de cita";
    if (!department) newErrors.department = "Selecciona un departamento";
    if (!selectedDate) newErrors.date = "Selecciona una fecha";
    if (!selectedTime) newErrors.time = "Selecciona una hora";
    if (!reason || reason.trim().length < 10) {
      newErrors.reason = "Describe el motivo (mínimo 10 caracteres)";
    }

    // Validar fecha futura
    if (selectedDate && selectedTime) {
      const proposedDateTime = new Date(selectedDate);
      proposedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      if (proposedDateTime <= new Date()) {
        newErrors.date = "La fecha debe ser futura";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatear fecha para mostrar
  const formatDisplayDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Formatear hora para mostrar
  const formatDisplayTime = (time) => {
    if (!time) return "";
    return time.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Combinar fecha y hora
      const dateStr = selectedDate.toISOString().split("T")[0];
      const timeStr = `${String(selectedTime.getHours()).padStart(2, "0")}:${String(selectedTime.getMinutes()).padStart(2, "0")}:00`;
      const proposedDate = `${dateStr} ${timeStr}`;

      const response = await fetchWithAuth("customer-request-appointment", {
        advisory_id: advisoryId,
        type,
        department,
        proposed_date: proposedDate,
        reason: reason.trim(),
      });

      if (response?.status === "ok") {
        Alert.alert(
          "Solicitud enviada",
          "Tu solicitud de cita ha sido enviada. La asesoría revisará tu propuesta de fecha y te responderá pronto.",
          [
            {
              text: "Ver mis citas",
              onPress: () => router.replace("/tabs/asesorias/citas"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          response?.message_html ||
            response?.message_plain ||
            "No se pudo enviar la solicitud",
        );
      }
    } catch (_error) {
      Alert.alert("Error", "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Obtener fecha mínima (mañana)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  // Estado temporal para iOS
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);

  // Handler para cambio de fecha
  const onDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (date) {
        setSelectedDate(date);
        setErrors((e) => ({ ...e, date: null }));
      }
    } else {
      // iOS - guardar temporalmente
      if (date) {
        setTempDate(date);
      }
    }
  };

  // Handler para cambio de hora
  const onTimeChange = (event, time) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (time) {
        setSelectedTime(time);
        setErrors((e) => ({ ...e, time: null }));
      }
    } else {
      // iOS - guardar temporalmente
      if (time) {
        setTempTime(time);
      }
    }
  };

  // Confirmar fecha en iOS
  const confirmDateIOS = () => {
    if (tempDate) {
      setSelectedDate(tempDate);
      setErrors((e) => ({ ...e, date: null }));
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  // Confirmar hora en iOS
  const confirmTimeIOS = () => {
    if (tempTime) {
      setSelectedTime(tempTime);
      setErrors((e) => ({ ...e, time: null }));
    }
    setShowTimePicker(false);
    setTempTime(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-background">
        <View className="p-5">
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            accessibilityLabel="Volver"
            accessibilityRole="button"
          >
            <Text className="text-primary text-lg">← Volver</Text>
          </TouchableOpacity>

          <View className="mb-6">
            <Text className="text-3xl font-extrabold text-button">
              Solicitar cita
            </Text>
            {advisoryName && (
              <Text className="text-base text-gray-600 mt-2">
                Con {advisoryName}
              </Text>
            )}
          </View>

          {/* Tipo de cita */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Tipo de cita</Text>
            {errors.type && (
              <Text className="text-red-500 text-sm mb-2">{errors.type}</Text>
            )}
            <View className="gap-2">
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  className={`p-4 rounded-xl border-2 ${
                    type === t.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onPress={() => {
                    setType(t.value);
                    setErrors((e) => ({ ...e, type: null }));
                  }}
                  accessibilityLabel={t.label}
                  accessibilityRole="button"
                >
                  <Text className="font-semibold text-base">{t.label}</Text>
                  <Text className="text-gray-500 text-sm mt-1">{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Departamento */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Departamento</Text>
            {errors.department && (
              <Text className="text-red-500 text-sm mb-2">
                {errors.department}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  className={`px-4 py-3 rounded-xl border-2 ${
                    department === d.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200"
                  }`}
                  onPress={() => {
                    setDepartment(d.value);
                    setErrors((e) => ({ ...e, department: null }));
                  }}
                  accessibilityLabel={d.label}
                  accessibilityRole="button"
                >
                  <Text
                    className={`font-medium ${
                      department === d.value ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fecha y hora propuesta */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">
              Fecha y hora propuesta
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Propón cuándo te vendría bien. La asesoría confirmará o sugerirá
              otra fecha.
            </Text>

            <View className="flex-row gap-3">
              {/* Selector de fecha */}
              <View className="flex-1">
                <Text className="font-semibold mb-1 ml-1 text-gray-700">Fecha</Text>
                <TouchableOpacity
                  className={`h-14 px-4 bg-white rounded-2xl border-2 justify-center ${
                    errors.date ? "border-red-500" : "border-bright"
                  }`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={selectedDate ? "text-black" : "text-gray-400"}>
                    {selectedDate ? formatDisplayDate(selectedDate) : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
                {errors.date && (
                  <Text className="text-white text-sm mt-1 ml-1 bg-red-500/80 px-2 py-1 rounded">
                    {errors.date}
                  </Text>
                )}
              </View>

              {/* Selector de hora */}
              <View className="flex-1">
                <Text className="font-semibold mb-1 ml-1 text-gray-700">Hora</Text>
                <TouchableOpacity
                  className={`h-14 px-4 bg-white rounded-2xl border-2 justify-center ${
                    errors.time ? "border-red-500" : "border-bright"
                  }`}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text className={selectedTime ? "text-black" : "text-gray-400"}>
                    {selectedTime ? formatDisplayTime(selectedTime) : "Seleccionar"}
                  </Text>
                </TouchableOpacity>
                {errors.time && (
                  <Text className="text-white text-sm mt-1 ml-1 bg-red-500/80 px-2 py-1 rounded">
                    {errors.time}
                  </Text>
                )}
              </View>
            </View>

            {/* DateTimePickers - Android */}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedDate || getMinDate()}
                mode="date"
                display="default"
                minimumDate={getMinDate()}
                onChange={onDateChange}
                locale="es-ES"
              />
            )}
            {showTimePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedTime || new Date()}
                mode="time"
                display="default"
                is24Hour={true}
                onChange={onTimeChange}
                locale="es-ES"
              />
            )}

            {/* DateTimePicker Fecha - iOS con Modal */}
            {showDatePicker && Platform.OS === "ios" && (
              <Modal transparent animationType="fade" visible={showDatePicker}>
                <View className="flex-1 justify-end bg-black/40">
                  <View className="bg-white p-4 rounded-t-xl">
                    <DateTimePicker
                      value={tempDate || selectedDate || getMinDate()}
                      mode="date"
                      display="spinner"
                      minimumDate={getMinDate()}
                      onChange={onDateChange}
                      locale="es-ES"
                      textColor="#000"
                    />
                    <View className="flex-row justify-between mt-2 mb-6">
                      <TouchableOpacity
                        onPress={() => { setShowDatePicker(false); setTempDate(null); }}
                        className="px-4 py-2"
                      >
                        <Text className="text-red-500 text-base">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmDateIOS}
                        className="px-4 py-2"
                      >
                        <Text className="text-primary text-base font-semibold">Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {/* DateTimePicker Hora - iOS con Modal */}
            {showTimePicker && Platform.OS === "ios" && (
              <Modal transparent animationType="fade" visible={showTimePicker}>
                <View className="flex-1 justify-end bg-black/40">
                  <View className="bg-white p-4 rounded-t-xl">
                    <DateTimePicker
                      value={tempTime || selectedTime || new Date()}
                      mode="time"
                      display="spinner"
                      is24Hour={true}
                      onChange={onTimeChange}
                      locale="es-ES"
                      textColor="#000"
                    />
                    <View className="flex-row justify-between mt-2 mb-6">
                      <TouchableOpacity
                        onPress={() => { setShowTimePicker(false); setTempTime(null); }}
                        className="px-4 py-2"
                      >
                        <Text className="text-red-500 text-base">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmTimeIOS}
                        className="px-4 py-2"
                      >
                        <Text className="text-primary text-base font-semibold">Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            <View className="bg-blue-50 p-3 rounded-lg mt-3">
              <Text className="text-blue-700 text-sm">
                💡 Horario habitual: Lunes a Viernes de 9:00 a 14:00 y de 16:00
                a 19:00
              </Text>
            </View>
          </View>

          {/* Motivo */}
          <View className="bg-white p-5 rounded-2xl mb-4">
            <Text className="font-bold text-lg mb-3">Motivo de la cita</Text>
            <Input
              placeholder="Describe brevemente el motivo de tu consulta..."
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                setErrors((e) => ({ ...e, reason: null }));
              }}
              error={errors.reason}
              multiline
              numberOfLines={4}
              maxLength={2000}
              accessibilityLabel="Motivo de la cita"
            />
            <Text className="text-gray-400 text-right text-sm mt-1">
              {reason.length}/2000
            </Text>
          </View>

          {/* Botón enviar */}
          <Button
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            accessibilityLabel="Enviar solicitud de cita"
          >
            Enviar solicitud
          </Button>

          <View className="h-20" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
