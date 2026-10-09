import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
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
      <ScreenContainer>
        <AppText variant="heading">Shop profile</AppText>
        <AppText variant="body">Create your shop to see its profile.</AppText>
      </ScreenContainer>
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

  const hours = `${formatTime(shop.workingSchedule.startTime)} – ${formatTime(shop.workingSchedule.endTime)}`;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AppText variant="heading" accessibilityRole="header">
            {editing ? "Edit shop" : "Shop profile"}
          </AppText>
          <View style={styles.logoWrap}>
            {shop.logo?.url ? (
              <Image source={{ uri: shop.logo.url }} style={styles.logo} accessibilityLabel="Shop logo" />
            ) : (
              <View style={styles.placeholder}>
                <AppText variant="heading" color={colors.primary}>
                  +
                </AppText>
              </View>
            )}
          </View>
          {editing ? (
            <View style={styles.section}>
              <AppButton
                label={logoState === "uploading" ? "Uploading logo..." : "Upload from Gallery"}
                onPress={() => changeLogo("gallery")}
                disabled={Boolean(logoState)}
              />
              <AppButton
                label={logoState === "uploading" ? "Uploading logo..." : "Take Photo"}
                variant="secondary"
                onPress={() => changeLogo("camera")}
                disabled={Boolean(logoState)}
              />
              {shop.logo?.url ? (
                <AppButton
                  label={logoState === "removing" ? "Removing logo..." : "Remove logo"}
                  variant="secondary"
                  onPress={confirmRemoveLogo}
                  disabled={Boolean(logoState)}
                />
              ) : null}
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
              <AppText variant="body">Login number</AppText>
              <AppText color={colors.textSecondary}>{formatIndianPhone(shop.owner.phoneNumber)}</AppText>
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
              <AppTextInput
                label="Shop phone (optional)"
                value={form.shopPhone}
                onChangeText={(shopPhone) => updateForm({ shopPhone: shopPhone.replace(/\D/g, "").slice(0, 10) })}
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
              <WorkingScheduleScreen form={form} onChange={updateForm} errors={errors} />
              <AppText variant="body">Currency ₹</AppText>
            </View>
          ) : (
            <View style={styles.section}>
              <ProfileRow label="Shop name" value={shop.name} />
              <ProfileRow label="Business type" value={businessLabel(shop)} />
              <ProfileRow label="Owner" value={shop.owner.fullName} />
              <ProfileRow label="Phone" value={formatIndianPhone(shop.owner.phoneNumber)} />
              <ProfileRow label="Address" value={formatAddress(shop.address)} />
              <ProfileRow label="Working days" value={formatWorkingDays(shop.workingSchedule.workingDays)} />
              <ProfileRow label="Working hours" value={hours} />
              <ProfileRow label="Currency" value="₹ INR" />
            </View>
          )}
          <FieldError message={formError} />
        </ScrollView>
        <View style={styles.footer}>
          {editing ? (
            <>
              <AppButton
                label={openedForEdit ? "Back" : "Cancel"}
                variant="secondary"
                onPress={() => {
                  setErrors({});
                  setFormError("");
                  setForm(formFromShop(shop));
                  if (openedForEdit) {
                    navigation.goBack();
                    return;
                  }
                  setEditing(false);
                }}
                disabled={saving}
              />
              <AppButton label={saving ? "Saving..." : "Save"} onPress={saveShop} disabled={saving || Boolean(logoState)} />
            </>
          ) : (
            <>
              <AppButton label="Edit shop" onPress={() => setEditing(true)} />
              <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ProfileRow({ label, value }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="body">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  logoWrap: {
    alignItems: "center",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    gap: spacing.xs,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
});
