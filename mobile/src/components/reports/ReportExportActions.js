import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function ReportExportActions({ onPdf, onExcel, exporting }) {
  const busy = Boolean(exporting);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export Excel"
        accessibilityState={{ disabled: busy, busy: exporting === "excel" }}
        disabled={busy}
        onPress={onExcel}
        style={({ pressed }) => [
          styles.secondary,
          pressed && !busy && styles.pressed,
          busy && styles.muted,
        ]}
      >
        <Ionicons name="grid-outline" size={18} color={busy ? colors.disabledText : colors.primary} />
        <AppText variant="label" color={busy ? colors.disabledText : colors.primary}>
          {exporting === "excel" ? "Generating..." : "Export Excel"}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export PDF"
        accessibilityState={{ disabled: busy, busy: exporting === "pdf" }}
        disabled={busy}
        onPress={onPdf}
        style={({ pressed }) => [
          styles.primary,
          pressed && !busy && styles.pressed,
          busy && styles.primaryDisabled,
        ]}
      >
        <Ionicons name="document-outline" size={18} color={busy ? colors.disabledText : colors.textInverse} />
        <AppText variant="label" color={busy ? colors.disabledText : colors.textInverse}>
          {exporting === "pdf" ? "Generating..." : "Export PDF"}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryDisabled: {
    backgroundColor: colors.disabled,
  },
  muted: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
  },
});
