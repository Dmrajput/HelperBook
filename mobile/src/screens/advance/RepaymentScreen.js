import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import RepaymentForm from "../../components/advance/RepaymentForm";
import AppScreen from "../../components/AppScreen";
import { getEmployeeAdvances, recordRepayment } from "../../services/advanceService";
import { colors, spacing } from "../../theme";

export default function RepaymentScreen({ navigation, route }) {
  const { employeeId, employeeName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getEmployeeAdvances(employeeId, { status: "active", limit: 50 }));
    } catch (loadError) {
      setError(loadError.message || "Unable to load advance information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submit(values) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await recordRepayment({
        employeeId,
        ...values,
        requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      });
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "Repayment could not be recorded. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen title="Record repayment" subtitle={employeeName || "Money paid back"} icon="cash">
      <ScrollView contentContainerStyle={styles.scroll}>
        {employeeName ? <AppText variant="subtitle">{employeeName}</AppText> : null}
        {loading && !data ? <View style={styles.block} accessibilityLabel="Loading repayment" /> : null}
        {error && !data ? <ErrorView message={error} onRetry={load} /> : null}
        {data ? (
          <RepaymentForm
            advances={data.advances}
            outstanding={data.summary.outstanding}
            loading={saving}
            onSubmit={submit}
          />
        ) : null}
        <FieldError message={data ? error : ""} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  block: { height: 120, borderRadius: 12, backgroundColor: colors.disabled },
});