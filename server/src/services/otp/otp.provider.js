import { createMockProvider } from "./providers/mock.provider.js";
import { createTwilioProvider } from "./providers/twilio.provider.js";

let provider;

export function getOtpProvider() {
  if (provider) {
    return provider;
  }

  if (process.env.OTP_PROVIDER === "mock") {
    provider = createMockProvider();
    return provider;
  }

  if (process.env.OTP_PROVIDER === "twilio") {
    provider = createTwilioProvider();
    return provider;
  }

  throw new Error("OTP provider is not configured");
}
