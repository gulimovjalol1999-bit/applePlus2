import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import telegramConfig from './config/telegram.config';
import paymeConfig from './config/payme.config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { UsedPhonesModule } from './modules/used-phones/used-phones.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, redisConfig, storageConfig, telegramConfig, paymeConfig],
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        APP_URL: Joi.string().uri().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASS: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SSL: Joi.boolean().default(false),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        MAIL_HOST: Joi.string().allow('').optional(),
        MAIL_PORT: Joi.number().default(587),
        MAIL_USER: Joi.string().allow('').optional(),
        MAIL_PASS: Joi.string().allow('').optional(),
        MAIL_FROM: Joi.string().email().default('noreply@apple-plus.com'),
        PAYME_MERCHANT_ID: Joi.string().allow('').optional(),
        PAYME_KEY: Joi.string().allow('').optional(),
        PAYME_TEST_MODE: Joi.boolean().default(true),
        PAYME_ACCOUNT_FIELD: Joi.string().default('order_id'),
        PAYME_RETURN_URL: Joi.string().allow('').optional(),
      }),
      validationOptions: { abortEarly: false },
    }),
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 20 }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: { age: 86_400 },
          removeOnFail: { age: 7 * 86_400 },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    InventoryModule,
    UsedPhonesModule,
    OrdersModule,
    CartModule,
    WishlistModule,
    ReviewsModule,
    CouponsModule,
    PaymentsModule,
    ShippingModule,
    SearchModule,
    NotificationsModule,
    AnalyticsModule,
    TelegramModule,
    UploadsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
