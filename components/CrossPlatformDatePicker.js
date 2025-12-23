import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const CrossPlatformDatePicker = ({
  value,
  onChange,
  mode = "date",
  placeholder = "Selecciona una fecha",
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState(value || new Date());

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (selectedDate) {
        setInternalDate(selectedDate);
        onChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setInternalDate(selectedDate);
      }
    }
  };

  const handleConfirmIOS = () => {
    setShowPicker(false);
    onChange(internalDate);
  };

  const handleCancelIOS = () => {
    setShowPicker(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={handlePress} style={styles.touchable}>
        <Text style={styles.text}>
          {value ? value.toLocaleDateString("es-ES") : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={internalDate}
          mode={mode}
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showPicker && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible={showPicker}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={internalDate}
                mode={mode}
                display="spinner"
                onChange={handleDateChange}
                preferredDatePickerStyle="wheels"
                textColor="#000"
                style={styles.datePicker}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleCancelIOS}
                  style={styles.button}
                >
                  <Text style={[styles.buttonText, { color: "#FF231F" }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmIOS}
                  style={styles.button}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: "#30D4D1", fontWeight: "600" },
                    ]}
                  >
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  touchable: {
    padding: 12,
    borderWidth: 2,
    borderColor: "#30D4D1",
    borderRadius: 20,
    backgroundColor: "white",
  },
  text: {
    paddingLeft: 5,
    fontSize: 15,
    color: "#8d8d8d",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  datePicker: {
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});

export default CrossPlatformDatePicker;
