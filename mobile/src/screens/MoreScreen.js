import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { useAuth } from "../context/AuthContext";
import { requestOwnerAccountDeletion } from "../services/accountService";
import { useShop } from "../context/ShopContext";
import { colors, spacing } from "../theme";

function MenuRow({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  onPress,
  danger = false,
  loading = false,
  disabled = false,
}) {
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
        <AppText variant="label" color={danger ? colors.error : colors.text} numberOfLines={1} style={styles.rowTitle}>
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
      ) : (
        <Ionicons name="chevron-forward" size={16} color={danger ? colors.error : colors.placeholder} />
      )}
    </Pressable>
  );
}

function MenuCard({ title, items }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
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
  const ownerName = String(user?.fullName || "").trim();
  const firstName = ownerName.split(/\s+/)[0] || "Owner";
  const initial = (firstName.charAt(0) || "H").toUpperCase();

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
      icon: "wallet-outline",
      iconColor: colors.success,
      iconBackground: colors.successBackground,
      onPress: () => navigation.navigate("Salary"),
    },
    {
      title: "Leave",
      subtitle: "Review staff leave",
      icon: "calendar-outline",
      iconColor: "#EA580C",
      iconBackground: "#FFF7ED",
      onPress: () => navigation.navigate("Leave"),
    },
    {
      title: "Advance / Khata",
      subtitle: "Track employee advances",
      icon: "book-outline",
      iconColor: colors.secondary,
      iconBackground: colors.secondaryLight,
      onPress: () => navigation.navigate("AdvanceOverview"),
    },
    {
      title: "Reports",
      subtitle: "Attendance, salary and more",
      icon: "bar-chart-outline",
      iconColor: "#DB2777",
      iconBackground: "#FCE7F3",
      onPress: () => navigation.navigate("Reports"),
    },
  ];

  const workplace = [
    {
      title: "Shop profile",
      subtitle: shop?.name || "View shop details",
      icon: "storefront-outline",
      iconColor: colors.info,
      iconBackground: colors.infoBackground,
      onPress: () => navigation.navigate("ShopProfile"),
    },
    {
      title: "Sick leave settings",
      subtitle: "Paid or unpaid in salary",
      icon: "medkit-outline",
      iconColor: colors.warning,
      iconBackground: colors.warningBackground,
      onPress: () => navigation.navigate("ShopSettings"),
    },
    {
      title: "Notifications",
      subtitle: "Recent alerts",
      icon: "notifications-outline",
      iconColor: colors.info,
      iconBackground: colors.infoBackground,
      onPress: () => navigation.navigate("Notifications"),
    },
  ];

  const account = [
    {
      title: "Subscription",
      subtitle: "Plan and billing",
      icon: "ribbon-outline",
      iconColor: colors.primary,
      iconBackground: colors.primaryLight,
      onPress: () => navigation.navigate("Subscription"),
    },
    {
      title: isLoggingOut ? "Logging out..." : "Log out",
      subtitle: "Sign out of this shop",
      icon: "log-out-outline",
      iconColor: colors.textSecondary,
      iconBackground: "#F1F5F9",
      onPress: logout,
      loading: isLoggingOut,
    },
    {
      title: "Delete account",
      subtitle: "Request account removal",
      icon: "trash-outline",
      iconColor: colors.error,
      iconBackground: colors.errorBackground,
      onPress: requestDeletion,
      danger: true,
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCopy}>
          <AppText variant="heading" accessibilityRole="header" style={styles.title}>
            More
          </AppText>
          <AppText variant="body" color={colors.textSecondary}>
            Manage your workplace and account
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${firstName}, ${shopName}`}
          onPress={() => navigation.navigate("ShopProfile")}
          style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
        >
          <View style={styles.avatar}>
            <AppText variant="label" color={colors.primary} style={styles.avatarText}>
              {initial}
            </AppText>
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="label" numberOfLines={1} style={styles.profileName}>
              {firstName}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {shopName}
            </AppText>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.placeholder} />
        </Pressable>

        <MenuCard title="Work" items={work} />
        <MenuCard title="Workplace" items={workplace} />
        <MenuCard title="Account" items={account} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    fontSize: 18,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    fontSize: 11,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
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
    opacity: 0.88,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
});
