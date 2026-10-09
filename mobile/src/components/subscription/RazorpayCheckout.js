import { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function checkoutHtml(checkout) {
  const description = `${checkout.planName} ${checkout.billingInterval}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var options = {
    key: "${escapeHtml(checkout.keyId)}",
    amount: ${Number(checkout.amount) || 0},
    currency: "INR",
    name: "HelperBook",
    description: "${escapeHtml(description)}",
    order_id: "${escapeHtml(checkout.orderId)}",
    handler: function (response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        status: "success",
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      }));
    },
    modal: {
      ondismiss: function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: "dismissed" }));
      }
    },
    theme: { color: "#146C54" }
  };
  var checkout = new Razorpay(options);
  checkout.on("payment.failed", function (response) {
    var description = response && response.error ? response.error.description : "";
    window.ReactNativeWebView.postMessage(JSON.stringify({ status: "failed", description: description || "" }));
  });
  checkout.open();
</script>
</body>
</html>`;
}

export default function RazorpayCheckout({ checkout, onResult, onClose }) {
  const [failed, setFailed] = useState("");
  const html = useMemo(() => (checkout ? checkoutHtml(checkout) : ""), [checkout]);
  if (!checkout) return null;

  function handleMessage(event) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.status === "success") {
        onResult(payload);
        return;
      }
      if (payload.status === "failed") {
        setFailed(payload.description || "Payment failed");
        return;
      }
      onClose();
    } catch {
      setFailed("Payment failed");
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <AppText variant="heading">Payment</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {failed ? "Payment failed. Your subscription was not changed." : "Opening Razorpay. HelperBook will confirm the payment before changing your plan."}
        </AppText>
        {failed ? <AppText variant="body">{failed}</AppText> : null}
        {failed ? <AppButton label="Close" onPress={onClose} /> : (
          <WebView
            originWhitelist={["*"]}
            source={{ html }}
            onMessage={handleMessage}
            style={styles.web}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1, gap: spacing.md, padding: spacing.lg },
  web: { flex: 1 },
});
