import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import ScreenContainer from "../../components/ScreenContainer";
import { getEmployeeReceipt, getEmployeeReceiptPdf } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatInr } from "../../utils/dashboardFormat";
import { saveReceiptFile, shareReceiptFile } from "../../utils/shareReceipt";

export default function EmployeeSalaryReceiptScreen({ route }) {
  const salaryId = route?.params?.salaryId;
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setReceipt(await getEmployeeReceipt(salaryId));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "No salary receipts available yet.");
    }
  }, [salaryId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const share = async () => {
    setBusy(true);
    try {
      const file = await getEmployeeReceiptPdf(salaryId);
      const saved = await saveReceiptFile(file.bytes, file.filename);
      await shareReceiptFile(saved);
    } catch (shareError) {
      Alert.alert("Receipt", shareError?.message || "Unable to share the receipt.");
    } finally {
      setBusy(false);
    }
  };

  if (error && !receipt) return <ScreenContainer><ErrorView message={error} onRetry={load} /></ScreenContainer>;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">Salary Receipt</AppText>
        <AppText variant="body">{receipt?.employee?.name}</AppText>
        <AppText variant="body">{receipt?.receipt?.receiptNumber}</AppText>
        <AppText variant="subtitle">{formatInr(receipt?.finalSalary)}</AppText>
        <AppButton label={busy ? "Preparing..." : "Share Receipt"} onPress={share} loading={busy} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
});
