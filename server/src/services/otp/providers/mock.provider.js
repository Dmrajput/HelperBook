const latestCodes = new Map();

export function getLastDevOtp(phoneNumber) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return latestCodes.get(phoneNumber) ?? null;
}

export function createMockProvider() {
  return {
    async sendOtp(phoneNumber, otp) {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Mock OTP provider is unavailable");
      }

      latestCodes.set(phoneNumber, otp);
      console.log(`[DEV OTP] ${phoneNumber} → ${otp}`);
    },

    async verifyOtp() {
      return null;
    },
  };
}
