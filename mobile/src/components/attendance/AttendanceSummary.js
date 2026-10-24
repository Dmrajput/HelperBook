import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const TILES = [
  {
    key: "present",
    label: "Present",
    color: colors.success,
    background: colors.successBackground,
    icon: "people",
  },
  {
    key: "absent",
    label: "Absent",
    color: colors.error,
    background: colors.errorBackground,
    icon: "person-remove",
  },
  {
    key: "halfDay",
    label: "Half Day",
    color: "#B45309",
    background: colors.warningBackground,
    icon: "time",
  },
  {
    key: "leave",
    label: "Leave",
    color: colors.info,
    background: colors.infoBackground,
    icon: "airplane",
  },
];

export default function AttendanceSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <View style={styles.row}>
      {TILES.map((tile) => (
        <View key={tile.key} style={[styles.tile, { backgroundColor: tile.background }]}>
          <View style={[styles.iconWrap, { backgroundColor: "#FFFFFF" }]}>
            <Ionicons name={tile.icon} size={14} color={tile.color} />
          </View>
          <AppText variant="subtitle" color={tile.color} style={styles.value}>
            {String(summary[tile.key] ?? 0)}
          </AppText>
          <AppText variant="caption" color={tile.color} numberOfLines={1} style={styles.label}>
            {tile.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
});
