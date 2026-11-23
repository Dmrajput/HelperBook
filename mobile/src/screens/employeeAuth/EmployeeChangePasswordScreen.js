import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { useAuth } from "../../context/AuthContext";
import { changeEmployeePassword } from "../../services/employeeAuthService";
import theme, { colors, spacing } from "../../theme";

function validateNewPassword(value) {
  if (!value || value.length < 8 || value.length > 64 || !/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use 8 to 64 characters with at least one letter and one number.";
  }
  return "";
}

function PasswordField({ label, value, onChangeText, show, onToggle, editable }) {
  return (
    <View style={styles.field}>
      <AppText variant="label" style={styles.fieldLabel}>
        {label}
      </AppText>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="••••••••"
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          style={styles.input}
          accessibilityLabel={label}
        />
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
          style={styles.showButton}
        >
          <AppText variant="caption" color={colors.primary}>
            {show ? "Hide" : "Show"}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export default function EmployeeChangePasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const forced = Boolean(route?.params?.forced);
  const { logout, patchUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    const policyError = validateNewPassword(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a new password that is different from your current password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await changeEmployeePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      patchUser?.({ mustChangePassword: false });
      Alert.alert("Password updated", "Sign in again with your new password.", [
        {
          text: "OK",
          onPress: async () => {
            await logout();
          },
        },
      ]);
    } catch (requestError) {
      setError(requestError?.message || "Unable to change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          {!forced ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.back} />
          )}
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              Change password
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {forced ? "Required before continuing" : "Update your login"}
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {forced ? (
            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={18} color={colors.info} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.noteText}>
                For security, change the temporary password before using HelperBook.
              </AppText>
            </View>
          ) : null}

          <View style={styles.card}>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent((value) => !value)}
              editable={!loading}
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((value) => !value)}
              editable={!loading}
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((value) => !value)}
              editable={!loading}
            />
          </View>

          <FieldError message={error} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change password"
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={submit}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !loading && styles.pressed,
              loading && styles.footerDisabled,
            ]}
          >
            <AppText variant="label" color={loading ? colors.disabledText : colors.textInverse}>
              {loading ? "Saving..." : "Change password"}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={forced ? "Logout" : "Cancel"}
            disabled={loading}
            onPress={forced ? logout : () => navigation.goBack()}
            style={({ pressed }) => [styles.footerSecondary, pressed && !loading && styles.pressed]}
          >
            <AppText variant="label" color={colors.primary}>
              {forced ? "Logout" : "Cancel"}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.infoBackground,
    borderRadius: 16,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: theme.controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 17,
    backgroundColor: colors.background,
  },
  showButton: {
    minHeight: theme.controlHeight,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  footer: {
    gap: spacing.sm,
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
    alignItems: "center",
    justifyContent: "center",
  },
  footerSecondary: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.88,
  },
});
