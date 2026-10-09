import { StyleSheet, View } from "react-native";
import AppButton from "../AppButton";
import { spacing } from "../../theme";

export default function ReportExportActions({ onPdf, onExcel, exporting }) {
  return (
    <View style={styles.row}>
      <AppButton
        label={exporting === "pdf" ? "Generating PDF..." : "Export PDF"}
        onPress={onPdf}
        disabled={Boolean(exporting)}
      />
      <AppButton
        label={exporting === "excel" ? "Generating Excel..." : "Export Excel"}
        variant="secondary"
        onPress={onExcel}
        disabled={Boolean(exporting)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.md },
});
