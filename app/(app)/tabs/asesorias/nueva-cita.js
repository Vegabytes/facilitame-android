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
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

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
    if (!date) newErrors.date = "Introduce una fecha";
    if (!time) newErrors.time = "Introduce una hora";
    if (!reason || reason.trim().length < 10) {
      newErrors.reason = "Describe el motivo (mínimo 10 caracteres)";
    }

    // Validar fecha futura
    if (date && time) {
      const proposedDate = new Date(`${date}T${time}`);
      if (proposedDate <= new Date()) {
        newErrors.date = "La fecha debe ser futura";
      }
    }

    // Validar formato fecha
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = "Formato: AAAA-MM-DD";
    }

    // Validar formato hora
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      newErrors.time = "Formato: HH:MM";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const proposedDate = `${date} ${time}:00`;

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
    return tomorrow.toISOString().split("T")[0];
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
              <View className="flex-1">
                <Input
                  label="Fecha"
                  placeholder={getMinDate()}
                  value={date}
                  onChangeText={(text) => {
                    setDate(text);
                    setErrors((e) => ({ ...e, date: null }));
                  }}
                  error={errors.date}
                  keyboardType="numeric"
                  accessibilityLabel="Fecha de la cita"
                  accessibilityHint="Formato año-mes-día, por ejemplo 2024-12-25"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Hora"
                  placeholder="10:00"
                  value={time}
                  onChangeText={(text) => {
                    setTime(text);
                    setErrors((e) => ({ ...e, time: null }));
                  }}
                  error={errors.time}
                  keyboardType="numeric"
                  accessibilityLabel="Hora de la cita"
                  accessibilityHint="Formato 24 horas, por ejemplo 10:00"
                />
              </View>
            </View>

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
