import { Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText";
import { PAYMENT_METHODS } from "../../constants/salaryPayment";
import { colors, spacing } from "../../theme";

export default function PaymentMethodSelector({ value, onChange, disabled }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label">Payment Method</AppText>
      {PAYMENT_METHODS.map((method) => {
        const selected = value === method.id;
        return (
          <Pressable
            key={method.id}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={method.label}
            disabled={disabled}
            onPress={() => onChange(method.id)}
            style={[styles.option, selected && styles.selected]}
          >
            <AppText variant="body" color={selected ? colors.textInverse : colors.text}>
              {selected ? "●" : "○"} {method.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
