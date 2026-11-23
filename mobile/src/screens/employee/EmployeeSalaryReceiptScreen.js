import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import { getEmployeeReceipt, getEmployeeReceiptPdf } from "../../services/employeePortalService";
import { colors, spacing } from "../../theme";
import { formatAttendanceDate, formatMonth } from "../../utils/attendanceFormat";
import { formatInr } from "../../utils/dashboardFormat";
import { saveReceiptFile, shareReceiptFile } from "../../utils/shareReceipt";

function shortDate(key) {
  if (!key) return "—";
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function EmployeeSalaryReceiptScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const salaryId = route?.params?.salaryId;
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setReceipt(await getEmployeeReceipt(salaryId));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "No salary receipts available yet.");
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

  const periodLabel =
    receipt?.period?.year && receipt?.period?.month
      ? formatMonth(receipt.period.year, receipt.period.month)
      : "";
  const payPeriod = receipt?.period
    ? `${formatAttendanceDate(receipt.period.startDate)} – ${formatAttendanceDate(receipt.period.endDate)}`
    : "—";
  const paymentDate = receipt?.payment?.paymentDate ? shortDate(receipt.payment.paymentDate) : "—";
  const amount = receipt?.payment?.amount ?? receipt?.finalSalary ?? 0;

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
              Salary receipt
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {periodLabel || "Payment slip"}
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error && !receipt ? <ErrorView message={error} onRetry={load} /> : null}
        {loading && !receipt ? (
          <AppText variant="body" color={colors.textSecondary}>
            Loading receipt...
          </AppText>
        ) : null}

        {receipt ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.docIcon}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderCopy}>
                <AppText variant="label" style={styles.shopName} numberOfLines={1}>
                  {receipt.shop?.name || "Salary receipt"}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  SALARY RECEIPT
                </AppText>
              </View>
            </View>

            <ReceiptRow label="Employee" value={receipt.employee?.name || "—"} />
            <ReceiptRow label="Receipt number" value={receipt.receipt?.receiptNumber || "—"} />
            <ReceiptRow label="Pay period" value={payPeriod} />
            <ReceiptRow label="Payment date" value={paymentDate} last />

            <View style={styles.paidBox}>
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <AppText variant="caption" color={colors.success} style={styles.paidBadgeText}>
                  Paid
                </AppText>
              </View>
              <AppText variant="heading" style={styles.paidAmount}>
                {formatInr(amount)}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {receipt ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share receipt"
            accessibilityState={{ disabled: busy, busy }}
            disabled={busy}
            onPress={share}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !busy && styles.pressed,
              busy && styles.footerDisabled,
            ]}
          >
            <Ionicons name="share-outline" size={18} color={busy ? colors.disabledText : colors.textInverse} />
            <AppText variant="label" color={busy ? colors.disabledText : colors.textInverse}>
              {busy ? "Preparing..." : "Share receipt"}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ReceiptRow({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="label" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  shopName: {
    fontWeight: "700",
  },
  row: {
    gap: 4,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowValue: {
    fontWeight: "700",
  },
  paidBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.successBackground,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  paidBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paidBadgeText: {
    fontWeight: "700",
  },
  paidAmount: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerPrimary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.88,
  },
});
