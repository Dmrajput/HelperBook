import { useCallback, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import SalaryReceiptPreview from "../../components/salary/SalaryReceiptPreview";
import { getSalaryReceipt, getSalaryReceiptPdf } from "../../services/salaryReceiptService";
import { colors, spacing } from "../../theme";
import { receiptShareMessage, saveReceiptFile, shareReceiptFile, WHATSAPP_UNAVAILABLE, whatsAppAvailable } from "../../utils/shareReceipt";

export default function SalaryReceiptScreen({ navigation, route }) {
  const { salaryId } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [file, setFile] = useState(null);
  const [actionError, setActionError] = useState("");
  const lock = useRef(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setReceipt(await getSalaryReceipt(salaryId));
    } catch (loadError) {
      setReceipt(null);
      setError(loadError.message || "Unable to load salary receipt.");
    } finally {
      setLoading(false);
    }
  }, [salaryId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function generate() {
    if (lock.current) return file;
    lock.current = true;
    setBusy("pdf");
    setActionError("");
    try {
      const pdf = await getSalaryReceiptPdf(salaryId);
      const saved = await saveReceiptFile(pdf.bytes, pdf.filename);
      setFile(saved);
      return saved;
    } catch (pdfError) {
      setActionError(pdfError.message || "Unable to generate salary receipt.\n\nPlease try again.");
      return null;
    } finally {
      lock.current = false;
      setBusy("");
    }
  }

  async function shareExisting() {
    if (lock.current) return;
    const target = file || (await generate());
    if (!target || lock.current) return;
    lock.current = true;
    setBusy("share");
    setActionError("");
    try {
      await shareReceiptFile(target);
    } catch (shareError) {
      setActionError(shareError.message || "Unable to share the receipt.\n\nThe PDF has been generated. You can try sharing again.");
    } finally {
      lock.current = false;
      setBusy("");
    }
  }

  async function shareWhatsApp() {
    const available = await whatsAppAvailable();
    if (!available) {
      Alert.alert("WhatsApp", WHATSAPP_UNAVAILABLE);
      return;
    }
    await shareExisting();
  }

  if (loading && !receipt) {
    return (
      <AppScreen title="Salary receipt" subtitle="Share or download" icon="document-text">
        <AppText variant="body" color={colors.textSecondary}>
          Loading receipt...
        </AppText>
      </AppScreen>
    );
  }

  if (!receipt) {
    const reversed = /reversed/i.test(error);
    return (
      <AppScreen title="Salary receipt" subtitle="Share or download" icon="document-text">
        <AppText variant="heading">Receipt unavailable</AppText>
        <ErrorView
          message={error || (reversed ? "The salary payment has been reversed." : "This salary does not have a valid payment yet.")}
          onRetry={load}
        />
      </AppScreen>
    );
  }

  const hasPhone = Boolean(receipt.employee?.phone);

  return (
    <AppScreen title="Salary receipt" subtitle="Share or download" icon="document-text">
      <ScrollView contentContainerStyle={styles.scroll}>
        <SalaryReceiptPreview receipt={receipt} />
        <View style={styles.card}>
          <AppText variant="subtitle">Share message</AppText>
          <AppText variant="body">{receiptShareMessage(receipt)}</AppText>
        </View>
        <FieldError message={actionError} />
        <AppButton
          label={busy === "pdf" ? "Generating PDF..." : "Generate PDF"}
          disabled={Boolean(busy)}
          onPress={generate}
        />
        <AppButton
          label={busy === "share" ? "Preparing receipt..." : "Share PDF"}
          variant="secondary"
          disabled={Boolean(busy)}
          onPress={() => shareExisting()}
        />
        {hasPhone ? (
          <AppButton label="Share on WhatsApp" variant="secondary" disabled={Boolean(busy)} onPress={shareWhatsApp} />
        ) : null}
        <AppButton label="View Salary" variant="secondary" disabled={Boolean(busy)} onPress={() => navigation.navigate("SalaryDetail", { salaryId })} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
