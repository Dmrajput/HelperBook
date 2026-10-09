import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import AppScreen from "../../components/AppScreen";
import { useShop } from "../../context/ShopContext";
import { colors, spacing } from "../../theme";
import { pickShopLogo } from "../../utils/pickShopLogo";
import {
  businessLabel,
  formatAddress,
  formatIndianPhone,
  formatTime,
  formatWorkingDays,
} from "../../utils/shopFormat";
import { buildShopPayload, formFromShop, validateShopStep } from "../../utils/shopForm";
import BusinessTypeScreen from "./BusinessTypeScreen";
import WorkingScheduleScreen from "./WorkingScheduleScreen";

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

export default function ShopProfileScreen({ navigation, route }) {
  const { shop, updateShop, uploadLogo, removeLogo } = useShop();
  const openedForEdit = Boolean(route?.params?.edit);
  const [editing, setEditing] = useState(openedForEdit);
  const [form, setForm] = useState(() => formFromShop(shop));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoState, setLogoState] = useState("");

  useEffect(() => {
    if (!editing) {
      setForm(formFromShop(shop));
    }
  }, [editing, shop]);

  if (!shop) {
    return (
      <AppScreen title="Shop profile" subtitle="Set up your shop first" icon="storefront">
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="storefront-outline" size={28} color={colors.primary} />
          </View>
          <AppText variant="subtitle" align="center">No shop yet</AppText>
          <AppText variant="body" color={colors.textSecondary} align="center">
            Create your shop to see its profile.
          </AppText>
        </View>
      </AppScreen>
    );
  }

  function updateForm(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  async function saveShop() {
    if (saving) {
      return;
    }

    const nextErrors = [0, 1, 2, 3].reduce(
      (collected, step) => ({ ...collected, ...validateShopStep(step, form) }),
      {}
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please check your information.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await updateShop(buildShopPayload(form));
      setEditing(false);
    } catch (error) {
      setFormError(error?.message || "Please check your information.");
    } finally {
      setSaving(false);
    }
  }

  async function changeLogo(source) {
    if (logoState) {
      return;
    }

    setLogoState("uploading");
    setFormError("");
    try {
      const nextLogo = await pickShopLogo(source);
      if (nextLogo) {
        await uploadLogo(nextLogo);
      }
    } catch (error) {
      setFormError(error?.message || "Unable to upload logo. Please try again.");
    } finally {
      setLogoState("");
    }
  }

  function confirmRemoveLogo() {
    Alert.alert("Remove logo?", "Your shop logo will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setLogoState("removing");
          setFormError("");
          try {
            await removeLogo();
          } catch (error) {
            setFormError(error?.message || "Unable to upload logo. Please try again.");
          } finally {
            setLogoState("");
          }
        },
      },
    ]);
  }

  function cancelEdit() {
    setErrors({});
    setFormError("");
    setForm(formFromShop(shop));
    if (openedForEdit) {
      navigation.goBack();
      return;
    }
    setEditing(false);
  }

  const hours = `${formatTime(shop.workingSchedule.startTime)} – ${formatTime(shop.workingSchedule.endTime)}`;
  const initial = String(shop.name || "S").trim().charAt(0).toUpperCase() || "S";
  const shopPhone = shop.contact?.shopPhone ? formatIndianPhone(shop.contact.shopPhone) : "";

  return (
    <AppScreen title={editing ? "Edit shop" : "Shop profile"} subtitle={shop.name} icon="storefront">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {shop.logo?.url ? (
              <Image source={{ uri: shop.logo.url }} style={styles.logo} accessibilityLabel="Shop logo" />
            ) : (
              <View style={styles.placeholder} accessibilityLabel="Shop logo">
                <AppText variant="heading" color={colors.primary}>{initial}</AppText>
              </View>
            )}
            <AppText variant="subtitle" align="center">{shop.name}</AppText>
            <AppText variant="caption" color={colors.textSecondary} align="center">
              {businessLabel(shop)}
            </AppText>
            {editing ? (
              <View style={styles.logoActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Upload logo from gallery"
                  disabled={Boolean(logoState)}
                  onPress={() => changeLogo("gallery")}
                  style={styles.logoAction}
                >
                  <Ionicons name="image-outline" size={16} color={colors.primary} />
                  <AppText variant="caption" color={colors.primary}>Gallery</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Take shop photo"
                  disabled={Boolean(logoState)}
                  onPress={() => changeLogo("camera")}
                  style={styles.logoAction}
                >
                  <Ionicons name="camera-outline" size={16} color={colors.primary} />
                  <AppText variant="caption" color={colors.primary}>Camera</AppText>
                </Pressable>
                {shop.logo?.url ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove logo"
                    disabled={Boolean(logoState)}
                    onPress={confirmRemoveLogo}
                    style={styles.logoAction}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <AppText variant="caption" color={colors.error}>Remove</AppText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {logoState ? (
              <AppText variant="caption" color={colors.textSecondary}>
                {logoState === "removing" ? "Removing logo..." : "Uploading logo..."}
              </AppText>
            ) : null}
          </View>

          {editing ? (
            <>
              <Section title="Shop">
                <AppTextInput
                  label="Shop name"
                  value={form.name}
                  onChangeText={(name) => updateForm({ name })}
                  autoCapitalize="words"
                  maxLength={100}
                />
                <FieldError message={errors.name} />
                <AppText variant="label">Business type</AppText>
                <BusinessTypeScreen selected={form.businessType} onSelect={(businessType) => updateForm({ businessType })} />
                <FieldError message={errors.businessType} />
                {form.businessType === "Other" ? (
                  <>
                    <AppTextInput
                      label="Your business type"
                      value={form.customBusinessType}
                      onChangeText={(customBusinessType) => updateForm({ customBusinessType })}
                      autoCapitalize="words"
                      maxLength={80}
                    />
                    <FieldError message={errors.customBusinessType} />
                  </>
                ) : null}
              </Section>
              <Section title="Owner">
                <AppText variant="caption" color={colors.textSecondary}>
                  Login number {formatIndianPhone(shop.owner.phoneNumber)}
                </AppText>
                <AppTextInput
                  label="Your name"
                  value={form.ownerName}
                  onChangeText={(ownerName) => updateForm({ ownerName })}
                  autoCapitalize="words"
                  maxLength={100}
                />
                <FieldError message={errors.ownerName} />
                <AppTextInput
                  label="Email (optional)"
                  value={form.ownerEmail}
                  onChangeText={(ownerEmail) => updateForm({ ownerEmail })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FieldError message={errors.ownerEmail} />
              </Section>
              <Section title="Contact">
                <AppTextInput
                  label="Shop phone (optional)"
                  value={form.shopPhone}
                  onChangeText={(next) => updateForm({ shopPhone: next.replace(/\D/g, "").slice(0, 10) })}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <FieldError message={errors.shopPhone} />
                <AppTextInput
                  label="Shop email (optional)"
                  value={form.shopEmail}
                  onChangeText={(shopEmail) => updateForm({ shopEmail })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <FieldError message={errors.shopEmail} />
              </Section>
              <Section title="Address">
                <AppTextInput
                  label="Address line 1"
                  value={form.addressLine1}
                  onChangeText={(addressLine1) => updateForm({ addressLine1 })}
                  autoCapitalize="words"
                />
                <FieldError message={errors.addressLine1} />
                <AppTextInput
                  label="Address line 2"
                  value={form.addressLine2}
                  onChangeText={(addressLine2) => updateForm({ addressLine2 })}
                  placeholder="Optional"
                  autoCapitalize="words"
                />
                <AppTextInput label="City" value={form.city} onChangeText={(city) => updateForm({ city })} autoCapitalize="words" />
                <FieldError message={errors.city} />
                <AppTextInput label="State" value={form.state} onChangeText={(state) => updateForm({ state })} autoCapitalize="words" />
                <FieldError message={errors.state} />
                <AppTextInput
                  label="Pincode"
                  value={form.pincode}
                  onChangeText={(pincode) => updateForm({ pincode: pincode.replace(/\D/g, "").slice(0, 6) })}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <FieldError message={errors.pincode} />
              </Section>
              <Section title="Hours">
                <WorkingScheduleScreen form={form} onChange={updateForm} errors={errors} />
                <AppText variant="caption" color={colors.textSecondary}>Currency ₹ INR</AppText>
              </Section>
            </>
          ) : (
            <>
              <Section title="Shop">
                <InfoRow icon="storefront-outline" label="Business type" value={businessLabel(shop)} />
                <InfoRow icon="location-outline" label="Address" value={formatAddress(shop.address)} />
                <InfoRow icon="call-outline" label="Shop phone" value={shopPhone} />
                <InfoRow icon="mail-outline" label="Shop email" value={shop.contact?.email} />
              </Section>
              <Section title="Owner">
                <InfoRow icon="person-outline" label="Name" value={shop.owner.fullName} />
                <InfoRow icon="call-outline" label="Login number" value={formatIndianPhone(shop.owner.phoneNumber)} />
                <InfoRow icon="mail-outline" label="Email" value={shop.owner.email} />
              </Section>
              <Section title="Hours">
                <InfoRow icon="calendar-outline" label="Working days" value={formatWorkingDays(shop.workingSchedule.workingDays)} />
                <InfoRow icon="time-outline" label="Working hours" value={hours} />
                <InfoRow icon="cash-outline" label="Currency" value="₹ INR" />
              </Section>
            </>
          )}
          <FieldError message={formError} />
        </ScrollView>
        <View style={styles.footer}>
          {editing ? (
            <>
              <AppButton label={openedForEdit ? "Back" : "Cancel"} variant="secondary" onPress={cancelEdit} disabled={saving} />
              <AppButton label={saving ? "Saving..." : "Save"} onPress={saveShop} disabled={saving || Boolean(logoState)} />
            </>
          ) : (
            <AppButton label="Edit shop" onPress={() => setEditing(true)} />
          )}
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  hero: {
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: spacing.sm,
  },
  placeholder: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  logoActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  logoAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#F4F7F5",
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
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
