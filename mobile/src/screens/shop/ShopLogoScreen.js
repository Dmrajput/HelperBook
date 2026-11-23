import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { colors, spacing } from "../../theme";
import { pickShopLogo } from "../../utils/pickShopLogo";

export default function ShopLogoScreen({ logo, onChange, error, onError }) {
  const [busy, setBusy] = useState(false);

  async function choose(source) {
    if (busy) {
      return;
    }

    setBusy(true);
    onError("");
    try {
      const nextLogo = await pickShopLogo(source);
      if (nextLogo) {
        onChange(nextLogo);
      }
    } catch (pickError) {
      onError(pickError?.message || "Unable to upload logo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="body" color={colors.textSecondary}>
        A logo helps identify your business.
      </AppText>

      <View style={styles.previewCard}>
        <View style={styles.previewWrap}>
          {logo?.uri ? (
            <Image source={{ uri: logo.uri }} style={styles.preview} accessibilityLabel="Shop logo preview" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
            </View>
          )}
        </View>
        <AppText variant="label" style={styles.previewLabel} align="center">
          {logo?.uri ? "Logo selected" : "Upload your shop logo"}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} align="center">
          Square image works best
        </AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Upload from Gallery"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => choose("gallery")}
        style={({ pressed }) => [styles.action, pressed && !busy && styles.pressed, busy && styles.disabled]}
      >
        <View style={styles.actionIcon}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
        </View>
        <AppText variant="label" style={styles.actionLabel}>
          {busy ? "Preparing logo..." : "Upload from Gallery"}
        </AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Take Photo"
        accessibilityState={{ disabled: busy, busy }}
        disabled={busy}
        onPress={() => choose("camera")}
        style={({ pressed }) => [styles.action, pressed && !busy && styles.pressed, busy && styles.disabled]}
      >
        <View style={styles.actionIcon}>
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
        </View>
        <AppText variant="label" style={styles.actionLabel}>
          {busy ? "Preparing logo..." : "Take Photo"}
        </AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      {logo?.uri ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove logo"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => onChange(null)}
          style={({ pressed }) => [styles.remove, pressed && !busy && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <AppText variant="label" color={colors.error}>
            Remove logo
          </AppText>
        </Pressable>
      ) : null}

      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  previewWrap: {
    marginBottom: spacing.xs,
  },
  preview: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.background,
  },
  placeholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontWeight: "700",
  },
  action: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontWeight: "700",
  },
  remove: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
});
