import { PaymeErrorCode } from '../../../common/enums/payme.enum';

/**
 * A Payme business error. Thrown inside the service and converted by the
 * controller into a JSON-RPC `{ error }` body returned with HTTP 200 — Payme
 * requires its own error codes rather than standard HTTP statuses.
 *
 * Messages are returned in the three locales Payme expects (ru/uz/en).
 */
export class PaymeError extends Error {
  constructor(
    readonly code: PaymeErrorCode,
    readonly localizedMessage: { ru: string; uz: string; en: string },
    readonly data?: string,
  ) {
    super(localizedMessage.en);
  }

  static orderNotFound(): PaymeError {
    return new PaymeError(PaymeErrorCode.ORDER_NOT_FOUND, {
      ru: 'Заказ не найден',
      uz: 'Buyurtma topilmadi',
      en: 'Order not found',
    });
  }

  static orderNotPayable(): PaymeError {
    return new PaymeError(PaymeErrorCode.ORDER_NOT_PAYABLE, {
      ru: 'Заказ не может быть оплачен',
      uz: 'Buyurtmani to‘lab bo‘lmaydi',
      en: 'Order cannot be paid',
    });
  }

  static invalidAmount(): PaymeError {
    return new PaymeError(PaymeErrorCode.INVALID_AMOUNT, {
      ru: 'Неверная сумма',
      uz: 'Noto‘g‘ri summa',
      en: 'Invalid amount',
    });
  }

  static transactionNotFound(): PaymeError {
    return new PaymeError(PaymeErrorCode.TRANSACTION_NOT_FOUND, {
      ru: 'Транзакция не найдена',
      uz: 'Tranzaksiya topilmadi',
      en: 'Transaction not found',
    });
  }

  static cannotPerform(): PaymeError {
    return new PaymeError(PaymeErrorCode.CANNOT_PERFORM, {
      ru: 'Невозможно выполнить операцию',
      uz: 'Amalni bajarib bo‘lmaydi',
      en: 'Unable to perform operation',
    });
  }

  static cannotCancel(): PaymeError {
    return new PaymeError(PaymeErrorCode.CANNOT_CANCEL, {
      ru: 'Невозможно отменить операцию',
      uz: 'Amalni bekor qilib bo‘lmaydi',
      en: 'Unable to cancel operation',
    });
  }

  static unauthorized(): PaymeError {
    return new PaymeError(PaymeErrorCode.INSUFFICIENT_PRIVILEGES, {
      ru: 'Недостаточно привилегий',
      uz: 'Ruxsat yetarli emas',
      en: 'Insufficient privileges',
    });
  }

  static methodNotFound(method: string): PaymeError {
    return new PaymeError(
      PaymeErrorCode.METHOD_NOT_FOUND,
      { ru: 'Метод не найден', uz: 'Metod topilmadi', en: 'Method not found' },
      method,
    );
  }
}
