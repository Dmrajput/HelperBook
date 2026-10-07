import { StyleSheet, Text } from "react-native";
import { colors, typography } from "../theme";

const variants = {
  title: typography.title,
  heading: typography.heading,
  subtitle: typography.subtitle,
  body: typography.body,
  label: typography.label,
  button: typography.button,
  caption: typography.caption,
};

export default function AppText({
  children,
  variant = "body",
  color,
  align = "left",
  style,
  ...rest
}) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        variants[variant] || variants.body,
        { color: color || colors.text, textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
});
