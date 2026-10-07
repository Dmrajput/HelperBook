import AppText from "./AppText";
import { colors } from "../theme";

export default function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <AppText variant="caption" color={colors.error} accessibilityRole="alert">
      {message}
    </AppText>
  );
}
