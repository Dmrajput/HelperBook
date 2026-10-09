import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import { colors, spacing } from "../../theme";

export default function PaidLeaveEditor({ leaveDays = 0, paidLeaveDays = 0, minPaid = 0, disabled, onSave }) {
  const [paid, setPaid] = useState(String(paidLeaveDays ?? 0));
  const [error, setError] = useState("");

  useEffect(() => {
    setPaid(String(paidLeaveDays ?? 0));
  }, [paidLeaveDays]);

  const paidValue = Number(paid);
  const unpaid = Number.isFinite(paidValue) ? Math.max(0, Number(leaveDays) - paidValue) : Number(leaveDays);

  function save() {
    if (!Number.isFinite(paidValue) || paidValue < 0) {
      setError("Paid leave cannot be negative.");
      return;
    }
    if (paidValue < Number(minPaid)) {
      setError(`Paid leave cannot be less than the ${minPaid} approved paid leave day(s).`);
      return;
    }
    if (paidValue > Number(leaveDays)) {
      setError("Paid leave cannot be greater than total leave.");
      return;
    }
    setError("");
    onSave(paidValue);
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle">Paid leave</AppText>
      <AppText variant="body">Leave days {leaveDays}</AppText>
      {minPaid > 0 ? (
        <AppText variant="caption" color={colors.textSecondary}>
          Approved paid leave already counts as {minPaid} day(s).
        </AppText>
      ) : null}
      <AppTextInput label="Paid leave" value={paid} onChangeText={setPaid} keyboardType="decimal-pad" />
      <AppText variant="body" color={colors.textSecondary}>
        Unpaid leave {Number.isFinite(unpaid) ? unpaid : leaveDays}
      </AppText>
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Save paid leave" variant="secondary" onPress={save} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
