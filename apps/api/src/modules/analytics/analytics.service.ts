import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';
import {
  DailySalesQueryDto,
  MonthlyRevenueQueryDto,
  TopListQueryDto,
} from './dto/analytics-query.dto';
import {
  DailySalesRowDto,
  MonthlyRevenueRowDto,
  TopCategoryRowDto,
  TopProductRowDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async dailySales(query: DailySalesQueryDto): Promise<DailySalesRowDto[]> {
    const { startDate, endDate } = this.resolveRange(query.startDate, query.endDate);

    const rows: Array<{ date: string; order_count: string; revenue: string }> =
      await this.ds.query(
        `
        SELECT
          DATE(o.created_at)::text          AS date,
          COUNT(*)::int                     AS order_count,
          COALESCE(SUM(o.total_amount), 0)  AS revenue
        FROM orders o
        WHERE o.status <> $1
          AND o.deleted_at IS NULL
          AND o.created_at >= $2::date
          AND o.created_at <  ($3::date + INTERVAL '1 day')
        GROUP BY DATE(o.created_at)
        ORDER BY date
        `,
        [OrderStatus.CANCELLED, startDate, endDate],
      );

    return rows.map((r) => ({
      date: r.date,
      orderCount: Number(r.order_count),
      revenue: r.revenue,
    }));
  }

  async monthlyRevenue(query: MonthlyRevenueQueryDto): Promise<MonthlyRevenueRowDto[]> {
    const year = query.year ?? new Date().getFullYear();

    const rows: Array<{
      year: string;
      month: string;
      order_count: string;
      revenue: string;
    }> = await this.ds.query(
      `
      SELECT
        EXTRACT(YEAR  FROM o.created_at)::int  AS year,
        EXTRACT(MONTH FROM o.created_at)::int  AS month,
        COUNT(*)::int                          AS order_count,
        COALESCE(SUM(o.total_amount), 0)       AS revenue
      FROM orders o
      WHERE o.status <> $1
        AND o.deleted_at IS NULL
        AND EXTRACT(YEAR FROM o.created_at) = $2
      GROUP BY year, month
      ORDER BY month
      `,
      [OrderStatus.CANCELLED, year],
    );

    return rows.map((r) => ({
      year: Number(r.year),
      month: Number(r.month),
      orderCount: Number(r.order_count),
      revenue: r.revenue,
    }));
  }

  async topProducts(query: TopListQueryDto): Promise<TopProductRowDto[]> {
    const { startDate, endDate } = this.resolveRange(query.startDate, query.endDate);
    const limit = query.limit ?? 10;

    const rows: Array<{
      product_id: string;
      product_name: string;
      total_quantity: string;
      total_revenue: string;
    }> = await this.ds.query(
      `
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity)::int              AS total_quantity,
        COALESCE(SUM(oi.total_price), 0)   AS total_revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> $1
        AND o.deleted_at IS NULL
        AND oi.deleted_at IS NULL
        AND o.created_at >= $2::date
        AND o.created_at <  ($3::date + INTERVAL '1 day')
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_revenue DESC
      LIMIT $4
      `,
      [OrderStatus.CANCELLED, startDate, endDate, limit],
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      totalQuantity: Number(r.total_quantity),
      totalRevenue: r.total_revenue,
    }));
  }

  async topCategories(query: TopListQueryDto): Promise<TopCategoryRowDto[]> {
    const { startDate, endDate } = this.resolveRange(query.startDate, query.endDate);
    const limit = query.limit ?? 10;

    const rows: Array<{
      category_id: string;
      category_name: string;
      total_quantity: string;
      total_revenue: string;
    }> = await this.ds.query(
      `
      SELECT
        p.category_id,
        c.name                             AS category_name,
        SUM(oi.quantity)::int              AS total_quantity,
        COALESCE(SUM(oi.total_price), 0)   AS total_revenue
      FROM order_items oi
      INNER JOIN orders       o  ON o.id  = oi.order_id
      INNER JOIN products     p  ON p.id  = oi.product_id
      INNER JOIN categories   c  ON c.id  = p.category_id AND c.deleted_at IS NULL
      WHERE o.status <> $1
        AND o.deleted_at IS NULL
        AND oi.deleted_at IS NULL
        AND o.created_at >= $2::date
        AND o.created_at <  ($3::date + INTERVAL '1 day')
      GROUP BY p.category_id, c.name
      ORDER BY total_revenue DESC
      LIMIT $4
      `,
      [OrderStatus.CANCELLED, startDate, endDate, limit],
    );

    return rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      totalQuantity: Number(r.total_quantity),
      totalRevenue: r.total_revenue,
    }));
  }

  private resolveRange(
    start?: string,
    end?: string,
  ): { startDate: string; endDate: string } {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      startDate: start ?? thirtyDaysAgo.toISOString().slice(0, 10),
      endDate: end ?? todayStr,
    };
  }
}
