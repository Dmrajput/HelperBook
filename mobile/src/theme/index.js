import colors from "./colors";
import layout from "./layout";
import spacing from "./spacing";
import typography from "./typography";

const theme = {
  colors,
  spacing,
  typography,
  layout,
  controlHeight: layout.controlHeight,
  radius: layout.radius.md,
  radiusSm: layout.radius.sm,
  radiusLg: layout.radius.lg,
  radiusXl: layout.radius.xl,
  screenPadding: layout.screenPadding,
  sectionGap: layout.sectionGap,
  cardPadding: layout.cardPadding,
};

export { colors, spacing, typography, layout };
export default theme;
