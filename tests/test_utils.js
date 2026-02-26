/**
 * FACILITAME Mobile App - Utility Tests
 *
 * Tests for constants.js validation functions and patterns.
 * No external dependencies - runs with plain Node.js.
 *
 * EXECUTE: node tests/test_utils.js
 */

// ============================================================
// Mini test framework
// ============================================================
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name} — ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// ============================================================
// Import validation regex and helpers from constants
// ============================================================

// Manually define the regex (same as constants.js) since we can't import ESM
const VALIDATION_REGEX = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
  phone: /^(\+34)?[6-9]\d{8}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{10,}$/,
  nif: /^[0-9]{8}[A-Za-z]$/,
  cif: /^[A-Za-z][0-9]{7}[A-Za-z0-9]$/,
  nie: /^[XYZxyz][0-9]{7}[A-Za-z]$/,
};

const validateNifNieCif = (value) => {
  if (!value) return false;
  const cleanValue = value.toUpperCase().trim();

  if (VALIDATION_REGEX.nif.test(cleanValue)) {
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const number = parseInt(cleanValue.slice(0, 8), 10);
    const expectedLetter = letters[number % 23];
    return cleanValue[8] === expectedLetter;
  }

  if (VALIDATION_REGEX.nie.test(cleanValue)) {
    const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const niePrefix = { X: "0", Y: "1", Z: "2" };
    const number = parseInt(niePrefix[cleanValue[0]] + cleanValue.slice(1, 8), 10);
    const expectedLetter = letters[number % 23];
    return cleanValue[8] === expectedLetter;
  }

  if (VALIDATION_REGEX.cif.test(cleanValue)) {
    return true;
  }

  return false;
};

const stripHtml = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const getMimeType = (filename) => {
  const MIME_TYPES = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    txt: "text/plain",
  };
  const extension = filename.split(".").pop().toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
};

// ============================================================
// Tests
// ============================================================

console.log("\n" + "═".repeat(60));
console.log("  FACILITAME MOBILE - UTILITY TESTS");
console.log("═".repeat(60) + "\n");

// ── Email Validation ──
console.log("── Email Validation ────────────────────────────────────");

test("Valid email: user@example.com", () => {
  assert(VALIDATION_REGEX.email.test("user@example.com"));
});

test("Valid email: name.surname@company.es", () => {
  assert(VALIDATION_REGEX.email.test("name.surname@company.es"));
});

test("Valid email: user+tag@domain.co.uk", () => {
  assert(VALIDATION_REGEX.email.test("user+tag@domain.co.uk"));
});

test("Invalid email: no @", () => {
  assert(!VALIDATION_REGEX.email.test("userexample.com"));
});

test("Invalid email: no domain", () => {
  assert(!VALIDATION_REGEX.email.test("user@"));
});

test("Invalid email: empty string", () => {
  assert(!VALIDATION_REGEX.email.test(""));
});

// ── Phone Validation ──
console.log("\n── Phone Validation ────────────────────────────────────");

test("Valid phone: 612345678", () => {
  assert(VALIDATION_REGEX.phone.test("612345678"));
});

test("Valid phone: +34612345678", () => {
  assert(VALIDATION_REGEX.phone.test("+34612345678"));
});

test("Valid phone: 912345678 (landline)", () => {
  assert(VALIDATION_REGEX.phone.test("912345678"));
});

test("Invalid phone: 512345678 (starts with 5)", () => {
  assert(!VALIDATION_REGEX.phone.test("512345678"));
});

test("Invalid phone: too short", () => {
  assert(!VALIDATION_REGEX.phone.test("6123456"));
});

// ── Password Validation ──
console.log("\n── Password Validation ─────────────────────────────────");

test("Valid password: Abcdefg1", () => {
  assert(VALIDATION_REGEX.password.test("Abcdefg1"));
});

test("Invalid password: no uppercase", () => {
  assert(!VALIDATION_REGEX.password.test("abcdefg1"));
});

test("Invalid password: no lowercase", () => {
  assert(!VALIDATION_REGEX.password.test("ABCDEFG1"));
});

test("Invalid password: no digit", () => {
  assert(!VALIDATION_REGEX.password.test("Abcdefgh"));
});

test("Invalid password: too short", () => {
  assert(!VALIDATION_REGEX.password.test("Ab1"));
});

test("Strong password: valid", () => {
  assert(VALIDATION_REGEX.passwordStrong.test("Abcdefg1!@"));
});

test("Strong password: invalid without special char", () => {
  assert(!VALIDATION_REGEX.passwordStrong.test("Abcdefghij1"));
});

// ── NIF/NIE/CIF Validation ──
console.log("\n── NIF/NIE/CIF Validation ──────────────────────────────");

test("Valid NIF: 12345678Z", () => {
  assert(validateNifNieCif("12345678Z"));
});

test("Valid NIF: 00000000T", () => {
  assert(validateNifNieCif("00000000T"));
});

test("Invalid NIF: wrong letter 12345678A", () => {
  assert(!validateNifNieCif("12345678A"));
});

test("Valid NIE: X0000000T", () => {
  assert(validateNifNieCif("X0000000T"));
});

