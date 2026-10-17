import { useState } from "react";
import { ScrollView, Share, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppScreen from "../../components/AppScreen";
import { colors, spacing } from "../../theme";
import { formatPhone } from "../../utils/employeeFormat";

export default function EmployeeCredentialsScreen({ navigation, route }) {
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
    <AppScreen title="Login ready" subtitle="Share securely" icon="key-outline" showBack={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={colors.success} />
          </View>
          <AppText variant="subtitle" style={styles.title}>
            Employee account created
          </AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            Share these login details securely with the employee. The temporary password is shown only once.
          </AppText>

          <View style={styles.row}>
            <AppText variant="caption" color={colors.textSecondary}>
              Employee Name
            </AppText>
            <AppText variant="label">{name || "—"}</AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="caption" color={colors.textSecondary}>
              Registered Mobile
            </AppText>
            <AppText variant="label">{mobileDisplay}</AppText>
          </View>
          <View style={styles.passwordBox}>
            <AppText variant="caption" color={colors.textSecondary}>
              Temporary Password
            </AppText>
            <AppText variant="subtitle" style={styles.password} selectable>
              {temporaryPassword || "—"}
            </AppText>
          </View>

          <AppText variant="caption" color={colors.warning} align="center">
            They must change this password on first login.
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label={copied ? "Copied" : "Copy Credentials"}
          variant="secondary"
          onPress={copyCredentials}
        />
        <AppButton label="Done" onPress={done} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
  title: {
    textAlign: "center",
    fontWeight: "700",
  },
  row: {
    gap: 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  passwordBox: {
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
  },
  password: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
