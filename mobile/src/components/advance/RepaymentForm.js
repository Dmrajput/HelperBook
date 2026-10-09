import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import AttendanceDateSelector from "../attendance/AttendanceDateSelector";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";

export default function RepaymentForm({ advances, outstanding, loading, onSubmit }) {
  const active = (advances || []).filter((advance) => advance.status === "active");
  const [advanceId, setAdvanceId] = useState(active[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState("");

  function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (outstanding != null && value > Number(outstanding)) {
      setError("Repayment exceeds the outstanding balance.");
      return;
    }
    setError("");
    onSubmit({
      advanceId: advanceId || undefined,
      amount: value,
      date,
      notes: notes.trim(),
      paymentMethod: "cash",
    });
  }

  return (
    <View style={styles.form}>
      <AppText variant="body">Outstanding {formatInr(outstanding)}</AppText>
      <AppText variant="label">Apply to</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Apply to oldest advances"
        onPress={() => setAdvanceId("")}
        style={[styles.choice, advanceId === "" && styles.selected]}
      >
        <AppText variant="body">Oldest advances first</AppText>
      </Pressable>
      {active.map((advance) => (
        <Pressable
          key={advance.id}
          accessibilityRole="button"
          accessibilityState={{ selected: advanceId === advance.id }}
          accessibilityLabel={`${advance.label}, outstanding ${formatInr(advance.outstandingBalance)}`}
          onPress={() => setAdvanceId(advance.id)}
          style={[styles.choice, advanceId === advance.id && styles.selected]}
        >
          <AppText variant="body">
            {advance.label} · Outstanding {formatInr(advance.outstandingBalance)}
          </AppText>
        </Pressable>
      ))}
      <AppTextInput label="Amount" value={amount} onChangeText={setAmount} placeholder="2000" keyboardType="decimal-pad" />
      <AttendanceDateSelector date={date} onChange={setDate} />
      <AppTextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Cash repayment" />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Record Repayment" onPress={submit} loading={loading} disabled={loading || active.length === 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.successBackground },
});
