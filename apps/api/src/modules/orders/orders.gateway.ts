import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order } from './entities/order.entity';
import { Role } from '../../common/enums/role.enum';

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: process.env.APP_URL ?? 'http://localhost:3000', credentials: true },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth as Record<string, string>)?.token ??
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; role: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Personal room — receives updates for their own orders
      void client.join(`user:${payload.sub}`);

      // Admins also join a shared room for all order events
      if (payload.role === Role.OWNER || payload.role === Role.MANAGER) {
        void client.join('admin');
      }

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client can subscribe to a specific order — ownership verified before joining
  @SubscribeMessage('subscribe:order')
  async handleSubscribeOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    const role = client.data.role as string | undefined;

    if (!userId) return;

    // Admins can subscribe to any order
    if (role === Role.OWNER || role === Role.MANAGER) {
      void client.join(`order:${orderId}`);
      return;
    }

    // Customers may only subscribe to their own orders
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id: orderId, userId },
      select: ['id'],
    });

    if (order) {
      void client.join(`order:${orderId}`);
    }
  }

  @SubscribeMessage('unsubscribe:order')
  handleUnsubscribeOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    void client.leave(`order:${orderId}`);
  }

  emitOrderStatusUpdated(userId: string, order: OrderResponseDto): void {
    // Notify the order owner
    this.server.to(`user:${userId}`).emit('order.status_updated', order);
    // Notify anyone watching this specific order
    this.server.to(`order:${order.id}`).emit('order.status_updated', order);
    // Notify all admins
    this.server.to('admin').emit('order.status_updated', order);
  }

  emitOrderCreated(userId: string, order: OrderResponseDto): void {
    this.server.to(`user:${userId}`).emit('order.created', order);
    this.server.to('admin').emit('order.created', order);
  }
}
