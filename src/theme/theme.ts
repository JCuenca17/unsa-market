// src/theme/theme.ts
import { StyleSheet } from "react-native";

export const COLORS = {
  primary: "#5A0028", // Guinda principal
  secondary: "#25D366", // Verde WhatsApp
  background: "#f5f5f5", // Fondo general (Gris muy claro)
  surface: "#ffffff", // Fondo de tarjetas y contenedores
  text: "#333333", // Texto principal oscuro
  textMuted: "#666666", // Texto secundario
  textLight: "#999999", // Texto terciario/placeholders
  border: "#dddddd", // Bordes de inputs y divisores
  danger: "#e74c3c", // Botones de eliminar/error
  dangerLight: "#fee", // Fondo suave para botones de eliminar
};

export const SPACING = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
};

// Estilos globales que se repiten en casi todas las pantallas
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerPadding: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: COLORS.textLight,
    fontSize: 16,
  },
});
