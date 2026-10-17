import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { useAuth } from "../context/AuthContext";
import { requestOwnerAccountDeletion } from "../services/accountService";
import { useShop } from "../context/ShopContext";
import { colors, spacing } from "../theme";

const PAGE_BG = colors.background;
const HEADER = colors.primary;

function MenuRow({ icon, iconColor, iconBackground, title, subtitle, onPress, danger = false, loading = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label" color={danger ? colors.error : colors.text} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : danger ? null : (
        <Ionicons name="chevron-forward" size={16} color={colors.placeholder} />
      )}
    </Pressable>
  );
}

function MenuCard({ title, items }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.card}>
        {items.map((item, index) => (
          <View key={item.title}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <MenuRow {...item} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout, isLoggingOut, user } = useAuth();
  const { shop } = useShop();
  const shopName = shop?.name || "Your shop";
  const ownerName = user?.fullName || "";

  const requestDeletion = () => {
    Alert.alert(
      "Delete account",
      "This sends a deletion request for your shop owner account. Salary, advance, and payment records are kept until the retention review is finished. You can keep using the app until the request is completed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request deletion",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await requestOwnerAccountDeletion();
              Alert.alert(
                "Request received",
                result?.alreadyRequested
                  ? `Request ${result.ticketNumber} is already open.`
                  : `Request ${result.ticketNumber} was received.`
              );
            } catch (error) {
              Alert.alert("Delete account", error?.message || "Unable to send the deletion request.");
            }
          },
        },
      ]
    );
  };

  const work = [
    {
      title: "Salary",
      subtitle: "Calculate and pay staff",
      icon: "wallet",
      iconColor: colors.success,
      iconBackground: colors.successBackground,
      onPress: () => navigation.navigate("Salary"),
    },
    {
      title: "Leave",
      subtitle: "Review staff leave",
      icon: "calendar",
      iconColor: colors.warning,
      iconBackground: colors.warningBackground,
      onPress: () => navigation.navigate("Leave"),
    },
    {
      title: "Advance / Khata",
      subtitle: "Track employee advances",
      icon: "book",
      iconColor: colors.secondary,
      iconBackground: colors.secondaryLight,
      onPress: () => navigation.navigate("AdvanceOverview"),
    },
    {
      title: "Reports",
      subtitle: "Attendance, salary and more",
      icon: "bar-chart",
      iconColor: colors.error,
      iconBackground: colors.errorBackground,
      onPress: () => navigation.navigate("Reports"),
    },
    {
      title: "Sick leave",
      subtitle: "Paid or unpaid in salary",
      icon: "medkit",
      iconColor: colors.warning,
      iconBackground: colors.warningBackground,
      onPress: () => navigation.navigate("ShopSettings"),
    },
  ];

  const shopItems = [
    {
      title: "Shop profile",
      subtitle: shop?.name || "View shop details",
      icon: "storefront",
      iconColor: colors.info,
      iconBackground: colors.infoBackground,
      onPress: () => navigation.navigate("ShopProfile"),
    },
    {
      title: "Notifications",
      subtitle: "Recent alerts",
      icon: "notifications",
      iconColor: colors.accent,
      iconBackground: colors.accentLight,
      onPress: () => navigation.navigate("Notifications"),
    },
  ];

  const account = [
    {
      title: "Subscription",
      subtitle: "Plan and billing",
      icon: "ribbon",
      iconColor: colors.secondary,
      iconBackground: colors.secondaryLight,
      onPress: () => navigation.navigate("Subscription"),
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <AppText variant="heading" color={colors.textInverse} accessibilityRole="header" style={styles.title}>
              More
            </AppText>
            <AppText variant="caption" color={colors.primaryLight} numberOfLines={1}>
              {ownerName ? `${ownerName} · ${shopName}` : shopName}
            </AppText>
          </View>
          <View style={styles.mark} accessibilityElementsHidden>
            <Ionicons name="grid" size={24} color={colors.primary} />
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <MenuCard title="Work" items={work} />
          <MenuCard title="Shop" items={shopItems} />
          <MenuCard title="Account" items={account} />
          <View style={styles.card}>
            <MenuRow
              title="Delete account"
              subtitle="Request removal of this owner account"
              icon="trash-outline"
              iconColor={colors.error}
              iconBackground={colors.errorBackground}
              onPress={requestDeletion}
              danger
            />
            <View style={styles.divider} />
            <MenuRow
              title={isLoggingOut ? "Logging out..." : "Log out"}
              subtitle="Sign out of this shop"
              icon="log-out-outline"
              iconColor={colors.error}
              iconBackground={colors.errorBackground}
              onPress={logout}
              danger
              loading={isLoggingOut}
            />
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingBottom: spacing.xl,
  },
  body: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
});
