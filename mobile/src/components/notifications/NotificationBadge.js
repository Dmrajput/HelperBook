import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

export default function NotificationBadge({ count = 0, onPress, color = colors.text }) {
  const visible = Number(count) > 0;
  const label = visible ? `Notifications, ${count} unread` : "Notifications";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Ionicons name="notifications-outline" size={22} color={color} />
      {visible ? (
        <View style={styles.badge}>
          <AppText variant="caption" color={colors.textInverse}>
            {count > 99 ? "99" : String(count)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: spacing.xs,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
});
