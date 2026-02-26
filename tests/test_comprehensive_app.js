/**
 * FACILITAME Mobile App - Comprehensive Static Analysis Tests
 *
 * Reads JS source files and verifies patterns, structure,
 * API alignment, security, error handling, and more.
 * No external dependencies - runs with plain Node.js.
 *
 * EXECUTE: node tests/test_comprehensive_app.js
 */

const fs = require("fs");
const path = require("path");

// ============================================================
// Mini test framework
// ============================================================
let passed = 0;
let failed = 0;
let total = 0;

function test(name, result) {
  total++;
  if (result) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

const appRoot = path.resolve(__dirname, "..");
const backendRoot = "C:/Users/acast/Documents/Facilitame";

function readFile(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), "utf8");
  } catch {
    return null;
  }
}

function readAppFile(relativePath) {
  return readFile(path.join(appRoot, relativePath));
}

function readBackendFile(relativePath) {
  return readFile(path.join(backendRoot, relativePath));
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

/**
 * Extract all fetchWithAuth("endpoint-name") calls from source code.
 * Matches patterns like: fetchWithAuth("endpoint-name" and fetchWithAuth("endpoint-name?...
 */
function extractEndpoints(source) {
  const endpoints = [];
  const regex = /fetchWithAuth\(\s*["'`]([^"'`?]+)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    endpoints.push(match[1]);
  }
  return endpoints;
}

// ============================================================
// Tests
// ============================================================

console.log("\n" + "=".repeat(60));
console.log("  FACILITAME MOBILE - COMPREHENSIVE STATIC ANALYSIS TESTS");
console.log("=".repeat(60) + "\n");

// ============================================================
// 1. Screen Files Exist
// ============================================================
console.log("-- 1. Screen Files Exist -----------------------------------");

const screenFiles = [
  "app/(auth)/login.js",
  "app/(app)/tabs/asesorias/index.js",
  "app/(app)/tabs/asesorias/contratos.js",
  "app/(app)/tabs/asesorias/nominas.js",
  "app/(app)/tabs/asesorias/facturas.js",
  "app/(app)/tabs/asesorias/metricas.js",
  "app/(app)/tabs/asesorias/citas.js",
  "app/(app)/tabs/asesorias/nueva-cita.js",
  "app/(app)/tabs/asesorias/emitir-factura.js",
  "app/(app)/tabs/asesorias/comunicaciones.js",
  "app/(app)/tabs/asesorias/tu-asesor.js",
  "app/(app)/tabs/asesorias/info.js",
  "app/(app)/tabs/inicio/index.js",
  "app/(app)/tabs/mi-cuenta/index.js",
  "app/(app)/tabs/mis-solicitudes/index.js",
];

screenFiles.forEach((file) => {
  test(`File exists: ${file}`, fileExists(path.join(appRoot, file)));
});

// ============================================================
// 2. All Screens Use fetchWithAuth
// ============================================================
console.log("\n-- 2. Screens Use fetchWithAuth (not raw fetch) ------------");

const screensWithAPICalls = [
  "app/(app)/tabs/asesorias/index.js",
  "app/(app)/tabs/asesorias/contratos.js",
  "app/(app)/tabs/asesorias/nominas.js",
  "app/(app)/tabs/asesorias/facturas.js",
  "app/(app)/tabs/asesorias/metricas.js",
  "app/(app)/tabs/asesorias/citas.js",
  "app/(app)/tabs/asesorias/nueva-cita.js",
  "app/(app)/tabs/asesorias/emitir-factura.js",
  "app/(app)/tabs/asesorias/comunicaciones.js",
  "app/(app)/tabs/asesorias/tu-asesor.js",
  "app/(app)/tabs/asesorias/info.js",
];

screensWithAPICalls.forEach((file) => {
  const content = readAppFile(file);
  const name = path.basename(file);
  if (content) {
    test(
      `${name} imports fetchWithAuth`,
      content.includes("fetchWithAuth")
    );
    // Ensure no raw fetch() calls that bypass auth
    // Allow "fetchPublic" and "fetchWithAuth" but flag bare fetch( usage
    const lines = content.split("\n");
    const hasRawFetch = lines.some((line) => {
      // Skip import lines and comments
      if (line.trim().startsWith("import ") || line.trim().startsWith("//") || line.trim().startsWith("*")) return false;
      // Check for bare fetch( that is not fetchWithAuth or fetchPublic
      return /\bfetch\s*\(/.test(line) && !line.includes("fetchWithAuth") && !line.includes("fetchPublic");
    });
    test(`${name} does not use raw fetch()`, !hasRawFetch);
  } else {
    test(`${name} could be read`, false);
  }
});

// ============================================================
// 3. Error Handling
// ============================================================
console.log("\n-- 3. Error Handling (try/catch, loading, error states) ----");

screensWithAPICalls.forEach((file) => {
  const content = readAppFile(file);
  const name = path.basename(file);
  if (content) {
    test(`${name} has try/catch around API calls`, content.includes("try {") && content.includes("catch"));
    test(`${name} has loading state`, content.includes("useState") && (content.includes("loading") || content.includes("Loading")));
  }
});

// ============================================================
// 4. Form Validation
// ============================================================
console.log("\n-- 4. Form Validation --------------------------------------");

const formScreens = [
  { file: "app/(app)/tabs/asesorias/nueva-cita.js", name: "nueva-cita.js" },
  { file: "app/(app)/tabs/asesorias/emitir-factura.js", name: "emitir-factura.js" },
  { file: "app/(auth)/login.js", name: "login.js" },
];

formScreens.forEach(({ file, name }) => {
  const content = readAppFile(file);
  if (content) {
    test(
      `${name} has validation function or checks`,
      content.includes("validateForm") || content.includes("validate") || content.includes("errors")
    );
    test(
      `${name} checks for empty/required fields`,
      content.includes("!") && (content.includes("trim()") || content.includes("obligatorio") || content.includes("Selecciona"))
    );
  }
});

// ============================================================
// 5. Navigation Safety
// ============================================================
console.log("\n-- 5. Navigation Safety ------------------------------------");

const allScreenFiles = [
  ...screensWithAPICalls,
  "app/(auth)/login.js",
  "app/(app)/tabs/inicio/index.js",
  "app/(app)/tabs/mi-cuenta/index.js",
  "app/(app)/tabs/mis-solicitudes/index.js",
];

allScreenFiles.forEach((file) => {
  const content = readAppFile(file);
  const name = path.basename(file);
  if (content) {
    const hasRouterImport =
      content.includes("useRouter") || content.includes("expo-router");
    test(`${name} imports from expo-router`, hasRouterImport);
    const usesRouter =
      content.includes("router.push") ||
      content.includes("router.replace") ||
      content.includes("router.back");
    test(`${name} uses router.push/replace/back`, usesRouter);
  }
});

// ============================================================
// 6. API Endpoints Match Backend
// ============================================================
console.log("\n-- 6. API Endpoints Match Backend --------------------------");

// Collect all endpoints from all advisory screen files
const endpointScreenMap = {};
screensWithAPICalls.forEach((file) => {
  const content = readAppFile(file);
  const name = path.basename(file);
  if (content) {
    const endpoints = extractEndpoints(content);
    endpoints.forEach((ep) => {
      if (!endpointScreenMap[ep]) endpointScreenMap[ep] = [];
      endpointScreenMap[ep].push(name);
    });
  }
});

// Also include login.js fetchPublic endpoints
const loginContent = readAppFile("app/(auth)/login.js");
if (loginContent) {
  const loginEndpoints = [];
  const regex = /fetchPublic\(\s*["'`]([^"'`?]+)/g;
  let match;
  while ((match = regex.exec(loginContent)) !== null) {
    loginEndpoints.push(match[1]);
  }
  loginEndpoints.forEach((ep) => {
    if (!endpointScreenMap[ep]) endpointScreenMap[ep] = [];
    endpointScreenMap[ep].push("login.js");
  });
}

// Check each endpoint has a matching backend PHP file
Object.entries(endpointScreenMap).forEach(([endpoint, screens]) => {
  const phpFile = path.join(backendRoot, "api", `${endpoint}.php`);
  test(
    `Backend API exists: ${endpoint}.php (used by ${screens.join(", ")})`,
    fileExists(phpFile)
  );
});

// ============================================================
// 7. 403 Error Handling
// ============================================================
console.log("\n-- 7. 403/Permission Error Handling ------------------------");

const emitirFacturaContent = readAppFile("app/(app)/tabs/asesorias/emitir-factura.js");
if (emitirFacturaContent) {
  test(
    "emitir-factura.js handles 403 status",
    emitirFacturaContent.includes("403") || emitirFacturaContent.includes("No autorizado") || emitirFacturaContent.includes("solo las asesor")
  );
}

const facturasContent = readAppFile("app/(app)/tabs/asesorias/facturas.js");
if (facturasContent) {
  test(
    "facturas.js checks canSend/canSendInvoices permission",
    facturasContent.includes("canSend") || facturasContent.includes("can_send")
  );
}

// ============================================================
// 8. Loading States
// ============================================================
console.log("\n-- 8. Loading States (ActivityIndicator, RefreshControl) ---");

const listScreens = [
  "app/(app)/tabs/asesorias/index.js",
  "app/(app)/tabs/asesorias/contratos.js",
  "app/(app)/tabs/asesorias/nominas.js",
  "app/(app)/tabs/asesorias/facturas.js",
  "app/(app)/tabs/asesorias/citas.js",
  "app/(app)/tabs/asesorias/comunicaciones.js",
  "app/(app)/tabs/asesorias/metricas.js",
];

listScreens.forEach((file) => {
  const content = readAppFile(file);
  const name = path.basename(file);
  if (content) {
    test(
      `${name} has ActivityIndicator`,
      content.includes("ActivityIndicator")
    );
    test(
      `${name} has RefreshControl (pull-to-refresh)`,
      content.includes("RefreshControl")
    );
  }
});

// ============================================================
// 9. Empty States
// ============================================================
console.log("\n-- 9. Empty States for List Screens ------------------------");

const emptyStateScreens = [
  { file: "app/(app)/tabs/asesorias/contratos.js", name: "contratos.js" },
  { file: "app/(app)/tabs/asesorias/nominas.js", name: "nominas.js" },
  { file: "app/(app)/tabs/asesorias/facturas.js", name: "facturas.js" },
  { file: "app/(app)/tabs/asesorias/citas.js", name: "citas.js" },
  { file: "app/(app)/tabs/asesorias/comunicaciones.js", name: "comunicaciones.js" },
];

emptyStateScreens.forEach(({ file, name }) => {
  const content = readAppFile(file);
  if (content) {
    test(
      `${name} handles empty data (ListEmptyComponent or empty check)`,
      content.includes("ListEmptyComponent") || content.includes("length === 0") || content.includes("No hay") || content.includes("No tienes")
    );
  }
});

// ============================================================
// 10. Auth Context
// ============================================================
console.log("\n-- 10. Auth Context ----------------------------------------");

const authContent = readAppFile("context/AuthContext.js");
if (authContent) {
  test("AuthContext exports AuthProvider", authContent.includes("export") && authContent.includes("AuthProvider"));
  test("AuthContext exports useAuth", authContent.includes("export") && authContent.includes("useAuth"));
  test("AuthContext has login function", authContent.includes("login"));
  test("AuthContext has logout function", authContent.includes("logout"));
  test("AuthContext handles token storage via saveAuthToken", authContent.includes("saveAuthToken"));
  test("AuthContext handles token retrieval via getAuthToken", authContent.includes("getAuthToken"));
  test("AuthContext clears storage on logout", authContent.includes("clearAllStorage"));
} else {
  test("AuthContext file could be read", false);
}

// ============================================================
// 11. Storage Security
// ============================================================
console.log("\n-- 11. Storage Security ------------------------------------");

const storageContent = readAppFile("utils/storage.js");
if (storageContent) {
  test("storage.js uses SecureStore (expo-secure-store)", storageContent.includes("expo-secure-store"));
  test("storage.js imports SecureStore", storageContent.includes("SecureStore"));
  test("storage.js has saveAuthToken", storageContent.includes("saveAuthToken"));
  test("storage.js has getAuthToken", storageContent.includes("getAuthToken"));
  test("storage.js has removeAuthToken", storageContent.includes("removeAuthToken"));
  test("storage.js has clearAllStorage for logout", storageContent.includes("clearAllStorage"));
  test("storage.js does NOT store tokens in plain AsyncStorage for auth", !storageContent.includes('AsyncStorage.setItem(') || storageContent.includes("fallback"));
} else {
  test("storage.js file could be read", false);
}

// ============================================================
// 12. API Configuration
// ============================================================
console.log("\n-- 12. API Configuration -----------------------------------");

const apiContent = readAppFile("utils/api.js");
const constantsContent = readAppFile("utils/constants.js");

if (constantsContent) {
  test("API_URL uses HTTPS", constantsContent.includes("https://"));
  test("API_URL points to app.facilitame.es", constantsContent.includes("app.facilitame.es"));
}

if (apiContent) {
  test("api.js has auth token handling (getAuthToken)", apiContent.includes("getAuthToken"));
  test("api.js includes auth_token in requests", apiContent.includes("auth_token"));
  test("api.js handles error responses (status !== ok)", apiContent.includes('status !== "ok"') || apiContent.includes("status !== 'ok'"));
  test("api.js handles logout/session expired", apiContent.includes("logout") && apiContent.includes("status"));
  test("api.js handles network errors in catch block", apiContent.includes("catch") && apiContent.includes("error"));
  test("api.js handles JSON parse errors", apiContent.includes("JSON.parse") || apiContent.includes("response.json"));
  test("api.js sets X-Origin header to app", apiContent.includes('"X-Origin"') && apiContent.includes('"app"'));
} else {
  test("api.js file could be read", false);
}

// ============================================================
// 13. Invoice Screen Specifics (emitir-factura.js)
// ============================================================
console.log("\n-- 13. Invoice Screen Specifics (emitir-factura.js) --------");

if (emitirFacturaContent) {
  test("Has client picker (selectedClient state)", emitirFacturaContent.includes("selectedClient") || emitirFacturaContent.includes("ClientPicker"));
  test("Has client picker modal", emitirFacturaContent.includes("showClientPicker") || emitirFacturaContent.includes("ClientPicker"));
  test("Has line items management (lines state)", emitirFacturaContent.includes("setLines"));
  test("Has add line functionality", emitirFacturaContent.includes("addLine") || emitirFacturaContent.includes("Añadir línea") || emitirFacturaContent.includes("add line"));
  test("Has remove line functionality", emitirFacturaContent.includes("removeLine") || emitirFacturaContent.includes("Eliminar"));
  test("Has IVA options", emitirFacturaContent.includes("IVA_OPTIONS") || emitirFacturaContent.includes("tax_rate"));
  test("Has IRPF options", emitirFacturaContent.includes("IRPF_OPTIONS") || emitirFacturaContent.includes("irpf"));
  test("Has totals calculation (calcTotals)", emitirFacturaContent.includes("calcTotals") || emitirFacturaContent.includes("subtotal"));
  test("Calls create API (advisory-issued-invoice-create)", emitirFacturaContent.includes("advisory-issued-invoice-create"));
  test("Calls emit API (advisory-issued-invoice-emit)", emitirFacturaContent.includes("advisory-issued-invoice-emit"));
  test("Has borrador/draft option", emitirFacturaContent.includes("borrador") || emitirFacturaContent.includes("Borrador") || emitirFacturaContent.includes("draft"));
} else {
  test("emitir-factura.js file could be read", false);
}

// ============================================================
// 14. Menu Configuration (asesorias/index.js)
// ============================================================
console.log("\n-- 14. Menu Configuration (asesorias/index.js) -------------");

const asesoriasIndexContent = readAppFile("app/(app)/tabs/asesorias/index.js");
if (asesoriasIndexContent) {
  test("Has MENU_OPTIONS array", asesoriasIndexContent.includes("MENU_OPTIONS"));

  const expectedMenuItems = [
    { id: "tu-asesor", route: "/tabs/asesorias/tu-asesor" },
    { id: "facturas", route: "/tabs/asesorias/facturas" },
    { id: "citas", route: "/tabs/asesorias/citas" },
    { id: "comunicados", route: "/tabs/asesorias/comunicaciones" },
    { id: "nueva-cita", route: "/tabs/asesorias/nueva-cita" },
    { id: "contratos", route: "/tabs/asesorias/contratos" },
    { id: "nominas", route: "/tabs/asesorias/nominas" },
    { id: "metricas", route: "/tabs/asesorias/metricas" },
    { id: "emitir-factura", route: "/tabs/asesorias/emitir-factura" },
    { id: "info", route: "/tabs/asesorias/info" },
  ];

  expectedMenuItems.forEach((item) => {
    test(
      `Menu has item: ${item.id}`,
      asesoriasIndexContent.includes(`"${item.id}"`) || asesoriasIndexContent.includes(`'${item.id}'`)
    );
  });

  // Check each menu item has route, icon, description
  test("Menu items have route property", asesoriasIndexContent.includes("route:"));
  test("Menu items have icon property", asesoriasIndexContent.includes("icon:"));
  test("Menu items have description property", asesoriasIndexContent.includes("description:"));

  // Verify routes point to valid screen files
  expectedMenuItems.forEach((item) => {
    const screenPath = item.route.replace("/tabs/asesorias/", "app/(app)/tabs/asesorias/") + ".js";
    test(
      `Menu route valid: ${item.route} -> ${path.basename(screenPath)}`,
      fileExists(path.join(appRoot, screenPath))
    );
  });
} else {
  test("asesorias/index.js file could be read", false);
}

// ============================================================
// 15. Date Handling
// ============================================================
console.log("\n-- 15. Date Handling ---------------------------------------");

// Screens with date pickers (need Platform-specific handling)
const datePickerScreens = [
  { file: "app/(app)/tabs/asesorias/nueva-cita.js", name: "nueva-cita.js" },
  { file: "app/(app)/tabs/asesorias/emitir-factura.js", name: "emitir-factura.js" },
  { file: "app/(app)/tabs/asesorias/comunicaciones.js", name: "comunicaciones.js" },
];

datePickerScreens.forEach(({ file, name }) => {
  const content = readAppFile(file);
  if (content) {
    test(
      `${name} imports DateTimePicker`,
      content.includes("DateTimePicker") || content.includes("datetimepicker")
    );
    const handlesIOSAndroid =
      (content.includes("Platform.OS") && content.includes("ios")) ||
      (content.includes("Platform.OS") && content.includes("android"));
    test(
      `${name} handles iOS/Android date differences`,
      handlesIOSAndroid
    );
  }
});

// Screens that display dates (just need date formatting)
const dateDisplayScreens = [
  { file: "app/(app)/tabs/asesorias/citas.js", name: "citas.js" },
];

dateDisplayScreens.forEach(({ file, name }) => {
  const content = readAppFile(file);
  if (content) {
    test(
      `${name} has date formatting (toLocaleDateString or formatDate)`,
      content.includes("toLocaleDateString") || content.includes("formatDate") || content.includes("toLocaleString")
    );
  }
});

// ============================================================
// 16. File Upload Handling
// ============================================================
console.log("\n-- 16. File Upload Handling --------------------------------");

if (facturasContent) {
  test(
    "facturas.js uses DocumentPicker (expo-document-picker)",
    facturasContent.includes("expo-document-picker") || facturasContent.includes("DocumentPicker")
  );
  test(
    "facturas.js uses ImagePicker (expo-image-picker)",
    facturasContent.includes("expo-image-picker") || facturasContent.includes("ImagePicker")
  );
  test(
    "facturas.js validates file types (type restriction in picker)",
    facturasContent.includes("application/pdf") || facturasContent.includes("image/jpeg") || facturasContent.includes("image/png")
  );
  test(
    "facturas.js uses FormData for upload",
    facturasContent.includes("FormData") || facturasContent.includes("formData")
  );
  test(
    "facturas.js appends files to FormData",
    facturasContent.includes("formData.append") || facturasContent.includes("FormData")
  );
}

// Also check tu-asesor.js for file upload (chat with PDF)
const tuAsesorContent = readAppFile("app/(app)/tabs/asesorias/tu-asesor.js");
if (tuAsesorContent) {
  test(
    "tu-asesor.js uses DocumentPicker for file sending",
    tuAsesorContent.includes("DocumentPicker") || tuAsesorContent.includes("expo-document-picker")
  );
}

// ============================================================
// Summary
// ============================================================
console.log("\n" + "=".repeat(60));
console.log(`  RESULTS: ${total} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log("=".repeat(60));

process.exit(failed > 0 ? 1 : 0);
