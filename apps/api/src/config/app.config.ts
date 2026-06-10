import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  url: process.env.APP_URL ?? 'http://localhost:3000',
  // Set SHIPPING_FLAT_RATE env var (e.g. "9.99") to charge a flat rate.
  // Replace with ShippingRateService when carrier integration is ready.
  shippingFlatRate: parseFloat(process.env.SHIPPING_FLAT_RATE ?? '0'),
  // Container filesystem mount point for disk health check.
  // Override with HEALTH_DISK_PATH if the app root is on a non-root volume.
  healthDiskPath: process.env.HEALTH_DISK_PATH ?? '/',
  // HMAC secret for verifying payment provider webhook payloads (sha256).
  // Set PAYMENT_WEBHOOK_SECRET in production. Skipped in development when unset.
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? '',
}));
