import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import FieldError from "../../components/FieldError";
import { updateSickLeaveTreatment } from "../../services/leaveService";
import { getMyShop } from "../../services/shopService";
import { colors, spacing } from "../../theme";

const OPTIONS = [
  {
    id: "unpaid",
    title: "Unpaid sick leave",
    description: "Approved sick leave reduces payable salary days.",
    icon: "remove-circle-outline",
  },
  {
    id: "paid",
    title: "Paid sick leave",
    description: "Approved sick leave counts as paid work for salary.",
    icon: "checkmark-circle-outline",
  },
];

export default function ShopSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
              Sick leave
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              Paid or unpaid in salary
            </AppText>
          </View>
          <View style={styles.headerAction}>
            <Ionicons name="medkit-outline" size={20} color={colors.warning} />
          </View>
        </View>
      </View>

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <AppText variant="label" style={styles.infoTitle}>
              How sick leave affects pay
            </AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Choose how approved sick leave is treated when salary is calculated.
            </AppText>
          </View>

          {OPTIONS.map((item) => {
            const selected = treatment === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setTreatment(item.id);
                  setSaved("");
                }}
                style={({ pressed }) => [
                  styles.choice,
                  selected && styles.choiceSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={selected ? colors.warning : colors.textSecondary}
                  />
                </View>
                <View style={styles.choiceCopy}>
                  <AppText variant="label" style={styles.choiceTitle} numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {item.description}
                  </AppText>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText variant="caption" color={colors.success}>
                {saved}
              </AppText>
            </View>
          ) : null}
          <FieldError message={error} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save sick leave setting"
            accessibilityState={{ disabled: loading, busy: loading }}
            disabled={loading}
            onPress={save}
            style={({ pressed }) => [
              styles.footerPrimary,
              pressed && !loading && styles.pressed,
              loading && styles.footerDisabled,
            ]}
          >
            <Ionicons name="save-outline" size={18} color={loading ? colors.disabledText : colors.textInverse} />
            <AppText variant="label" color={loading ? colors.disabledText : colors.textInverse}>
              {loading ? "Saving..." : "Save setting"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
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
    backgroundColor: colors.warningBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
  },
  infoTitle: {
    fontWeight: "700",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  choiceSelected: {
    borderColor: colors.warning,
    backgroundColor: "#FFFBEB",
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIconSelected: {
    backgroundColor: colors.warningBackground,
  },
  choiceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  choiceTitle: {
    fontWeight: "700",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.warning,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footer: {
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
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.9,
  },
});
