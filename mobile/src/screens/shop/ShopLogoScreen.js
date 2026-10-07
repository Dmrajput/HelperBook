import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import AppButton from "../../components/AppButton";
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
      <View style={styles.previewWrap}>
        {logo?.uri ? (
          <Image source={{ uri: logo.uri }} style={styles.preview} accessibilityLabel="Shop logo preview" />
        ) : (
          <View style={styles.placeholder}>
            <AppText variant="heading" color={colors.primary}>
              +
            </AppText>
          </View>
        )}
      </View>
      <AppText variant="caption" align="center" color={colors.textSecondary}>
        {logo?.uri ? "Logo selected" : "Upload your shop logo"}
      </AppText>
      <AppButton
        label={busy ? "Preparing logo..." : "Upload from Gallery"}
        onPress={() => choose("gallery")}
        disabled={busy}
      />
      <AppButton
        label={busy ? "Preparing logo..." : "Take Photo"}
        variant="secondary"
        onPress={() => choose("camera")}
        disabled={busy}
      />
      {logo?.uri ? (
        <AppButton label="Remove logo" variant="secondary" onPress={() => onChange(null)} disabled={busy} />
      ) : null}
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  previewWrap: {
    alignItems: "center",
    marginVertical: spacing.md,
  },
  preview: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.surface,
  },
  placeholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
