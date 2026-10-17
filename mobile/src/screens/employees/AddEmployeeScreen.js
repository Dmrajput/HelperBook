import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import { createEmployee } from "../../services/employeeService";
import { spacing } from "../../theme";
import { buildEmployeePayload, createEmptyEmployeeForm, validateEmployeeForm } from "../../utils/employeeForm";
import { showEmployeeLimitAlert } from "../../utils/employeeLimit";
import EmployeeForm from "./EmployeeForm";

export default function AddEmployeeScreen({ navigation }) {
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
    <AppScreen title="Add Employee" subtitle="Create profile and login" icon="person-add">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <EmployeeForm form={form} onChange={updateForm} errors={errors} mode="create" />
          <FieldError message={formError} />
        </ScrollView>
        <View style={styles.footer}>
          <AppButton
            label={submitting ? "Adding employee..." : "Add Employee"}
            onPress={submit}
            disabled={submitting}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },
  footer: { gap: spacing.sm, paddingTop: spacing.md },
});
