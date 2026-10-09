import { useState } from "react";
import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import AppText from "../AppText";
import AppTextInput from "../AppTextInput";
import AttendanceDateSelector from "../attendance/AttendanceDateSelector";
import { colors, spacing } from "../../theme";
import { todayKey } from "../../utils/attendanceFormat";

export default function AdvanceAmountForm({
  employeeName,
  submitLabel,
  loading,
  disabled,
  onSubmit,
  showMonthly = false,
}) {
  const [amount, setAmount] = useState("");
  const [monthly, setMonthly] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayKey());
  const [error, setError] = useState("");

  function submit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    const monthlyValue = monthly.trim() ? Number(monthly) : 0;
    if (showMonthly && monthly.trim() && (!Number.isFinite(monthlyValue) || monthlyValue <= 0)) {
      setError("Monthly salary deduction must be greater than 0.");
      return;
    }
    setError("");
    onSubmit({
      amount: value,
      date,
      notes: notes.trim(),
      monthlyAmount: showMonthly ? monthlyValue : 0,
    });
  }

  return (
    <View style={styles.form}>
      {employeeName ? <AppText variant="subtitle">{employeeName}</AppText> : null}
      <AppTextInput label="Amount" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="decimal-pad" />
      <AttendanceDateSelector date={date} onChange={setDate} />
      <AppTextInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Emergency advance" />
      {showMonthly ? (
        <AppTextInput
          label="Deduct from salary each month"
          value={monthly}
          onChangeText={setMonthly}
          placeholder="Optional"
          keyboardType="decimal-pad"
        />
      ) : null}
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label={submitLabel} onPress={submit} loading={loading} disabled={disabled || loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
