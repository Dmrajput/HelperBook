import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";
import AppButton from "../AppButton";
import AppText from "../AppText";
import { colors, spacing } from "../../theme";

const RAZORPAY_THEME = "#6366F1";

function escapeJs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function buildCheckoutHtml(checkout) {
  const description = `${checkout.planName || "HelperBook"} ${checkout.billingInterval || ""}`.trim();
  const keyId = escapeJs(checkout.keyId);
  const orderId = escapeJs(checkout.orderId);
  const amount = Number(checkout.amount) || 0;
  const currency = escapeJs(checkout.currency || "INR");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: #F5F7FB; font-family: sans-serif; color: #0F172A; }
    .wrap { padding: 28px 16px; text-align: center; }
    .muted { color: #64748B; font-size: 14px; margin-top: 8px; }
    .error { color: #EF4444; margin-top: 16px; font-size: 14px; }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="wrap" id="status">
    <div>Loading Razorpay…</div>
    <div class="muted">Please wait while checkout opens.</div>
  </div>
  <script>
    function post(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function showError(message) {
      var root = document.getElementById("status");
      if (root) root.innerHTML = '<div class="error">' + message + '</div>';
      post({ status: "failed", description: message });
    }

    function openCheckout() {
      if (typeof Razorpay !== "function") {
        showError("Unable to load Razorpay. Check your internet connection and try again.");
        return;
      }
      if (!"${keyId}" || !"${orderId}") {
        showError("Payment details are incomplete. Please go back and try again.");
        return;
      }
      try {
        var options = {
          key: "${keyId}",
          amount: ${amount},
          currency: "${currency}",
          name: "HelperBook",
          description: "${escapeJs(description)}",
          order_id: "${orderId}",
          theme: { color: "${RAZORPAY_THEME}" },
          handler: function (response) {
            post({
              status: "success",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: function () {
              post({ status: "dismissed" });
            }
          }
        };
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function (response) {
          var description = response && response.error ? response.error.description : "";
          post({ status: "failed", description: description || "Payment failed" });
        });
        rzp.open();
        post({ status: "opened" });
        var root = document.getElementById("status");
        if (root) {
          root.innerHTML = '<div>Complete payment in the Razorpay window.</div><div class="muted">Do not close this screen until payment finishes.</div>';
        }
      } catch (error) {
        showError((error && error.message) || "Unable to open Razorpay checkout.");
      }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(openCheckout, 50);
    } else {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(openCheckout, 50);
      });
    }
  </script>
</body>
</html>`;
}

export default function RazorpayCheckout({ checkout, onResult, onClose }) {
  const insets = useSafeAreaInsets();
  const webRef = useRef(null);
  const [failed, setFailed] = useState("");
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);

  const validationError = !checkout?.keyId
    ? "Razorpay is not configured on the server."
    : !checkout?.orderId
      ? "Payment order is missing. Please try again."
      : !checkout?.amount
        ? "Payment amount is invalid. Please try again."
        : "";

  const html = useMemo(
    () => (checkout && !validationError ? buildCheckoutHtml(checkout) : ""),
    [checkout, validationError]
  );

  if (!checkout) return null;

  function handleMessage(event) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.status === "opened") {
        setOpened(true);
        setLoading(false);
        return;
      }
      if (payload.status === "success") {
        onResult(payload);
        return;
      }
      if (payload.status === "failed") {
        setFailed(payload.description || "Payment failed");
        setLoading(false);
        return;
      }
      onClose();
    } catch {
      // Ignore non-JSON noise from the page.
    }
  }

  const displayError = validationError || failed;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="heading">Payment</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {displayError
                ? "Payment failed. Your subscription was not changed."
                : opened
                  ? "Complete payment in the Razorpay window."
                  : "Opening Razorpay. HelperBook will confirm the payment before changing your plan."}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close payment"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        {displayError ? (
          <View style={styles.failedBox}>
            <AppText variant="body" color={colors.error}>
              {displayError}
            </AppText>
            <AppButton label="Close" onPress={onClose} />
          </View>
        ) : (
          <View style={styles.webWrap}>
            {loading ? (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator color={colors.primary} />
                <AppText variant="caption" color={colors.textSecondary}>
                  Loading Razorpay…
                </AppText>
              </View>
            ) : null}
            <WebView
              ref={webRef}
              originWhitelist={["https://*", "http://*"]}
              source={{
                html,
                baseUrl: "https://api.razorpay.com",
              }}
              onMessage={handleMessage}
              onLoadEnd={() => {
                // Keep spinner until Razorpay reports opened, with a soft fallback.
                setTimeout(() => setLoading(false), 1200);
              }}
              onShouldStartLoadWithRequest={(request) => {
                const url = request?.url || "";
                if (!url || url.startsWith("about:") || url.startsWith("data:")) {
                  return true;
                }
                if (
                  url.startsWith("https://checkout.razorpay.com")
                  || url.startsWith("https://api.razorpay.com")
                  || url.startsWith("https://cdn.razorpay.com")
                  || url.includes("razorpay.com")
                ) {
                  return true;
                }
                // UPI / bank deep links
                if (/^(upi|tez|phonepe|paytmmp|intent):/i.test(url)) {
                  Linking.openURL(url).catch(() => {});
                  return false;
                }
                return true;
              }}
              setSupportMultipleWindows
              onOpenWindow={(event) => {
                const targetUrl = event?.nativeEvent?.targetUrl;
                if (!targetUrl) return;
                if (/^(upi|tez|phonepe|paytmmp|intent):/i.test(targetUrl)) {
                  Linking.openURL(targetUrl).catch(() => {});
                  return;
                }
                webRef.current?.injectJavaScript(
                  `window.location.href = ${JSON.stringify(targetUrl)}; true;`
                );
              }}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              style={styles.web}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  webWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  web: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    zIndex: 1,
  },
  failedBox: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
