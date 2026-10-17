import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
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

function Section({ title, subtitle, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="label" style={styles.sectionTitle}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function StatusSelector({ value, onChange }) {
  const options = [
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];
  return (
    <View style={styles.statusRow}>
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.key)}
            style={[styles.statusChip, selected && styles.statusChipSelected]}
          >
            <AppText variant="label" color={selected ? colors.primary : colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function EmployeeForm({ form, onChange, errors, mode = "create" }) {
  const [showDate, setShowDate] = useState(false);
  const isCreate = mode === "create";

  return (
    <View style={styles.form}>
      <Section title="Basic details" subtitle="Name and mobile used for employee login">
        <AppTextInput
          label="Full name"
          value={form.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="Aditi Chauhan"
          autoCapitalize="words"
          maxLength={100}
        />
        <FieldError message={errors.name} />
        <AppTextInput
          label={isCreate ? "Mobile number" : "Mobile number (optional)"}
          value={form.phone}
          onChangeText={(phone) => onChange({ phone: phone.replace(/\D/g, "").slice(0, 10) })}
          placeholder="9876543210"
          keyboardType="number-pad"
          maxLength={10}
        />
        <FieldError message={errors.phone} />
        {isCreate ? (
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.info} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.hintText}>
              Active employees get a login account with a temporary password after you save.
            </AppText>
          </View>
        ) : null}
      </Section>

      <Section title="Role & joining">
        <RoleSelector value={form.role} onChange={(role) => onChange({ role })} />
        <FieldError message={errors.role} />
        {form.role === "other" ? (
          <>
            <AppTextInput
              label="Custom role / designation"
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
        {isCreate ? (
          <>
            <AppText variant="label">Employee status</AppText>
            <StatusSelector value={form.status || "active"} onChange={(status) => onChange({ status })} />
          </>
        ) : null}
      </Section>

      <Section title="Salary" subtitle="Optional notes can help you remember shift details">
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
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  sectionBody: {
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
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  hint: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.infoBackground,
    borderRadius: 12,
    padding: spacing.sm,
  },
  hintText: {
    flex: 1,
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statusChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  statusChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
});
