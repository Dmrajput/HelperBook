# Payment security

Subscription checkout is created by the authenticated owner. The server resolves the plan price from `server/src/config/subscription.config.js` and, when a coupon is present, calculates the payable amount in paise. The client does not supply the charged amount. The payable amount cannot fall below 100 paise. A coupon is redeemed only after the payment is marked paid, and the redemption is unique per payment id.

Checkout verification:

1. Load the pending payment for the authenticated shop and Razorpay order id.
2. Check the checkout signature with `RAZORPAY_KEY_SECRET`.
3. Fetch the payment from Razorpay.
4. Require the same order id, currency INR, the stored amount, and status `captured`.
5. Mark the payment paid and apply the plan once.

`authorized` is not enough to activate a plan. A failed payment does not change the current entitlement.

Webhooks use `express.raw` on `/api/subscriptions/webhook` so the signature is computed over the raw body with `RAZORPAY_WEBHOOK_SECRET`. The signature is checked before the JSON is trusted. The provider event id is claimed before business processing. A repeated event id does not run the handler again. Amount mismatches do not activate the plan.

Refunds from the admin panel require `payments.refund`. If Razorpay is not configured, the refund is stored as `requested` and the payment stays `paid`. A payment is marked refunded only when the provider reports the refund as processed.

This pass did not execute a live Razorpay payment, capture, or refund. Those calls need the real key id, key secret, and webhook secret on the server.
