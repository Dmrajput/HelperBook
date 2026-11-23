import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import { SETUP_STEPS } from "../../constants/shop";
import { useAuth } from "../../context/AuthContext";
import { useShop } from "../../context/ShopContext";
import { colors, spacing } from "../../theme";
import { businessLabel, formatAddress, formatIndianPhone, formatTime, formatWorkingDays } from "../../utils/shopFormat";
import { buildShopPayload, createEmptyShopForm, validateShopStep } from "../../utils/shopForm";
import BusinessTypeScreen from "./BusinessTypeScreen";
import ShopLogoScreen from "./ShopLogoScreen";
import WorkingScheduleScreen from "./WorkingScheduleScreen";

const TITLES = [
  "Create your shop",
  "About you",
  "Shop address",
  "Working schedule",
  "Shop logo",
  "Review your shop",
];

const SUBTITLES = [
  "Name and business type",
  "Owner and contact details",
  "Where your shop operates",
  "Days and opening hours",
  "Optional brand image",
  "Confirm before creating",
];

export default function ShopSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isLoggingOut } = useAuth();
  const { createShop, uploadLogo, adoptShop, fetchShop } = useShop();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(createEmptyShopForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pendingShop, setPendingShop] = useState(null);
  const initialForm = useRef(JSON.stringify(createEmptyShopForm()));
  const successTimer = useRef(null);
  const dirty = JSON.stringify(form) !== initialForm.current;

  useEffect(() => () => clearTimeout(successTimer.current), []);

  function updateForm(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function confirmLeave() {
    if (!dirty) {
      logout();
      return;
    }

    Alert.alert("Leave shop setup?", "Your details will not be saved.", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => logout() },
    ]);
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (submitting || success || pendingShop) {
        return true;
      }
      if (step > 0) {
        setStep((current) => current - 1);
        setFormError("");
        return true;
      }
      if (dirty) {
        confirmLeave();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [dirty, pendingShop, step, submitting, success]);

  function goBack() {
    if (step === 0) {
      confirmLeave();
      return;
    }
    setFormError("");
    setStep((current) => current - 1);
  }

  function continueStep() {
    const nextErrors = validateShopStep(step, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setFormError("");
    setStep((current) => Math.min(current + 1, SETUP_STEPS - 1));
  }

  async function submitShop() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      let shop = await createShop(buildShopPayload(form));
      if (form.logo?.uri && !form.logo.remote) {
        try {
          shop = await uploadLogo(form.logo, { adopt: false });
        } catch (error) {
          setPendingShop(shop);
          setFormError(error?.message || "Unable to upload logo. Please try again.");
          return;
        }
      }

      setSuccess(true);
      successTimer.current = setTimeout(() => adoptShop(shop), 800);
    } catch (error) {
      if (error?.status === 409) {
        try {
          const existing = await fetchShop();
          if (existing) {
            return;
          }
        } catch {
          // Existing shop cannot be loaded; form error is shown below.
        }
      }
      setFormError(error?.message || "Please check your information.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.screen, styles.successScreen, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
        </View>
        <AppText variant="heading" align="center" accessibilityRole="header" style={styles.successTitle}>
          Shop created successfully!
        </AppText>
        <AppText variant="body" color={colors.textSecondary} align="center">
          Opening your dashboard...
        </AppText>
      </View>
    );
  }

  const loginNumber = formatIndianPhone(user?.phoneNumber);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? "Logout" : "Back"}
            onPress={goBack}
            style={styles.back}
          >
            <Ionicons name={step === 0 ? "log-out-outline" : "chevron-back"} size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title} numberOfLines={1}>
              {TITLES[step]}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} numberOfLines={1}>
              {SUBTITLES[step]}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Logout"
            onPress={confirmLeave}
            disabled={isLoggingOut}
            style={styles.headerAction}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            Step {step + 1} of {SETUP_STEPS}
          </AppText>
          <AppText variant="caption" color={colors.primary} style={styles.progressPct}>
            {Math.round(((step + 1) / SETUP_STEPS) * 100)}%
          </AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / SETUP_STEPS) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 ? (
            <View style={styles.section}>
              <AppText variant="body" color={colors.textSecondary}>
                Let's start with your business name.
              </AppText>
              <AppTextInput
                label="Shop name"
                value={form.name}
                onChangeText={(name) => updateForm({ name })}
                placeholder="Shree Krishna General Store"
                autoCapitalize="words"
                maxLength={100}
              />
              <FieldError message={errors.name} />
              <AppText variant="label" style={styles.fieldLabel}>
                Business type
              </AppText>
              <BusinessTypeScreen
                selected={form.businessType}
                onSelect={(businessType) => updateForm({ businessType })}
              />
              <FieldError message={errors.businessType} />
              {form.businessType === "Other" ? (
                <>
                  <AppTextInput
                    label="Your business type"
                    value={form.customBusinessType}
                    onChangeText={(customBusinessType) => updateForm({ customBusinessType })}
                    placeholder="Enter your business type"
                    autoCapitalize="words"
                    maxLength={80}
                  />
                  <FieldError message={errors.customBusinessType} />
                </>
              ) : null}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.section}>
              <View style={styles.infoCard}>
                <Ionicons name="call-outline" size={16} color={colors.info} />
                <View style={styles.infoCopy}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Login number
                  </AppText>
                  <AppText variant="body">{loginNumber}</AppText>
                </View>
              </View>
              <AppTextInput
                label="Your name"
                value={form.ownerName}
                onChangeText={(ownerName) => updateForm({ ownerName })}
                placeholder="Raj Patel"
                autoCapitalize="words"
                maxLength={100}
              />
              <FieldError message={errors.ownerName} />
              <AppTextInput
                label="Email (optional)"
                value={form.ownerEmail}
                onChangeText={(ownerEmail) => updateForm({ ownerEmail })}
                placeholder="raj@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FieldError message={errors.ownerEmail} />
              <AppTextInput
                label="Shop phone (optional)"
                value={form.shopPhone}
                onChangeText={(shopPhone) => updateForm({ shopPhone: shopPhone.replace(/\D/g, "").slice(0, 10) })}
                placeholder="9876543210"
                keyboardType="number-pad"
                maxLength={10}
              />
              <FieldError message={errors.shopPhone} />
              <AppTextInput
                label="Shop email (optional)"
                value={form.shopEmail}
                onChangeText={(shopEmail) => updateForm({ shopEmail })}
                placeholder="shop@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FieldError message={errors.shopEmail} />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.section}>
              <AppTextInput
                label="Address line 1"
                value={form.addressLine1}
                onChangeText={(addressLine1) => updateForm({ addressLine1 })}
                placeholder="12 Market Road"
                autoCapitalize="words"
                maxLength={200}
              />
              <FieldError message={errors.addressLine1} />
              <AppTextInput
                label="Address line 2"
                value={form.addressLine2}
                onChangeText={(addressLine2) => updateForm({ addressLine2 })}
                placeholder="Optional"
                autoCapitalize="words"
                maxLength={200}
              />
              <AppTextInput
                label="City"
                value={form.city}
                onChangeText={(city) => updateForm({ city })}
                placeholder="Ahmedabad"
                autoCapitalize="words"
                maxLength={80}
              />
              <FieldError message={errors.city} />
              <AppTextInput
                label="State"
                value={form.state}
                onChangeText={(state) => updateForm({ state })}
                placeholder="Gujarat"
                autoCapitalize="words"
                maxLength={80}
              />
              <FieldError message={errors.state} />
              <AppTextInput
                label="Pincode"
                value={form.pincode}
                onChangeText={(pincode) => updateForm({ pincode: pincode.replace(/\D/g, "").slice(0, 6) })}
                placeholder="380001"
                keyboardType="number-pad"
                maxLength={6}
              />
              <FieldError message={errors.pincode} />
            </View>
          ) : null}

          {step === 3 ? <WorkingScheduleScreen form={form} onChange={updateForm} errors={errors} /> : null}

          {step === 4 ? (
            <ShopLogoScreen
              logo={form.logo}
              onChange={(logo) => updateForm({ logo })}
              error={formError}
              onError={setFormError}
            />
          ) : null}

          {step === 5 ? (
            <View style={styles.reviewCard}>
              <ReviewRow icon="storefront-outline" label="Shop" value={form.name.trim()} />
              <ReviewRow icon="briefcase-outline" label="Business" value={businessLabel(form)} />
              <ReviewRow icon="person-outline" label="Owner" value={form.ownerName.trim()} />
              <ReviewRow icon="call-outline" label="Phone" value={loginNumber} />
              {form.shopPhone ? (
                <ReviewRow icon="call-outline" label="Shop phone" value={formatIndianPhone(form.shopPhone)} />
              ) : null}
              <ReviewRow
                icon="location-outline"
                label="Address"
                value={formatAddress({
                  addressLine1: form.addressLine1.trim(),
                  addressLine2: form.addressLine2.trim(),
                  city: form.city.trim(),
                  state: form.state.trim(),
                  pincode: form.pincode.trim(),
                })}
              />
              <ReviewRow icon="calendar-outline" label="Working days" value={formatWorkingDays(form.workingDays)} />
              <ReviewRow
                icon="time-outline"
                label="Working hours"
                value={`${formatTime(form.startTime)} – ${formatTime(form.endTime)}`}
              />
              <ReviewRow icon="image-outline" label="Logo" value={form.logo?.uri ? "Added" : "Not added"} last />
            </View>
          ) : null}
        </ScrollView>

        {step === 5 && formError ? (
          <View style={styles.footerError}>
            <FieldError message={formError} />
          </View>
        ) : null}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              disabled={submitting}
              onPress={goBack}
              style={({ pressed }) => [styles.footerSecondary, pressed && !submitting && styles.pressed]}
            >
              <AppText variant="label" color={colors.primary}>
                Back
              </AppText>
            </Pressable>
          ) : null}

          {step < 4 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              onPress={continueStep}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <AppText variant="label" color={colors.textInverse}>
                Continue
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            </Pressable>
          ) : null}

          {step === 4 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={form.logo?.uri ? "Continue" : "Skip for now"}
              onPress={continueStep}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <AppText variant="label" color={colors.textInverse}>
                {form.logo?.uri ? "Continue" : "Skip for now"}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            </Pressable>
          ) : null}

          {step === 5 && pendingShop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              onPress={() => adoptShop(pendingShop)}
              style={({ pressed }) => [styles.footerPrimary, pressed && styles.pressed]}
            >
              <AppText variant="label" color={colors.textInverse}>
                Continue
              </AppText>
            </Pressable>
          ) : null}

          {step === 5 && !pendingShop ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit"
                disabled={submitting}
                onPress={() => setStep(0)}
                style={({ pressed }) => [styles.footerSecondary, pressed && !submitting && styles.pressed]}
              >
                <AppText variant="label" color={colors.primary}>
                  Edit
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create Shop"
                accessibilityState={{ disabled: submitting, busy: submitting }}
                disabled={submitting}
                onPress={submitShop}
                style={({ pressed }) => [
                  styles.footerPrimary,
                  pressed && !submitting && styles.pressed,
                  submitting && styles.footerDisabled,
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={submitting ? colors.disabledText : colors.textInverse}
                />
                <AppText variant="label" color={submitting ? colors.disabledText : colors.textInverse}>
                  {submitting ? "Creating..." : "Create Shop"}
                </AppText>
              </Pressable>
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ReviewRow({ icon, label, value, last }) {
  return (
    <View style={[styles.reviewRow, !last && styles.reviewBorder]}>
      <View style={styles.reviewIcon}>
        <Ionicons name={icon} size={16} color={colors.info} />
      </View>
      <View style={styles.reviewCopy}>
        <AppText variant="caption" color={colors.textSecondary}>
          {label}
        </AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  successScreen: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.successBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontWeight: "800",
  },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  progressPct: {
    fontWeight: "700",
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.disabled,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  scroll: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontWeight: "700",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  reviewBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reviewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.infoBackground,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  reviewCopy: {
    flex: 1,
    gap: 2,
  },
  footerError: {
    paddingHorizontal: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerSecondary: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footerPrimary: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  footerDisabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    opacity: 0.88,
  },
});
