/**
 * Utilidades de almacenamiento seguro
 * Wrapper sobre expo-secure-store con fallback a AsyncStorage
 */

import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Claves de almacenamiento
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_PROFILE: "userProfile",
  PUSH_TOKEN: "pushToken",
  ONBOARDING_COMPLETED: "onboardingCompleted",
};

/**
 * Verifica si SecureStore está disponible
 */
const isSecureStoreAvailable = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Guarda un valor de forma segura
 * Usa SecureStore en dispositivos compatibles, AsyncStorage como fallback
 */
export const secureSet = async (key, value) => {
  try {
    const useSecure = await isSecureStoreAvailable();

    if (useSecure) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Error guardando ${key}:`, error);
    return false;
  }
};

/**
 * Obtiene un valor almacenado de forma segura
 */
export const secureGet = async (key) => {
  try {
    const useSecure = await isSecureStoreAvailable();

    if (useSecure) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`Error obteniendo ${key}:`, error);
    return null;
  }
};

/**
 * Elimina un valor almacenado
 */
export const secureRemove = async (key) => {
  try {
    const useSecure = await isSecureStoreAvailable();

    if (useSecure) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error(`Error eliminando ${key}:`, error);
    return false;
  }
};

/**
 * Limpia todo el almacenamiento (para logout)
 */
export const clearAllStorage = async () => {
  try {
    const useSecure = await isSecureStoreAvailable();

    // Eliminar claves conocidas de SecureStore
    if (useSecure) {
      await Promise.all(
        Object.values(STORAGE_KEYS).map((key) =>
          SecureStore.deleteItemAsync(key).catch(() => {})
        )
      );
    }

    // Limpiar AsyncStorage completamente
    await AsyncStorage.clear();

    return true;
  } catch (error) {
    console.error("Error limpiando almacenamiento:", error);
    return false;
  }
};

/**
 * Guarda el token de autenticación
 */
export const saveAuthToken = async (token) => {
  return secureSet(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Obtiene el token de autenticación
 */
export const getAuthToken = async () => {
  return secureGet(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Elimina el token de autenticación
 */
export const removeAuthToken = async () => {
  return secureRemove(STORAGE_KEYS.AUTH_TOKEN);
};
