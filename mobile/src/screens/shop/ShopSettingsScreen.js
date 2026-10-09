import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import { updateSickLeaveTreatment } from "../../services/leaveService";
import { getMyShop } from "../../services/shopService";
import { colors, spacing } from "../../theme";

export default function ShopSettingsScreen() {
  const [treatment, setTreatment] = useState("unpaid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getMyShop()
        .then((shop) => {
          if (active) setTreatment(shop?.settings?.leaveSettings?.sickLeaveTreatment || "unpaid");
        })
        .catch((loadError) => {
          if (active) setError(loadError.message);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  async function save() {
    setLoading(true);
    setError("");
    setSaved("");
    try {
      const shop = await updateSickLeaveTreatment(treatment);
      setTreatment(shop?.settings?.leaveSettings?.sickLeaveTreatment || treatment);
      setSaved("Sick leave setting saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save leave settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen title="Sick leave" subtitle="Paid or unpaid in salary" icon="medkit">
      <View style={styles.content}>
        <AppText variant="subtitle">Sick leave</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Choose how approved sick leave affects salary.
        </AppText>
        {["unpaid", "paid"].map((item) => {
          const selected = treatment === item;
          const label = item === "paid" ? "Paid sick leave" : "Unpaid sick leave";
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setTreatment(item)}
              style={[styles.choice, selected && styles.selected]}
            >
              <AppText color={selected ? colors.textInverse : colors.text}>{label}</AppText>
            </Pressable>
          );
        })}
        {saved ? <AppText variant="body">{saved}</AppText> : null}
        <FieldError message={error} />
      </View>
      <AppButton label="Save" onPress={save} loading={loading} disabled={loading} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  choice: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
