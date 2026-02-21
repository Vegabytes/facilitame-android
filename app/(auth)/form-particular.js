/**
 * Formulario de registro para particulares
 */

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActionSheetIOS,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { fetchPublic } from "../../utils/api";
import { Button, Input } from "../../components/ui";
import {
  PROVINCES,
  VALIDATION_REGEX,
  ERROR_MESSAGES,
} from "../../utils/constants";

export default function FormParticularScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState({
    role: "particular",
    sales_code: "",
    name: "",
    last_name: "",
    region_code: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [invoiceAccepted, setInvoiceAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  /**
   * Actualiza un campo del formulario
   */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Valida el formulario
   */
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Nombre
    if (!formData.name.trim()) {
      newErrors.name = ERROR_MESSAGES.validation.required;
      isValid = false;
    }

    // Apellido
    if (!formData.last_name.trim()) {
      newErrors.last_name = ERROR_MESSAGES.validation.required;
      isValid = false;
    }

    // Provincia
    if (!formData.region_code) {
      newErrors.region_code = "La provincia es obligatoria";
      isValid = false;
    }

    // Teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.phone.test(formData.phone.trim())) {
      newErrors.phone = ERROR_MESSAGES.validation.phone;
      isValid = false;
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.email.test(formData.email.trim())) {
      newErrors.email = ERROR_MESSAGES.validation.email;
      isValid = false;
    }

    // Contraseña
    if (!formData.password) {
      newErrors.password = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.password.test(formData.password)) {
      newErrors.password = ERROR_MESSAGES.validation.password;
      isValid = false;
    }

    // Confirmar contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar la contraseña";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = ERROR_MESSAGES.validation.passwordMatch;
      isValid = false;
    }

    // Política de privacidad
    if (!privacyAccepted) {
      newErrors.privacyAccepted = ERROR_MESSAGES.validation.privacyRequired;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Envía el formulario de registro
   */
  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        role: formData.role,
        sales_code: formData.sales_code,
        name: formData.name,
        last_name: formData.last_name,
        region_code: formData.region_code,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        "confirm-password": formData.confirmPassword,
        "allow-invoice-access": invoiceAccepted ? "1" : "0",
      };

      const response = await fetchPublic("sign-up", payload);

      if (response.status === "ok") {
        router.replace("/(auth)/ok");
      } else {
        // Usar message_plain para evitar XSS
        setErrorMessage(response.message_plain || "Error en el registro");
      }
    } catch (error) {
      console.error("Error en registro:", error);
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
    >
      <ScrollView
        className="bg-background p-4"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-button font-black text-3xl text-center mb-10">
          Eres un particular, ¡perfecto!
        </Text>

        {/* Código promocional */}
        <Input
          placeholder="Código promocional (opcional)"
          value={formData.sales_code}
          onChangeText={(value) => updateField("sales_code", value)}
          autoCapitalize="none"
        />

        {/* Nombre */}
        <Input
          placeholder="Nombre"
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          autoCapitalize="words"
          error={errors.name}
        />

        {/* Apellido */}
        <Input
          placeholder="Apellido"
          value={formData.last_name}
          onChangeText={(value) => updateField("last_name", value)}
          autoCapitalize="words"
          error={errors.last_name}
        />

        {/* Provincia */}
        <View className="w-full mb-2">
          <View
            className={`w-full h-14 border-2 ${errors.region_code ? "border-red-500" : "border-bright"} bg-white rounded-2xl justify-center`}
          >
            {Platform.OS === "ios" ? (
              <TouchableOpacity
                onPress={() => {
                  const options = [...PROVINCES.map(p => p.name), "Cancelar"];
                  ActionSheetIOS.showActionSheetWithOptions(
                    { options, cancelButtonIndex: options.length - 1 },
                    (buttonIndex) => {
                      if (buttonIndex < PROVINCES.length) {
                        updateField("region_code", PROVINCES[buttonIndex].code);
                      }
                    }
                  );
                }}
                className="px-4 h-full justify-center"
              >
                <Text style={{ color: "#777" }}>
                  {formData.region_code
                    ? PROVINCES.find(p => p.code === formData.region_code)?.name
                    : "Provincia"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Picker
                selectedValue={formData.region_code}
                onValueChange={(value) => updateField("region_code", value)}
                style={{ width: "100%", color: "#777" }}
              >
                <Picker.Item label="Provincia" value="" />
                {PROVINCES.map((province) => (
                  <Picker.Item
                    key={province.code}
                    label={province.name}
                    value={province.code}
                  />
                ))}
              </Picker>
            )}
          </View>
          {errors.region_code && (
            <Text className="text-red-500 text-sm mt-1 ml-1">
              {errors.region_code}
            </Text>
          )}
        </View>

        {/* Teléfono */}
        <Input
          placeholder="Teléfono"
          value={formData.phone}
          onChangeText={(value) => updateField("phone", value)}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        {/* Email */}
        <Input
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => updateField("email", value)}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          error={errors.email}
        />

        {/* Contraseña */}
        <Input
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(value) => updateField("password", value)}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          error={errors.password}
        />

        {/* Confirmar contraseña */}
        <Input
          placeholder="Confirma tu contraseña"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField("confirmPassword", value)}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        {/* Checkbox política de privacidad */}
        <View className="w-full gap-2 flex-row items-center justify-start mt-6 mb-2">
          <Checkbox
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            value={privacyAccepted}
            onValueChange={setPrivacyAccepted}
            color={privacyAccepted ? "#1E4C59" : undefined}
          />
          <Text className="ml-2 text-base text-gray-700 flex-1">
            Estoy de acuerdo con la{" "}
            <Text
              className="text-button font-extrabold"
              onPress={() =>
                router.push("/webview?url=https://app.facilitame.es/legal")
              }
            >
              política de privacidad
            </Text>
          </Text>
        </View>
        {errors.privacyAccepted && (
          <Text className="text-red-500 text-sm mb-4 w-full ml-1">
            {errors.privacyAccepted}
          </Text>
        )}

        {/* Mensaje de error general */}
        {errorMessage ? (
          <Text className="text-center my-4 text-white font-bold bg-red-500/30 p-3 rounded-lg w-full">
            {errorMessage}
          </Text>
        ) : null}

        {/* Botón de registro */}
        <Button
          onPress={handleSignup}
          loading={isLoading}
          disabled={isLoading}
          className="mt-4 mb-10"
        >
          ¡Regístrate!
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