test("Valid CIF: A1234567B", () => {
  assert(validateNifNieCif("A1234567B"));
});

test("Invalid: empty string", () => {
  assert(!validateNifNieCif(""));
});

test("Invalid: null", () => {
  assert(!validateNifNieCif(null));
});

test("Invalid: random text", () => {
  assert(!validateNifNieCif("hello"));
});

// ── stripHtml ──
console.log("\n── stripHtml ───────────────────────────────────────────");

test("Strips HTML tags", () => {
  assertEqual(stripHtml("<b>Hello</b>"), "Hello");
});

test("Strips multiple tags", () => {
  assertEqual(stripHtml("<p>Hello <strong>World</strong></p>"), "Hello World");
});

test("Converts &amp; to &", () => {
  assertEqual(stripHtml("A &amp; B"), "A & B");
});

test("Converts &lt; and &gt;", () => {
  assertEqual(stripHtml("&lt;div&gt;"), "<div>");
});

test("Converts &nbsp; to space", () => {
  assertEqual(stripHtml("Hello&nbsp;World"), "Hello World");
});

test("Handles null", () => {
  assertEqual(stripHtml(null), "");
});

test("Handles empty string", () => {
  assertEqual(stripHtml(""), "");
});

// ── getMimeType ──
console.log("\n── getMimeType ─────────────────────────────────────────");

test("PDF mime type", () => {
  assertEqual(getMimeType("document.pdf"), "application/pdf");
});

test("JPG mime type", () => {
  assertEqual(getMimeType("photo.jpg"), "image/jpeg");
});

test("PNG mime type", () => {
  assertEqual(getMimeType("image.png"), "image/png");
});

test("Unknown extension returns octet-stream", () => {
  assertEqual(getMimeType("file.xyz"), "application/octet-stream");
});

test("Case insensitive", () => {
  assertEqual(getMimeType("FILE.PDF"), "application/pdf");
});

// ── File Structure ──
console.log("\n── File Structure ──────────────────────────────────────");

const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "utils/api.js",
  "utils/constants.js",
  "utils/storage.js",
  "utils/notifications.js",
  "context/AuthContext.js",
  "hooks/useApi.js",
  "hooks/useForm.js",
  "components/ui/Button.js",
  "components/ui/Input.js",
  "components/ui/Card.js",
  "components/ui/LoadingScreen.js",
  "components/ui/ErrorScreen.js",
  "app/index.js",
  "app/_layout.js",
  "app/(auth)/login.js",
  "app/(app)/tabs/_layout.js",
];

const appRoot = path.resolve(__dirname, "..");

requiredFiles.forEach((file) => {
  test(`File exists: ${file}`, () => {
    assert(fs.existsSync(path.join(appRoot, file)), `Missing: ${file}`);
  });
});

// ── API URL ──
console.log("\n── API Configuration ───────────────────────────────────");

test("API_URL uses HTTPS", () => {
  const apiContent = fs.readFileSync(path.join(appRoot, "utils/constants.js"), "utf-8");
  assert(apiContent.includes("https://"), "API_URL should use HTTPS");
});

test("API_URL points to production", () => {
  const apiContent = fs.readFileSync(path.join(appRoot, "utils/constants.js"), "utf-8");
  assert(apiContent.includes("app.facilitame.es"), "API_URL should point to app.facilitame.es");
});

// ── Auth Context ──
console.log("\n── Auth Context ────────────────────────────────────────");

test("AuthContext exports AuthProvider", () => {
  const content = fs.readFileSync(path.join(appRoot, "context/AuthContext.js"), "utf-8");
  assert(content.includes("AuthProvider"), "Should export AuthProvider");
});

test("AuthContext exports useAuth", () => {
  const content = fs.readFileSync(path.join(appRoot, "context/AuthContext.js"), "utf-8");
  assert(content.includes("useAuth"), "Should export useAuth");
});

test("AuthContext handles logout", () => {
  const content = fs.readFileSync(path.join(appRoot, "context/AuthContext.js"), "utf-8");
  assert(content.includes("logout"), "Should handle logout");
});

// ── Storage ──
console.log("\n── Storage ─────────────────────────────────────────────");

test("Storage has saveAuthToken", () => {
  const content = fs.readFileSync(path.join(appRoot, "utils/storage.js"), "utf-8");
  assert(content.includes("saveAuthToken"), "Should export saveAuthToken");
});

test("Storage has getAuthToken", () => {
  const content = fs.readFileSync(path.join(appRoot, "utils/storage.js"), "utf-8");
  assert(content.includes("getAuthToken"), "Should export getAuthToken");
});

test("Storage uses SecureStore", () => {
  const content = fs.readFileSync(path.join(appRoot, "utils/storage.js"), "utf-8");
  assert(content.includes("expo-secure-store"), "Should use expo-secure-store");
});

// ── Summary ──
const total = passed + failed;
console.log("\n" + "═".repeat(60));
console.log(`  RESULTS: ${total} tests | ✅ ${passed} passed | ❌ ${failed} failed`);
console.log("═".repeat(60));

process.exit(failed > 0 ? 1 : 0);
