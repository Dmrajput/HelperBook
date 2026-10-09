import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function NotificationEmptyState() {
  return (
    <View style={styles.box}>
      <Ionicons name="notifications-outline" size={36} color={colors.primary} />
      <AppText variant="subtitle">All caught up!</AppText>
      <AppText variant="body" color={colors.textSecondary}>
        You don't have any new notifications.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
});
