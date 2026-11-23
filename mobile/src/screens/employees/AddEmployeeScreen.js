import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { createEmployee } from "../../services/employeeService";
import { colors, spacing } from "../../theme";
import { buildEmployeePayload, createEmptyEmployeeForm, validateEmployeeForm } from "../../utils/employeeForm";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";
import EmployeeForm from "./EmployeeForm";

export default function AddEmployeeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(createEmptyEmployeeForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateForm(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function submit() {
    if (submitting) {
      return;
    }

    const nextErrors = validateEmployeeForm(form, { requirePhone: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please check the employee details.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const data = await createEmployee(buildEmployeePayload(form, { includeStatus: true }));
      const employee = data?.employee || data;
      if (data?.temporaryPassword) {
        navigation.replace("EmployeeCredentials", {
          employeeId: employee.id,
          name: employee.name,
          phone: employee.phone,
          temporaryPassword: data.temporaryPassword,
        });
        return;
      }
      navigation.replace("EmployeeProfile", { employeeId: employee.id });
    } catch (error) {
      if (error?.code === "EMPLOYEE_LIMIT_REACHED") {
        showEmployeeLimitAlert(navigation, error);
        return;
      }
      setFormError(error?.message || "Please check the employee details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Add employee
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Create profile and login
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <EmployeeForm form={form} onChange={updateForm} errors={errors} mode="create" />
          <FieldError message={formError} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add employee"
            accessibilityState={{ disabled: submitting, busy: submitting }}
            disabled={submitting}
            onPress={submit}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !submitting && styles.pressed,
              submitting && styles.footerDisabled,
            ]}
          >
            <Ionicons name="person-add-outline" size={18} color={submitting ? colors.disabledText : colors.textInverse} />
            <AppText variant="label" color={submitting ? colors.disabledText : colors.textInverse}>
              {submitting ? "Adding employee..." : "Add employee"}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
