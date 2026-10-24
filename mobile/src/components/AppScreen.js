import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "./AppText";
import theme, { colors, spacing } from "../theme";

export default function AppScreen({ title, subtitle, icon, headerRight, onBack, showBack = true, children }) {
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
          ) : (
            <View style={styles.backSpacer} />
          )}
          <View style={styles.copy}>
            <AppText
              variant="heading"
              color={colors.textInverse}
              accessibilityRole="header"
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color={colors.primaryLight} numberOfLines={2}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {headerRight ? (
            headerRight
          ) : icon ? (
            <View style={styles.mark} accessibilityElementsHidden>
              <Ionicons name={icon} size={20} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: theme.screenPadding,
    paddingBottom: spacing.md,
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
    width: 40,
    height: 40,
    borderRadius: theme.radiusLg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.screenPadding,
    paddingTop: spacing.md,
  },
});
