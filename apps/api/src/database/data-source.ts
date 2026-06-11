import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SnakeNamingStrategy } from './snake-naming.strategy';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to cwd .env

export const AppDataSource = new DataSource({
  type: 'postgres',
  namingStrategy: new SnakeNamingStrategy(),
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'apple_plus',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
