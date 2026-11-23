import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import { getEmployeeById, updateEmployee } from "../../services/employeeService";
import { colors, spacing } from "../../theme";
import { buildEmployeePayload, formFromEmployee, validateEmployeeForm } from "../../utils/employeeForm";
import EmployeeForm from "./EmployeeForm";

export default function EditEmployeeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { employeeId } = route.params;
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployee() {
      setLoading(true);
      setFormError("");
      try {
        const employee = await getEmployeeById(employeeId);
        if (!cancelled) {
          setForm(formFromEmployee(employee));
        }
      } catch (error) {
        if (!cancelled) {
          setForm(null);
          setFormError(error?.message || "Employee not found.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmployee();
    return () => {
      cancelled = true;
    };
  }, [employeeId, retryKey]);

  function updateForm(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function submit() {
    if (submitting || !form) {
      return;
    }

    const nextErrors = validateEmployeeForm(form, { requirePhone: false });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please check the employee details.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await updateEmployee(employeeId, buildEmployeePayload(form));
      Alert.alert("Employee updated successfully.", "", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
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
              Edit employee
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Update staff details
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {loading ? (
          <View style={styles.loadingWrap} accessibilityLabel="Loading employee">
            <View style={styles.skeleton} />
            <View style={styles.skeleton} />
          </View>
        ) : form ? (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <EmployeeForm form={form} onChange={updateForm} errors={errors} mode="edit" />
            <FieldError message={formError} />
          </ScrollView>
        ) : (
          <View style={styles.loadingWrap}>
            <ErrorView
              title="Employee not found."
              message={formError}
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          </View>
        )}

        {form ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save changes"
              accessibilityState={{ disabled: submitting || loading, busy: submitting }}
              disabled={submitting || loading}
              onPress={submit}
              style={({ pressed }) => [
                styles.footerPrimary,
                pressed && !submitting && styles.pressed,
                (submitting || loading) && styles.footerDisabled,
              ]}
            >
              <Ionicons
                name="save-outline"
                size={18}
                color={submitting || loading ? colors.disabledText : colors.textInverse}
              />
              <AppText variant="label" color={submitting || loading ? colors.disabledText : colors.textInverse}>
                {submitting ? "Saving changes..." : "Save changes"}
              </AppText>
            </Pressable>
          </View>
        ) : null}
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
  loadingWrap: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  skeleton: {
    height: 96,
    borderRadius: 16,
    backgroundColor: colors.disabled,
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
