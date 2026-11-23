import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../../components/AppText";
import { BUSINESS_TYPES } from "../../constants/shop";
import { colors, spacing } from "../../theme";

const ICONS = {
  "Kirana / General Store": "storefront-outline",
  "Retail Store": "bag-handle-outline",
  Restaurant: "restaurant-outline",
  Cafe: "cafe-outline",
  Salon: "cut-outline",
  "Medical Store": "medkit-outline",
  Garage: "car-outline",
  Workshop: "construct-outline",
  "Clothing Store": "shirt-outline",
  Bakery: "pizza-outline",
  "Small Office": "briefcase-outline",
  Other: "ellipsis-horizontal-circle-outline",
};

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
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Ionicons
                name={ICONS[type] || "storefront-outline"}
                size={18}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
            </View>
            <AppText variant="body" style={styles.label} numberOfLines={1}>
              {type}
            </AppText>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={isSelected ? colors.primary : colors.border}
            />
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
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: {
    backgroundColor: colors.surface,
  },
  label: {
    flex: 1,
    fontWeight: "600",
  },
});
