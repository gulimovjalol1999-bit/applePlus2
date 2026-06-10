export class WelcomeEmailEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
  ) {}
}

export class OrderConfirmedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly orderNumber: string,
    public readonly items: Array<{ name: string; quantity: number; price: number }>,
    public readonly subtotal: number,
    public readonly total: number,
    public readonly shippingAddress: string,
  ) {}
}

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly orderNumber: string,
    public readonly status: string,
    public readonly statusMessage: string,
  ) {}
}
