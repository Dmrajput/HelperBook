import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

const PAGE_BG = "#F4F7F5";
const HEADER = "#0F6B4F";

export default function AppScreen({ title, subtitle, icon, onBack, showBack = true, children }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const canBack = showBack && (typeof onBack === "function" || navigation.canGoBack());

  function goBack() {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.row}>
          {canBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={goBack} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.textInverse} />
            </Pressable>
          ) : <View style={styles.backSpacer} />}
          <View style={styles.copy}>
            <AppText variant="heading" color={colors.textInverse} accessibilityRole="header" numberOfLines={1} style={styles.title}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color="#E7F6EF" numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {icon ? (
            <View style={styles.mark} accessibilityElementsHidden>
              <Ionicons name={icon} size={22} color={colors.primary} />
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    backgroundColor: HEADER,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
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
  backSpacer: {
    width: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F7F3EA",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
