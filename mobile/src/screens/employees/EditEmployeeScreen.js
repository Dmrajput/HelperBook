import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
import { getEmployeeById, updateEmployee } from "../../services/employeeService";
import { colors, spacing } from "../../theme";
import { buildEmployeePayload, formFromEmployee, validateEmployeeForm } from "../../utils/employeeForm";
import EmployeeForm from "./EmployeeForm";

export default function EditEmployeeScreen({ navigation, route }) {
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

    const nextErrors = validateEmployeeForm(form);
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
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {loading ? (
          <AppText color={colors.textSecondary}>Loading employee...</AppText>
        ) : form ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <AppText variant="heading" accessibilityRole="header">
              Edit Employee
            </AppText>
            <EmployeeForm form={form} onChange={updateForm} errors={errors} />
            <FieldError message={formError} />
          </ScrollView>
        ) : (
          <ErrorView title="Employee not found." message={formError} onRetry={() => setRetryKey((value) => value + 1)} />
        )}
        <View style={styles.footer}>
          {form ? (
            <AppButton
              label={submitting ? "Saving changes..." : "Save Changes"}
              onPress={submit}
              disabled={submitting || loading}
            />
          ) : null}
          <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} disabled={submitting} />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
});
