/**
 * Redirección para deep link /register
 * Redirige a la pantalla de selección de tipo de usuario
 */

import { Redirect } from "expo-router";

export default function RegisterRedirect() {
  return <Redirect href="/(auth)/form-selector" />;
}
