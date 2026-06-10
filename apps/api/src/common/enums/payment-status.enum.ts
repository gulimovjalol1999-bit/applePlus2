export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUNDED],
};
