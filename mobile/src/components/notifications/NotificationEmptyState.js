import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function NotificationEmptyState() {
  return (
    <View style={styles.box}>
      <View style={styles.icon}>
        <Ionicons name="notifications-outline" size={24} color={colors.info} />
      </View>
      <AppText variant="subtitle" align="center">
        All caught up
      </AppText>
      <AppText variant="body" color={colors.textSecondary} align="center">
        You don't have any new notifications.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
});
