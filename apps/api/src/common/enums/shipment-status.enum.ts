export enum ShipmentStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

// Active (non-terminal) statuses — used to detect duplicate shipments for an order.
export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.PENDING,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
];

export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.PENDING]: [ShipmentStatus.PICKED_UP, ShipmentStatus.FAILED],
  [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.FAILED],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.FAILED],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.FAILED],
  [ShipmentStatus.DELIVERED]: [ShipmentStatus.RETURNED],
  [ShipmentStatus.FAILED]: [ShipmentStatus.PENDING, ShipmentStatus.RETURNED],
  [ShipmentStatus.RETURNED]: [],
};
