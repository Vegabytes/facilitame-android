import React, { createContext, useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/api";
import { ActivityIndicator } from "react-native";

export const SolicitudContext = createContext();

export const SolicitudProvider = ({ id, children }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSolicitud = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("app-user-get-request", { id });
      if (response && response.data) {
        setSolicitud(response.data);
      }
    } catch (error) {
      console.error("Error al cargar solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSolicitud();
  }, [id]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        className="bg-background"
      />
    );
  }

  return (
    <SolicitudContext.Provider
      value={{ solicitud, setSolicitud, refreshSolicitud: loadSolicitud }}
    >
      {children}
    </SolicitudContext.Provider>
  );
};
