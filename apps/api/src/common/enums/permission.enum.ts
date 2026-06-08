export enum Permission {
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  PRODUCTS_READ = 'products:read',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_UPDATE = 'products:update',
  PRODUCTS_DELETE = 'products:delete',

  CATEGORIES_MANAGE = 'categories:manage',
  BRANDS_MANAGE = 'brands:manage',

  ORDERS_READ = 'orders:read',
  ORDERS_UPDATE = 'orders:update',
  ORDERS_DELETE = 'orders:delete',

  INVENTORY_READ = 'inventory:read',
  INVENTORY_MANAGE = 'inventory:manage',

  COUPONS_MANAGE = 'coupons:manage',
  PAYMENTS_READ = 'payments:read',
  REPORTS_READ = 'reports:read',
  SETTINGS_MANAGE = 'settings:manage',
}
