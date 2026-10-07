import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "../components/AppButton";
import AppText from "../components/AppText";
import AppTextInput from "../components/AppTextInput";
import ErrorView from "../components/ErrorView";
import ScreenContainer from "../components/ScreenContainer";
import {
  APP_NAME,
  LOGIN_HEADLINE,
  LOGIN_PHASE_MESSAGE,
  SERVER_CONNECTED_MESSAGE,
  SERVER_UNREACHABLE_BODY,
  SERVER_UNREACHABLE_TITLE,
} from "../constants/app";
import { useDevPreview } from "../context/devPreviewContext";
import { useServerConnection } from "../hooks/useServerConnection";
import { colors, spacing } from "../theme";

export default function LoginScreen() {
  const { openAppPreview } = useDevPreview();
  const { status, checkConnection } = useServerConnection();
  const [mobileNumber, setMobileNumber] = useState("");

  const onContinue = () => {
    Alert.alert(APP_NAME, LOGIN_PHASE_MESSAGE);
  };

  const onChangeMobileNumber = (value) => {
    setMobileNumber(value.replace(/\D/g, "").slice(0, 10));
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText variant="title" accessibilityRole="header">
            {APP_NAME}
          </AppText>
          <AppText variant="subtitle" color={colors.textSecondary}>
            {LOGIN_HEADLINE}
          </AppText>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={onChangeMobileNumber}
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            maxLength={10}
            onSubmitEditing={onContinue}
          />
          <AppButton label="Continue" onPress={onContinue} />
        </View>

        {__DEV__ ? (
          <View style={styles.devSection}>
            <AppText variant="caption" color={colors.textSecondary}>
              Development only
            </AppText>
            <AppButton
              label="Check Server Connection"
              variant="secondary"
              onPress={checkConnection}
              loading={status === "loading"}
            />
            {status === "success" ? (
              <View style={styles.successBox}>
                <AppText variant="body" color={colors.success}>
                  {SERVER_CONNECTED_MESSAGE}
                </AppText>
              </View>
            ) : null}
            {status === "error" ? (
              <ErrorView
                title={SERVER_UNREACHABLE_TITLE}
                message={SERVER_UNREACHABLE_BODY}
                onRetry={checkConnection}
              />
            ) : null}
            <AppButton
              label="Preview home screen"
              variant="secondary"
              onPress={openAppPreview}
            />
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingVertical: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.xxxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  devSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  successBox: {
    backgroundColor: colors.successBackground,
    borderRadius: 12,
    padding: spacing.lg,
  },
});
