/**
 * Pantalla de perfil de usuario
 * Permite editar datos personales, contraseña y foto de perfil
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../../../context/AuthContext";
import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { fetchWithAuth } from "../../../../utils/api";
import * as ImagePicker from "expo-image-picker";
import { LoadingScreen, Button, Input, Card } from "../../../../components/ui";
import { VALIDATION_REGEX, ERROR_MESSAGES } from "../../../../utils/constants";

export default function MiCuentaScreen() {
  const router = useRouter();
  const { profilePicture, setProfilePicture, isGuest, logout } = useAuth();

  // Estados
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  // Campos editables
  const [name, setName] = useState("");
  const [lastname, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Campos de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Estados de carga por sección
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  /**
   * Carga los datos del perfil
   */
  const loadPageData = useCallback(async () => {
    try {
      const data = await fetchWithAuth("app-user-profile", null, {
        silent: true,
      });

      if (data && data.status === "ok") {
        setPageData(data.data || {});
        setName(data.data?.name || "");
        setLastName(data.data?.lastname || "");
        setEmail(data.data?.email || "");
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPageData();
    }, [loadPageData])
  );

  /**
   * Selecciona una imagen de la galería
   */
  const pickProfileImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a la galería para actualizar la foto de perfil."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      updateProfilePicture(result.assets[0].uri);
    }
  };

  /**
   * Actualiza la foto de perfil en el servidor
   */
  const updateProfilePicture = async (uri) => {
    const formData = new FormData();
    formData.append("image", {
      uri: uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    try {
      const response = await fetchWithAuth(
        "app-user-profile-profile-picture-update",
        formData
      );

      if (response && response.status === "ok") {
        Alert.alert("", "Foto de perfil actualizada");
        setProfilePicture(uri);
      }
    } catch (error) {
      Alert.alert("Error", "Error actualizando la foto de perfil");
    }
  };

  /**
   * Actualiza los datos personales
   */
  const updateUserDetails = async () => {
    if (!name.trim() || !lastname.trim() || !email.trim()) {
      Alert.alert("Error", "Nombre, apellidos y email son obligatorios.");
      return;
    }

    if (!VALIDATION_REGEX.email.test(email.trim())) {
      Alert.alert("Error", ERROR_MESSAGES.validation.email);
      return;
    }

    setSavingDetails(true);

    try {
      const response = await fetchWithAuth("app-user-profile-details-update", {
        name: name.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
      });

      if (response && response.status === "ok") {
        Alert.alert("", "Detalles actualizados correctamente");
        setPageData((prev) => ({
          ...prev,
          name: name.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Error actualizando los detalles");
    } finally {
      setSavingDetails(false);
    }
  };

  /**
   * Actualiza la contraseña
   */
  const updateUserPassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Todos los campos de contraseña son obligatorios.");
      return;
    }

    if (!VALIDATION_REGEX.passwordStrong.test(newPassword)) {
      Alert.alert("Error", ERROR_MESSAGES.validation.password);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", ERROR_MESSAGES.validation.passwordMatch);
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetchWithAuth("app-user-profile-password-update", {
        currentPassword,
        newPassword,
      });

      if (response && response.status === "ok") {
        Alert.alert("", "Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error) {
      Alert.alert("Error", "Error actualizando la contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Vista para invitados
  if (isGuest) {
    return (
      <ScrollView className="bg-background p-4">
        <Card variant="primary" className="items-center py-8">
          <Ionicons name="person-circle-outline" size={80} color="white" />
          <Text className="text-2xl font-extrabold text-white mt-4">
            Invitado
          </Text>
          <Text className="text-white/80 text-center mt-2 px-4">
            Estás navegando como invitado. Regístrate para acceder a todas las funcionalidades.
          </Text>
        </Card>

        <Card className="mt-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Beneficios de registrarte
          </Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#30D4D1" />
              <Text className="text-gray-600">Solicitar servicios</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#30D4D1" />
              <Text className="text-gray-600">Seguimiento de tus solicitudes</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#30D4D1" />
              <Text className="text-gray-600">Notificaciones en tiempo real</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#30D4D1" />
              <Text className="text-gray-600">Historial de servicios</Text>
            </View>
          </View>
        </Card>

        <Button
          variant="primary"
          className="mt-4"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/form-selector");
          }}
        >
          Crear cuenta
        </Button>

        <Button
          variant="secondary"
          className="mt-2 mb-12"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        >
          Ya tengo cuenta
        </Button>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="bg-background p-4">
      {/* Tarjeta de perfil */}
      <TouchableOpacity onPress={pickProfileImage} activeOpacity={0.8}>
        <Card variant="primary" className="flex-row gap-4 items-center">
          <Image
            source={{ uri: profilePicture }}
            className="h-20 w-20 rounded-full border-2 border-white"
          />
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-white">
              {pageData?.name || ""} {pageData?.lastname || ""}
            </Text>
            <Text className="text-white/80">{pageData?.role_display || ""}</Text>
            <Text className="text-white/80">{pageData?.email || ""}</Text>
          </View>
        </Card>
      </TouchableOpacity>

      {/* Formulario de detalles */}
      <Card title="Detalles">
        <Input
          label="Nombre"
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />
        <Input
          label="Apellidos"
          placeholder="Apellidos"
          value={lastname}
          onChangeText={setLastName}
        />
        <Input
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          variant="secondary"
          onPress={updateUserDetails}
          loading={savingDetails}
          disabled={savingDetails}
          className="mt-2"
        >
          Actualizar detalles
        </Button>
      </Card>

      {/* Formulario de contraseña */}
      <Card title="Contraseña" className="mb-12">
        <Input
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Input
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          label="Confirmar nueva contraseña"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
        />
        <Button
          variant="secondary"
          onPress={updateUserPassword}
          loading={savingPassword}
          disabled={savingPassword}
          className="mt-2"
        >
          Actualizar contraseña
        </Button>
      </Card>
    </ScrollView>
  );
}
