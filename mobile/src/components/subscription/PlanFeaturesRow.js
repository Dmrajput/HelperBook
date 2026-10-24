import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";
import { FEATURE_HIGHLIGHTS } from "./planMeta";

export default function PlanFeaturesRow() {
  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Plan Features</AppText>
      <View style={styles.row}>
        {FEATURE_HIGHLIGHTS.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <AppText variant="caption" color={colors.textSecondary} align="center" style={styles.label}>
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center", flex: 1, gap: 6 },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  label: { fontSize: 10, lineHeight: 13 },
});
