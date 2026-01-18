/**
 * Contexto de autenticación
 * Gestiona el estado de autenticación de la aplicación
 */

import React, { createContext, useState, useEffect, useContext } from "react";
import { Platform } from "react-native";
import { fetchWithAuth, setGlobalLogout } from "../utils/api";
import {
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  clearAllStorage,
} from "../utils/storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [user, setUser] = useState(null);
  const [hasServicesEnabled, setHasServicesEnabled] = useState(false);
  const [hasAdvisory, setHasAdvisory] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  // Cargar estado de autenticación al iniciar
  useEffect(() => {
    loadAuthState();
  }, []);

  // Registrar función de logout global para la API
  useEffect(() => {
    setGlobalLogout(logout);
  }, []);

  // Registrar notificaciones push cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && Platform.OS !== "web") {
      registerForPushNotificationsAsync();
    }
  }, [isAuthenticated]);

  /**
   * Carga el estado de autenticación desde el almacenamiento
   */
  const loadAuthState = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        setIsAuthenticated(false);
        setIsReady(true);
        return;
      }

      setAuthToken(token);
      setIsAuthenticated(true);

      // Intentar cargar el perfil
      try {
        const profileResponse = await fetchWithAuth(
          "app-user-get-profile-picture",
          null,
          { silent: true }
        );

        if (profileResponse && profileResponse.status === "ok") {
          setProfilePicture(profileResponse.data);
        }
      } catch (profileError) {
        // Si falla cargar el perfil, seguimos autenticados pero sin foto
        console.log("No se pudo cargar la foto de perfil");
      }

      // Cargar si tiene servicios habilitados
      await loadServicesStatus();
    } catch (error) {
      console.error("Error cargando estado de autenticación:", error);
      setIsAuthenticated(false);
    } finally {
      setIsReady(true);
    }
  };

  /**
   * Carga el estado de servicios habilitados del usuario
   */
  const loadServicesStatus = async () => {
    try {
      const response = await fetchWithAuth(
        "app-user-has-services",
        null,
        { silent: true }
      );

      if (response && response.status === "ok") {
        setHasServicesEnabled(response.data?.has_services || false);
        setHasAdvisory(response.data?.has_advisory || false);
        setIsGuest(response.data?.is_guest || false);
      }
    } catch (error) {
      console.log("No se pudo verificar servicios habilitados");
      setHasServicesEnabled(false);
      setHasAdvisory(false);
      setIsGuest(false);
    }
  };

  /**
   * Inicia sesión con el token proporcionado
   * @param {string} token - Token de autenticación
   */
  const login = async (token) => {
    try {
      await saveAuthToken(token);
      setAuthToken(token);
      setIsAuthenticated(true);

      // Cargar foto de perfil
      try {
        const profileResponse = await fetchWithAuth(
          "app-user-get-profile-picture",
          null,
          { silent: true }
        );

        if (profileResponse && profileResponse.status === "ok") {
          setProfilePicture(profileResponse.data);
        }
      } catch (profileError) {
        console.log("No se pudo cargar la foto de perfil");
      }

      // Cargar si tiene servicios habilitados
      await loadServicesStatus();
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const logout = async () => {
    try {
      await clearAllStorage();
      setAuthToken(null);
      setIsAuthenticated(false);
      setProfilePicture(null);
      setUser(null);
      setHasServicesEnabled(false);
      setHasAdvisory(false);
      setIsGuest(false);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  /**
   * Actualiza la información del usuario
   * @param {object} userData - Datos del usuario
   */
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  /**
   * Actualiza la foto de perfil
   * @param {string} uri - URI de la nueva foto
   */
  const updateProfilePicture = (uri) => {
    setProfilePicture(uri);
  };

  const value = {
    authToken,
    isAuthenticated,
    isReady,
    profilePicture,
    user,
    hasServicesEnabled,
    hasAdvisory,
    isGuest,
    login,
    logout,
    updateUser,
    setProfilePicture: updateProfilePicture,
    refreshServicesStatus: loadServicesStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación
 * @returns {object} - Contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
}

export default AuthContext;
