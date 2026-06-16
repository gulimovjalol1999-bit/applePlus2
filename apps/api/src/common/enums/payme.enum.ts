/**
 * Payme transaction lifecycle states (Merchant API protocol).
 * Stored as a signed smallint on payme_transactions.state.
 */
export enum PaymeState {
  CREATED = 1, // CreateTransaction succeeded, awaiting PerformTransaction
  PERFORMED = 2, // PerformTransaction succeeded — order paid
  CANCELLED = -1, // Cancelled while still pending (was CREATED)
  CANCELLED_AFTER_PERFORM = -2, // Cancelled/refunded after being PERFORMED
}

/**
 * Payme JSON-RPC error codes. Business errors are returned as HTTP 200 with an
 * { error } body — never thrown — so Payme can interpret them per protocol.
 */
export enum PaymeErrorCode {
  // Transport / auth
  INVALID_AMOUNT = -31001,
  TRANSACTION_NOT_FOUND = -31003,
  CANNOT_CANCEL = -31007, // e.g. order already delivered
  CANNOT_PERFORM = -31008,
  INSUFFICIENT_PRIVILEGES = -32504, // bad Basic-auth credentials
  METHOD_NOT_FOUND = -32601,
  // Account/order errors live in the -31050..-31099 range (configurable per cabinet)
  ORDER_NOT_FOUND = -31050,
  ORDER_NOT_PAYABLE = -31051, // order not in a payable state (already paid/cancelled)
}
