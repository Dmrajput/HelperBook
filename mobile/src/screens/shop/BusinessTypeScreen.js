import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../../components/AppText";
import { BUSINESS_TYPES } from "../../constants/shop";
import { colors, spacing } from "../../theme";

export default function BusinessTypeScreen({ selected, onSelect }) {
  return (
    <View style={styles.list}>
      {BUSINESS_TYPES.map((type) => {
        const isSelected = selected === type;
        return (
          <Pressable
            key={type}
            accessibilityRole="radio"
            accessibilityLabel={type}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(type)}
            style={[styles.card, isSelected && styles.selected]}
          >
            <AppText variant="body" style={styles.label}>
              {type}
            </AppText>
            <AppText variant="caption" color={colors.primary}>
              {isSelected ? "Selected" : "Select"}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: "#E7F3EF",
  },
  label: {
    flex: 1,
  },
});
