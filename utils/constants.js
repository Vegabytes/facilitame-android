/**
 * Constantes globales de la aplicación
 * Centraliza valores que se usan en múltiples lugares
 */

// API Configuration
// Producción: https://app.facilitame.es/api
// Local: http://facilitame.test/api
export const API_URL = "http://facilitame.test/api";

// Provincias de España (ordenadas alfabéticamente)
export const PROVINCES = [
  { code: "15", name: "A Coruña" },
  { code: "01", name: "Álava" },
  { code: "02", name: "Albacete" },
  { code: "03", name: "Alicante" },
  { code: "04", name: "Almería" },
  { code: "33", name: "Asturias" },
  { code: "05", name: "Ávila" },
  { code: "06", name: "Badajoz" },
  { code: "08", name: "Barcelona" },
  { code: "48", name: "Bizkaia" },
  { code: "09", name: "Burgos" },
  { code: "10", name: "Cáceres" },
  { code: "11", name: "Cádiz" },
  { code: "39", name: "Cantabria" },
  { code: "12", name: "Castellón de la Plana" },
  { code: "51", name: "Ceuta" },
  { code: "13", name: "Ciudad Real" },
  { code: "14", name: "Córdoba" },
  { code: "16", name: "Cuenca" },
  { code: "20", name: "Gipuzkoa" },
  { code: "17", name: "Girona" },
  { code: "18", name: "Granada" },
  { code: "19", name: "Guadalajara" },
  { code: "21", name: "Huelva" },
  { code: "22", name: "Huesca" },
  { code: "07", name: "Islas Baleares" },
  { code: "23", name: "Jaén" },
  { code: "26", name: "La Rioja" },
  { code: "35", name: "Las Palmas" },
  { code: "24", name: "León" },
  { code: "25", name: "Lleida" },
  { code: "27", name: "Lugo" },
  { code: "28", name: "Madrid" },
  { code: "29", name: "Málaga" },
  { code: "52", name: "Melilla" },
  { code: "30", name: "Murcia" },
  { code: "31", name: "Navarra" },
  { code: "32", name: "Ourense" },
  { code: "34", name: "Palencia" },
  { code: "36", name: "Pontevedra" },
  { code: "37", name: "Salamanca" },
  { code: "38", name: "Santa Cruz de Tenerife" },
  { code: "40", name: "Segovia" },
  { code: "41", name: "Sevilla" },
  { code: "42", name: "Soria" },
  { code: "43", name: "Tarragona" },
  { code: "44", name: "Teruel" },
  { code: "45", name: "Toledo" },
  { code: "46", name: "Valencia" },
  { code: "47", name: "Valladolid" },
  { code: "49", name: "Zamora" },
  { code: "50", name: "Zaragoza" },
];

// Tipos de documento para formularios
export const DOCUMENT_TYPES = [
  { id: "0", label: "Tipo de documento" },
  { id: "1", label: "Póliza" },
  { id: "2", label: "Factura" },
  { id: "3", label: "Contrato" },
  { id: "99", label: "Documento" },
];

// Tipos MIME comunes
export const MIME_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

// Regex de validación
export const VALIDATION_REGEX = {
  email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  phone: /^\d+$/,
  password: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
  passwordStrong: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
};

// Colores del tema (para uso programático)
export const COLORS = {
  primary: "#30D4D1",
  secondary: "#FFA500",
  background: "#97E9E8",
  text: "#333333",
  button: "#1E4C59",
  success: "#28a745",
  warning: "#FFC107",
  danger: "#DC3545",
  bright: "#C1F2F1",
  white: "#FFFFFF",
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  network: "Error de conexión. Verifica tu conexión a internet.",
  server: "Error del servidor. Inténtalo de nuevo más tarde.",
  auth: "Sesión expirada. Por favor, inicia sesión de nuevo.",
  validation: {
    required: "Este campo es obligatorio",
    email: "El email no es válido",
    phone: "El teléfono debe contener solo números",
    password: "La contraseña debe tener al menos 8 caracteres y contener letras y números",
    passwordMatch: "Las contraseñas no coinciden",
    privacyRequired: "Debes aceptar la política de privacidad",
  },
};

// Helper para obtener tipo MIME
export const getMimeType = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
};

// Helper para obtener label de tipo de documento
export const getDocumentTypeLabel = (typeId) => {
  const type = DOCUMENT_TYPES.find((t) => t.id === typeId);
  return type ? type.label : "";
};
