import { Permission } from '../enums/permission.enum';
import { Role } from '../enums/role.enum';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),

  [Role.MANAGER]: [
    Permission.USERS_READ,
    Permission.USERS_CREATE,
    Permission.USERS_UPDATE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_CREATE,
    Permission.PRODUCTS_UPDATE,
    Permission.PRODUCTS_DELETE,
    Permission.CATEGORIES_MANAGE,
    Permission.BRANDS_MANAGE,
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_MANAGE,
    Permission.COUPONS_MANAGE,
    Permission.PAYMENTS_READ,
    Permission.REPORTS_READ,
    Permission.SETTINGS_MANAGE,
  ],

  [Role.OPERATOR]: [
    Permission.USERS_READ,
    Permission.PRODUCTS_READ,
    Permission.ORDERS_READ,
    Permission.ORDERS_UPDATE,
    Permission.INVENTORY_READ,
    Permission.PAYMENTS_READ,
    Permission.REPORTS_READ,
  ],

  [Role.WAREHOUSE]: [
    Permission.PRODUCTS_READ,
    Permission.ORDERS_READ,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_MANAGE,
  ],

  [Role.CUSTOMER]: [],
};
