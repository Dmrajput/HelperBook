import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";

export default function DeductionForm({ deductions = [], disabled, onAdd, onRemove }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function addDeduction() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setError("Deduction cannot be negative.");
      return;
    }
    if (!reason.trim()) {
      setError("A deduction needs a reason.");
      return;
    }
    setError("");
    onAdd({ amount: value, reason: reason.trim() });
    setAmount("");
    setReason("");
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle">Deduction</AppText>
      {deductions.map((deduction, index) => (
        <View key={`${deduction.reason}-${index}`} style={styles.row}>
          <View style={styles.copy}>
            <AppText variant="body">{deduction.reason}</AppText>
            <AppText variant="body">{formatInr(deduction.amount)}</AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove deduction"
            disabled={disabled}
            onPress={() => onRemove(index)}
          >
            <AppText variant="caption" color={colors.error}>
              Remove
            </AppText>
          </Pressable>
        </View>
      ))}
      <AppText variant="body">
        Total deduction {formatInr(deductions.reduce((sum, deduction) => sum + Number(deduction.amount || 0), 0))}
      </AppText>
      <AppTextInput label="Amount" value={amount} onChangeText={setAmount} placeholder="500" keyboardType="decimal-pad" />
      <AppTextInput label="Reason" value={reason} onChangeText={setReason} placeholder="Late penalty" />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Add Deduction" variant="secondary" onPress={addDeduction} disabled={disabled} />
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
