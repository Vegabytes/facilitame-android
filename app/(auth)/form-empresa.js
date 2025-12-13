/**
 * Formulario de registro para empresas
 */

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StatusBar,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { fetchPublic } from "../../utils/api";
import { Button, Input } from "../../components/ui";
import {
  PROVINCES,
  VALIDATION_REGEX,
  ERROR_MESSAGES,
} from "../../utils/constants";

export default function FormEmpresaScreen() {
  const router = useRouter();

  // Estado del formulario
  const [formData, setFormData] = useState({
    role: "empresa",
    sales_code: "",
    name: "",
    nif_cif: "",
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

    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la empresa es obligatorio";
      isValid = false;
    }

    if (!formData.nif_cif.trim()) {
      newErrors.nif_cif = "El NIF/CIF es obligatorio";
      isValid = false;
    }

    if (!formData.region_code) {
      newErrors.region_code = "La provincia es obligatoria";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.phone.test(formData.phone.trim())) {
      newErrors.phone = ERROR_MESSAGES.validation.phone;
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.email.test(formData.email.trim())) {
      newErrors.email = ERROR_MESSAGES.validation.email;
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = ERROR_MESSAGES.validation.required;
      isValid = false;
    } else if (!VALIDATION_REGEX.password.test(formData.password)) {
      newErrors.password = ERROR_MESSAGES.validation.password;
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar la contraseña";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = ERROR_MESSAGES.validation.passwordMatch;
      isValid = false;
    }

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
        nif_cif: formData.nif_cif,
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
        setErrorMessage(response.message_html || "Error en el registro");
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
          Eres una empresa, ¡perfecto!
        </Text>

        <Input
          placeholder="Código promocional (opcional)"
          value={formData.sales_code}
          onChangeText={(value) => updateField("sales_code", value)}
          autoCapitalize="none"
        />

        <Input
          placeholder="Nombre de la empresa"
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          autoCapitalize="words"
          error={errors.name}
        />

        <Input
          placeholder="NIF / CIF"
          value={formData.nif_cif}
          onChangeText={(value) => updateField("nif_cif", value)}
          autoCapitalize="characters"
          error={errors.nif_cif}
        />

        <View className="w-full mb-2">
          <View
            className={`w-full h-14 border-2 ${errors.region_code ? "border-red-500" : "border-bright"} bg-white rounded-2xl`}
          >
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
          </View>
          {errors.region_code && (
            <Text className="text-red-500 text-sm mt-1 ml-1">
              {errors.region_code}
            </Text>
          )}
        </View>

        <Input
          placeholder="Teléfono"
          value={formData.phone}
          onChangeText={(value) => updateField("phone", value)}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <Input
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => updateField("email", value)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />

        <Input
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(value) => updateField("password", value)}
          secureTextEntry
          error={errors.password}
        />

        <Input
          placeholder="Confirma tu contraseña"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField("confirmPassword", value)}
          secureTextEntry
          error={errors.confirmPassword}
        />

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

        {errorMessage ? (
          <Text className="text-center my-4 text-white font-bold bg-red-500/30 p-3 rounded-lg w-full">
            {errorMessage}
          </Text>
        ) : null}

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
