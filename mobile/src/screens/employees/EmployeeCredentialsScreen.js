import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";
import { formatPhone } from "../../utils/employeeFormat";

export default function EmployeeCredentialsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { employeeId, name, phone, temporaryPassword } = route.params || {};
  const [copied, setCopied] = useState(false);

  const mobileDisplay = phone ? formatPhone(phone) : "—";
  const credentialsText = [
    `Employee: ${name || ""}`,
    `Mobile: ${mobileDisplay}`,
    `Temporary password: ${temporaryPassword || ""}`,
  ].join("\n");

  async function copyCredentials() {
    try {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(credentialsText);
      setCopied(true);
      return;
    } catch {
      // Fall back to the system share sheet when clipboard is unavailable.
    }
    try {
      await Share.share({ message: credentialsText });
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function done() {
    if (employeeId) {
      navigation.replace("EmployeeProfile", { employeeId });
      return;
    }
    navigation.goBack();
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.backSpacer} />
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Login ready
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Share securely
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="key-outline" size={20} color={colors.success} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={colors.success} />
          </View>
          <AppText variant="subtitle" style={styles.cardTitle}>
            Employee account created
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            Share these login details securely with the employee. The temporary password is shown only once.
          </AppText>

          <View style={styles.row}>
            <AppText variant="caption" color={colors.textSecondary}>
              Employee name
            </AppText>
            <AppText variant="label" style={styles.rowValue}>
              {name || "—"}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="caption" color={colors.textSecondary}>
              Registered mobile
            </AppText>
            <AppText variant="label" style={styles.rowValue}>
              {mobileDisplay}
            </AppText>
          </View>
          <View style={styles.passwordBox}>
            <AppText variant="caption" color={colors.textSecondary}>
              Temporary password
            </AppText>
            <AppText variant="subtitle" style={styles.password} selectable>
              {temporaryPassword || "—"}
            </AppText>
          </View>

          <View style={styles.warning}>
            <Ionicons name="alert-circle-outline" size={16} color="#9A5B12" />
            <AppText variant="caption" color="#9A5B12" style={styles.warningText}>
              They must change this password on first login.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy credentials"
          onPress={copyCredentials}
          style={({ pressed }) => [styles.footerSecondary, pressed && styles.pressed]}
        >
          <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={18} color={colors.primary} />
          <AppText variant="label" color={colors.primary}>
            {copied ? "Copied" : "Copy credentials"}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={done}
          style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
        >
          <Ionicons name="checkmark" size={18} color={colors.textInverse} />
          <AppText variant="label" color={colors.textInverse}>
            Done
          </AppText>
        </Pressable>
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
  backSpacer: {
    width: 36,
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
    backgroundColor: colors.successBackground,
    alignItems: "center",
    justifyContent: "center",
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successBackground,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  cardTitle: {
    textAlign: "center",
    fontWeight: "700",
  },
  row: {
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowValue: {
    fontWeight: "700",
  },
  passwordBox: {
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: spacing.md,
  },
  password: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.warningBackground,
    borderRadius: 14,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
  footerPrimary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
  },
});
