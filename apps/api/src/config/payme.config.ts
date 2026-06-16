import { registerAs } from '@nestjs/config';

/**
 * Payme (Paycom) Merchant API configuration.
 *
 * In test mode the customer enters a card on Payme's sandbox checkout page
 * (checkout.test.paycom.uz) using Payme test cards — no real money is charged.
 * Switch PAYME_TEST_MODE to false and swap PAYME_KEY for the production key to
 * go live; no code changes are required.
 */
export default registerAs('payme', () => {
  const testMode = (process.env.PAYME_TEST_MODE ?? 'true') !== 'false';
  return {
    merchantId: process.env.PAYME_MERCHANT_ID ?? '',
    // Cashbox key used to verify the Basic-auth header on Merchant API callbacks.
    // Use the TEST key while PAYME_TEST_MODE=true, the production key otherwise.
    key: process.env.PAYME_KEY ?? '',
    testMode,
    checkoutBaseUrl: testMode
      ? 'https://checkout.test.paycom.uz'
      : 'https://checkout.paycom.uz',
    // Account field name registered in the Payme merchant cabinet (e.g. "order_id").
    accountField: process.env.PAYME_ACCOUNT_FIELD ?? 'order_id',
    // Where Payme redirects the customer back to after the hosted checkout.
    returnUrl: process.env.PAYME_RETURN_URL ?? '',
  };
});
