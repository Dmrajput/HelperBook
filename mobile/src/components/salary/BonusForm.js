import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

export default function BonusForm({ bonuses = [], disabled, onAdd, onRemove }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function addBonus() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Bonus cannot be negative.");
      return;
    }
    setError("");
    onAdd({ amount: value, reason: reason.trim() });
    setAmount("");
    setReason("");
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle">Bonus</AppText>
      {bonuses.map((bonus, index) => (
        <View key={`${bonus.reason}-${index}`} style={styles.row}>
          <View style={styles.copy}>
            <AppText variant="body">{bonus.reason || "Bonus"}</AppText>
            <AppText variant="body">{formatInr(bonus.amount)}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove bonus"
            disabled={disabled}
            onPress={() => onRemove(index)}
          >
            <AppText variant="caption" color={colors.error}>
              Remove
            </AppText>
          </Pressable>
        </View>
      ))}
      <AppText variant="body">Total bonus {formatInr(bonuses.reduce((sum, bonus) => sum + Number(bonus.amount || 0), 0))}</AppText>
      <AppTextInput label="Amount" value={amount} onChangeText={setAmount} placeholder="2000" keyboardType="decimal-pad" />
      <AppTextInput label="Reason" value={reason} onChangeText={setReason} placeholder="Good performance" />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Add Bonus" variant="secondary" onPress={addBonus} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  copy: { flex: 1, gap: spacing.xs },
});
