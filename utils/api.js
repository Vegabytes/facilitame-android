/**
 * Utilidades para llamadas a la API
 * Centraliza la lógica de fetch con autenticación
 */

import { Alert } from "react-native";
import { API_URL, ERROR_MESSAGES } from "./constants";
import { getAuthToken } from "./storage";

// Referencia global para logout (se establece desde AuthContext)
let globalLogout = null;

/**
 * Establece la función de logout global
 * @param {function} logoutFn - Función de logout del AuthContext
 */
export const setGlobalLogout = (logoutFn) => {
  globalLogout = logoutFn;
};

/**
 * Realiza una petición autenticada a la API
 * @param {string} endpoint - Endpoint de la API (sin la URL base)
 * @param {object|FormData} body - Cuerpo de la petición
 * @param {object} options - Opciones adicionales para fetch
 * @returns {Promise<object>} - Respuesta de la API
 */
export async function fetchWithAuth(endpoint, body = null, options = {}) {
  try {
    const token = await getAuthToken();

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "X-Origin": "app",
    };

    // Si es FormData, dejamos que fetch establezca el Content-Type
    // En caso contrario, usamos URLSearchParams
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    } else if (body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const fetchOptions = {
      method: "POST",
      headers,
      ...options,
    };

    // Preparar el body según el tipo
    if (body) {
      fetchOptions.body =
        body instanceof FormData ? body : new URLSearchParams(body).toString();
    }

    const response = await fetch(`${API_URL}/${endpoint}`, fetchOptions);

    // Intentar parsear JSON
    let jsonResponse;
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      console.error("Error parseando respuesta:", parseError);
      throw new Error(ERROR_MESSAGES.server);
    }

    // Manejar respuesta de logout (sesión expirada)
    if (jsonResponse.status === "logout") {
      if (globalLogout) {
        globalLogout();
      }
      return null;
    }

    // Manejar modo invitado
    if (jsonResponse.status === "guest") {
      Alert.alert("Acceso restringido", jsonResponse.message_html || "Esta función requiere una cuenta.");
      return { status: "guest", message: jsonResponse.message_html };
    }

    // Manejar errores de la API
    if (jsonResponse.status !== "ok") {
      const errorMessage = jsonResponse.message_html || jsonResponse.message_plain || ERROR_MESSAGES.server;

      // Solo mostrar Alert si no es un error silencioso
      if (!options.silent) {
        Alert.alert("Error", errorMessage);
      }

      return jsonResponse;
    }

    return jsonResponse;
  } catch (error) {
    console.error(`Error en fetchWithAuth (${endpoint}):`, error);

    // Mostrar error de red si no es silencioso
    if (!options.silent) {
      Alert.alert("Error", ERROR_MESSAGES.network);
    }

    throw error;
  }
}

/**
 * Realiza una petición sin autenticación (para login/registro)
 * @param {string} endpoint - Endpoint de la API
 * @param {object} body - Cuerpo de la petición
 * @returns {Promise<object>} - Respuesta de la API
 */
export async function fetchPublic(endpoint, body = null) {
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Origin": "app",
    };

    const fetchOptions = {
      method: "POST",
      headers,
    };

    if (body) {
      fetchOptions.body = new URLSearchParams(body).toString();
    }

    const response = await fetch(`${API_URL}/${endpoint}`, fetchOptions);

    let jsonResponse;
    try {
      jsonResponse = await response.json();
    } catch (parseError) {
      throw new Error(ERROR_MESSAGES.server);
    }

    return jsonResponse;
  } catch (error) {
    console.error(`Error en fetchPublic (${endpoint}):`, error);
    throw error;
  }
}

export { globalLogout };
