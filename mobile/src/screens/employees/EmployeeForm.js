import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import RoleSelector from "../../components/RoleSelector";
import SalaryTypeSelector from "../../components/SalaryTypeSelector";
import { colors, spacing } from "../../theme";
import { formatJoiningDate } from "../../utils/employeeFormat";

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function sanitizeAmount(value) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, fraction] = cleaned.split(".");
  if (fraction === undefined) {
    return whole;
  }
  return `${whole}.${fraction.slice(0, 2)}`;
}

export default function EmployeeForm({ form, onChange, errors }) {
  const [showDate, setShowDate] = useState(false);

  return (
    <View style={styles.form}>
      <AppTextInput
        label="Employee name"
        value={form.name}
        onChangeText={(name) => onChange({ name })}
        placeholder="Ravi Patel"
        autoCapitalize="words"
        maxLength={100}
      />
      <FieldError message={errors.name} />
      <AppTextInput
        label="Phone number (optional)"
        value={form.phone}
        onChangeText={(phone) => onChange({ phone: phone.replace(/\D/g, "").slice(0, 10) })}
        placeholder="9876543210"
        keyboardType="number-pad"
        maxLength={10}
      />
      <FieldError message={errors.phone} />
      <RoleSelector value={form.role} onChange={(role) => onChange({ role })} />
      <FieldError message={errors.role} />
      {form.role === "other" ? (
        <>
          <AppTextInput
            label="Custom role"
            value={form.customRole}
            onChangeText={(customRole) => onChange({ customRole })}
            placeholder="Store Assistant"
            autoCapitalize="words"
            maxLength={80}
          />
          <FieldError message={errors.customRole} />
        </>
      ) : null}
      <View style={styles.field}>
        <AppText variant="label">Joining date</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Joining date, ${formatJoiningDate(form.joiningDate)}`}
          onPress={() => setShowDate(true)}
          style={styles.dateButton}
        >
          <AppText>{formatJoiningDate(form.joiningDate)}</AppText>
        </Pressable>
        {showDate ? (
          <DateTimePicker
            value={form.joiningDate}
            mode="date"
            maximumDate={endOfToday()}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
              if (Platform.OS !== "ios") {
                setShowDate(false);
              }
              if (event.type === "dismissed" || !selected) {
                return;
              }
              onChange({ joiningDate: selected });
            }}
          />
        ) : null}
        {showDate && Platform.OS === "ios" ? (
          <AppButton label="Done" variant="secondary" onPress={() => setShowDate(false)} />
        ) : null}
      </View>
      <FieldError message={errors.joiningDate} />
      <SalaryTypeSelector value={form.salaryType} onChange={(salaryType) => onChange({ salaryType })} />
      <AppTextInput
        label={form.salaryType === "daily" ? "Daily wage" : "Monthly salary"}
        value={form.salaryAmount}
        onChangeText={(salaryAmount) => onChange({ salaryAmount: sanitizeAmount(salaryAmount) })}
        placeholder={form.salaryType === "daily" ? "600" : "15000"}
        keyboardType="decimal-pad"
        maxLength={10}
      />
      <FieldError message={errors.salaryAmount} />
      <AppTextInput
        label="Notes (optional)"
        value={form.notes}
        onChangeText={(notes) => onChange({ notes })}
        placeholder="Works evening shift"
        autoCapitalize="sentences"
        maxLength={500}
        multiline
      />
      <FieldError message={errors.notes} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  dateButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
});
