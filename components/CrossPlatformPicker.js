import React from "react";
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  ActionSheetIOS,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const CrossPlatformPicker = ({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = "Seleccione...",
}) => {
  const normalizedOptions =
    options.length > 0 &&
    typeof options[0] === "object" &&
    options[0].label !== undefined &&
    options[0].value !== undefined
      ? options
      : options.map((opt) => ({ label: opt, value: opt }));

  if (Platform.OS === "ios") {
    const handlePress = () => {
      const optionLabels = normalizedOptions.map((opt) => opt.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...optionLabels, "Cancelar"],
          cancelButtonIndex: normalizedOptions.length,
        },
        (buttonIndex) => {
          if (buttonIndex !== normalizedOptions.length) {
            onValueChange(normalizedOptions[buttonIndex].value);
          }
        },
      );
    };

    const selectedLabel =
      normalizedOptions.find((opt) => opt.value === selectedValue)?.label ||
      placeholder;

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={{
          padding: 12,
        }}
      >
        <Text>{selectedLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={{ height: 50 }}
      >
        <Picker.Item label={placeholder} value={null} />
        {normalizedOptions.map((opt, index) => (
          <Picker.Item key={index} label={opt.label} value={opt.value} />
        ))}
      </Picker>
    </View>
  );
};

export default CrossPlatformPicker;
