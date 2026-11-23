import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import NotificationPreferences from "../../components/notifications/NotificationPreferences";
import { getNotificationPreferences, updateNotificationPreferences } from "../../services/notificationService";
import { devicePushPermission } from "../../services/pushNotificationService";
import { colors, spacing } from "../../theme";

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState(null);
  const [permission, setPermission] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getNotificationPreferences()
        .then((next) => {
          if (active) setValues(next);
        })
        .catch((loadError) => {
          if (active) setError(loadError.message || "Unable to update notification settings.");
        });
      devicePushPermission().then((status) => {
        if (active) setPermission(status);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  async function change(key, nextValue) {
    if (!values || saving) return;
    const previous = values;
    const next = { ...values, [key]: nextValue };
    setValues(next);
    setSaving(true);
    setError("");
    try {
      setValues(await updateNotificationPreferences(next));
    } catch (saveError) {
      setValues(previous);
      setError(saveError.message || "Unable to update notification settings.");
    } finally {
      setSaving(false);
    }
  }

  const permissionNote =
    permission === "denied"
      ? "Push notifications are disabled in your device settings. You can still view notifications in HelperBook."
      : permission === "expo-go"
        ? "Push notifications are not available in Expo Go on Android. You can still view notifications in HelperBook."
        : permission === "unavailable"
          ? "Push notifications are unavailable on this device. You can still view notifications in HelperBook."
          : "";

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
              Notification settings
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Choose which alerts to receive
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="options-outline" size={20} color={colors.info} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {permissionNote ? (
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.noteText}>
              {permissionNote}
            </AppText>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <AppText variant="label" style={styles.sectionTitle}>
            Preferences
          </AppText>
          {saving ? (
            <AppText variant="caption" color={colors.textSecondary}>
              Saving...
            </AppText>
          ) : null}
        </View>

        {!values ? <ActivityIndicator color={colors.primary} /> : null}
        {values ? <NotificationPreferences values={values} onChange={change} disabled={saving} /> : null}
        <FieldError message={error} />
      </ScrollView>
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
    backgroundColor: colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
});
