/**
 * Custom hook para manejo de formularios
 * Proporciona validación y estado de forma consistente
 */

import { useState, useCallback } from "react";
import { VALIDATION_REGEX, ERROR_MESSAGES } from "../utils/constants";

/**
 * Hook para manejar formularios con validación
 * @param {object} initialValues - Valores iniciales del formulario
 * @param {object} validationRules - Reglas de validación
 * @returns {object} - { values, errors, handleChange, validate, reset, isValid }
 */
export function useForm(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Limpiar error al escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field, value) => {
    const rules = validationRules[field];
    if (!rules) return null;

    // Required
    if (rules.required && (!value || !value.toString().trim())) {
      return rules.message || ERROR_MESSAGES.validation.required;
    }

    // Email
    if (rules.email && value && !VALIDATION_REGEX.email.test(value.trim())) {
      return ERROR_MESSAGES.validation.email;
    }

    // Phone
    if (rules.phone && value && !VALIDATION_REGEX.phone.test(value.trim())) {
      return ERROR_MESSAGES.validation.phone;
    }

    // Password
    if (rules.password && value && !VALIDATION_REGEX.password.test(value)) {
      return ERROR_MESSAGES.validation.password;
    }

    // Match (para confirmar contraseña)
    if (rules.match && value !== values[rules.match]) {
      return ERROR_MESSAGES.validation.passwordMatch;
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === "function") {
      return rules.validate(value, values);
    }

    return null;
  }, [validationRules, values]);

  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid,
    setFieldError,
    setValues,
  };
}

export default useForm;
