import React from "react";
import { Text, StyleSheet } from "react-native";

export default function EstadoColor({ status_id, children, ...props }) {
  // Selecciona los colores según el valor de status_id
  let backgroundColor;
  let textColor;

  switch (status_id) {
    case 1: // iniciado
      backgroundColor = "black";
      textColor = "white";
      break;
    case 2: // oferta disponible
      backgroundColor = "#fff8dd";
      textColor = "#f6c000";
      break;
    case 3: // aceptada
      backgroundColor = "#e9f3ff";
      textColor = "#00c2cb";
      break;
    case 4: // en curso
      backgroundColor = "#f8f5ff";
      textColor = "#7239ea";
      break;
    case 5: // rechazada
      backgroundColor = "#ffeef3";
      textColor = "#f8285a";
      break;
    case 6: // llamada sin respuesta
      backgroundColor = "#e8ae69";
      textColor = "black";
      break;
    case 7: // activada
      backgroundColor = "#dfffea";
      textColor = "#17c653";
      break;
    case 8: // revisión solicitada
      backgroundColor = "#ffeef3";
      textColor = "#f8285a";
      break;
    default:
      backgroundColor = "#ffffff"; // Por defecto: fondo blanco
      textColor = "#000000"; // Por defecto: texto negro
      break;
  }

  const styles = StyleSheet.create({
    text: {
      backgroundColor,
      color: textColor,
      paddingHorizontal: 10,
      paddingVertical: 5,
      textAlign: "center",
      // borderRadius: 5,
      // marginVertical: 5,
    },
  });

  return (
    <Text
      style={styles.text}
      {...props}
      className="rounded-full font-extrabold text-sm"
    >
      {children}
    </Text>
  );
}
