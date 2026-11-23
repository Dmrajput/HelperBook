import { useCallback, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import ErrorView from "../../components/ErrorView";
import FieldError from "../../components/FieldError";
import SalaryReceiptPreview from "../../components/salary/SalaryReceiptPreview";
import { getSalaryReceipt, getSalaryReceiptPdf } from "../../services/salaryReceiptService";
import { colors, spacing } from "../../theme";
import {
  receiptShareMessage,
  saveReceiptFile,
  shareReceiptFile,
  WHATSAPP_UNAVAILABLE,
  whatsAppAvailable,
} from "../../utils/shareReceipt";

export default function SalaryReceiptScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
      setActionError(
        shareError.message || "Unable to share the receipt.\n\nThe PDF has been generated. You can try sharing again."
      );
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
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Header onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.loadingWrap}>
          <View style={styles.block} accessibilityLabel="Loading receipt" />
        </View>
      </View>
    );
  }

  if (!receipt) {
    const reversed = /reversed/i.test(error);
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Header onBack={() => navigation.goBack()} />
        </View>
        <View style={styles.loadingWrap}>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </View>
            <AppText variant="subtitle" align="center">
              Receipt unavailable
            </AppText>
          </View>
          <ErrorView
            message={
              error ||
              (reversed
                ? "The salary payment has been reversed."
                : "This salary does not have a valid payment yet.")
            }
            onRetry={load}
          />
        </View>
      </View>
    );
  }

  const hasPhone = Boolean(receipt.employee?.phone);
  const disabled = Boolean(busy);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Header onBack={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SalaryReceiptPreview receipt={receipt} />
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
            <AppText variant="label" style={styles.sectionTitle}>
              Share message
            </AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary}>
            {receiptShareMessage(receipt)}
          </AppText>
        </View>
        <FieldError message={actionError} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Generate PDF"
          accessibilityState={{ disabled, busy: busy === "pdf" }}
          disabled={disabled}
          onPress={generate}
          style={({ pressed }) => [
            styles.footerPrimary,
            pressed && !disabled && styles.pressed,
            disabled && styles.footerDisabled,
          ]}
        >
          <Ionicons name="download-outline" size={18} color={disabled ? colors.disabledText : colors.textInverse} />
          <AppText variant="label" color={disabled ? colors.disabledText : colors.textInverse}>
            {busy === "pdf" ? "Generating PDF..." : "Generate PDF"}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share PDF"
          disabled={disabled}
          onPress={() => shareExisting()}
          style={({ pressed }) => [styles.footerSecondary, pressed && !disabled && styles.pressed]}
        >
          <Ionicons name="share-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            {busy === "share" ? "Preparing receipt..." : "Share PDF"}
          </AppText>
        </Pressable>
        {hasPhone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share on WhatsApp"
            disabled={disabled}
            onPress={shareWhatsApp}
            style={({ pressed }) => [styles.footerSecondary, pressed && !disabled && styles.pressed]}
          >
            <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
            <AppText variant="label" color={colors.success}>
              Share on WhatsApp
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View salary"
          disabled={disabled}
          onPress={() => navigation.navigate("SalaryDetail", { salaryId })}
          style={({ pressed }) => [styles.footerSecondary, pressed && !disabled && styles.pressed]}
        >
          <Ionicons name="wallet-outline" size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            View salary
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function Header({ onBack }) {
  return (
    <View style={styles.headerRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.headerCopy}>
        <AppText variant="heading" accessibilityRole="header" style={styles.title}>
          Salary receipt
        </AppText>
        <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
          Share or download
        </AppText>
      </View>
      <View style={styles.headerAction}>
        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
      </View>
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
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  empty: {
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    gap: spacing.sm,
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
  footerSecondary: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  block: {
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
