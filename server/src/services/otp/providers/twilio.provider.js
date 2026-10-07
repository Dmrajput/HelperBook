export function createTwilioProvider() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  return {
    async sendOtp(phoneNumber, otp) {
      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio is not configured");
      }

      const body = new URLSearchParams({
        To: phoneNumber,
        From: fromNumber,
        Body: `Your HelperBook code is ${otp}. It expires in 5 minutes.`,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      if (!response.ok) {
        throw new Error("Unable to send OTP");
      }
    },

    async verifyOtp() {
      return null;
    },
  };
}
