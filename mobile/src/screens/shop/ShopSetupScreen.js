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
import AppButton from "../../components/AppButton";
import AppText from "../../components/AppText";
import AppTextInput from "../../components/AppTextInput";
import FieldError from "../../components/FieldError";
import ScreenContainer from "../../components/ScreenContainer";
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
  "Add your shop logo",
  "Review your shop",
];

export default function ShopSetupScreen() {
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
          // The message below is shown when the existing shop cannot be loaded.
        }
      }
      setFormError(error?.message || "Please check your information.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <ScreenContainer centered>
        <AppText variant="heading" align="center" accessibilityRole="header">
          Shop created successfully!
        </AppText>
      </ScreenContainer>
    );
  }

  const loginNumber = formatIndianPhone(user?.phoneNumber);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.progressRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            {step + 1} of {SETUP_STEPS}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Logout" onPress={confirmLeave} disabled={isLoggingOut}>
            <AppText variant="caption" color={colors.primary}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / SETUP_STEPS) * 100}%` }]} />
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <AppText variant="heading" accessibilityRole="header">
            {TITLES[step]}
          </AppText>
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
              <AppText variant="label">Business type</AppText>
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
              <AppText variant="body">Login number</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {loginNumber}
              </AppText>
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
          {step === 3 ? (
            <WorkingScheduleScreen form={form} onChange={updateForm} errors={errors} />
          ) : null}
          {step === 4 ? (
            <ShopLogoScreen
              logo={form.logo}
              onChange={(logo) => updateForm({ logo })}
              error={formError}
              onError={setFormError}
            />
          ) : null}
          {step === 5 ? (
            <View style={styles.section}>
              <ReviewRow label="Shop" value={form.name.trim()} />
              <ReviewRow label="Business" value={businessLabel(form)} />
              <ReviewRow label="Owner" value={form.ownerName.trim()} />
              <ReviewRow label="Phone" value={loginNumber} />
              {form.shopPhone ? <ReviewRow label="Shop phone" value={formatIndianPhone(form.shopPhone)} /> : null}
              <ReviewRow label="Address" value={formatAddress({
                addressLine1: form.addressLine1.trim(),
                addressLine2: form.addressLine2.trim(),
                city: form.city.trim(),
                state: form.state.trim(),
                pincode: form.pincode.trim(),
              })} />
              <ReviewRow label="Working days" value={formatWorkingDays(form.workingDays)} />
              <ReviewRow label="Working hours" value={`${formatTime(form.startTime)} – ${formatTime(form.endTime)}`} />
              <ReviewRow label="Logo" value={form.logo?.uri ? "Added" : "Not added"} />
              <ReviewRow label="Currency" value="₹ INR" />
            </View>
          ) : null}
        </ScrollView>
        {step === 5 && formError ? <FieldError message={formError} /> : null}
        <View style={styles.footer}>
          {step > 0 ? <AppButton label="Back" variant="secondary" onPress={goBack} disabled={submitting} /> : null}
          {step < 4 ? <AppButton label="Continue" onPress={continueStep} /> : null}
          {step === 4 ? (
            <AppButton
              label={form.logo?.uri ? "Continue" : "Skip for now"}
              onPress={continueStep}
            />
          ) : null}
          {step === 5 && pendingShop ? (
            <AppButton label="Continue" onPress={() => adoptShop(pendingShop)} />
          ) : null}
          {step === 5 && !pendingShop ? (
            <>
              <AppButton label="Edit" variant="secondary" onPress={() => setStep(0)} disabled={submitting} />
              <AppButton
                label={submitting ? "Creating your shop..." : "Create Shop"}
                onPress={submitShop}
                disabled={submitting}
              />
            </>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ReviewRow({ label, value }) {
  return (
    <View style={styles.reviewRow}>
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
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.disabled,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    backgroundColor: colors.primary,
  },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  reviewRow: {
    gap: spacing.xs,
  },
});
