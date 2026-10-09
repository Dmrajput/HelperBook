import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function AttendanceEmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="calendar-outline" size={26} color={colors.primary} />
      </View>
      <AppText variant="subtitle" align="center">{title}</AppText>
      <AppText variant="body" color={colors.textSecondary} align="center">
        {message}
      </AppText>
      {actionLabel ? <AppButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: "center",
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
});
