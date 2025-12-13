/**
 * Custom hook para llamadas a la API
 * Proporciona estados de loading, error y data de forma consistente
 */

import { useState, useCallback } from "react";
import { fetchWithAuth } from "../utils/api";

/**
 * Hook para realizar llamadas a la API con manejo de estado
 * @param {string} endpoint - Endpoint de la API
 * @param {object} options - Opciones adicionales
 * @returns {object} - { data, loading, error, execute, reset }
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (body = null, customOptions = {}) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth(endpoint, body, {
          ...options,
          ...customOptions,
        });

        if (response && response.status === "ok") {
          setData(response.data || response);
          return { success: true, data: response.data || response };
        } else {
          const errorMsg = response?.message_html || response?.message_plain || "Error desconocido";
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } catch (err) {
        const errorMsg = err.message || "Error de conexión";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [endpoint, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

/**
 * Hook para cargar datos al montar el componente o al enfocar
 * @param {string} endpoint - Endpoint de la API
 * @param {object} body - Body de la petición
 * @returns {object} - { data, loading, error, refresh }
 */
export function useFetch(endpoint, body = null) {
  const { data, loading, error, execute } = useApi(endpoint);

  const refresh = useCallback(() => {
    execute(body);
  }, [execute, body]);

  return { data, loading, error, refresh };
}

export default useApi;
