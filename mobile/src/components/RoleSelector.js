import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import AppButton from "./AppButton";
import AppText from "./AppText";
import { EMPLOYEE_ROLES } from "../constants/employees";
import { colors, spacing } from "../theme";

export default function RoleSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = EMPLOYEE_ROLES.find((role) => role.value === value);

  return (
    <View style={styles.wrap}>
      <AppText variant="label">Role</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Role, ${selected?.label || "Select role"}`}
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <AppText>{selected?.label || "Select role"}</AppText>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.screen}>
          <AppText variant="heading" accessibilityRole="header">
            Select role
          </AppText>
          <ScrollView contentContainerStyle={styles.list}>
            {EMPLOYEE_ROLES.map((role) => {
              const isSelected = role.value === value;
              return (
                <Pressable
                  key={role.value}
                  accessibilityRole="radio"
                  accessibilityLabel={role.label}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(role.value);
                    setOpen(false);
                  }}
                  style={[styles.card, isSelected && styles.selected]}
                >
                  <AppText>{role.label}</AppText>
                  <AppText variant="caption" color={colors.primary}>
                    {isSelected ? "Selected" : "Select"}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <AppButton label="Close" variant="secondary" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: "#E7F3EF",
  },
});
