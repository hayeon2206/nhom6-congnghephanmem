import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../lib/jwt';

let io: SocketIOServer | undefined;

/**
 * FR-SIM-02: real-time push (Socket.IO here, in place of SignalR) so the Admin/POS screens get
 * new-order sound/popup alerts without polling. Clients join a room named after their TenantId
 * so tenants never see each other's events (mirrors the multi-tenant isolation used everywhere else).
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.join(tenantRoom(payload.tenantId));
    } catch {
      socket.disconnect();
    }
  });

  return io;
}

function tenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function emitOrderEvent(tenantId: string, event: string, payload: unknown): void {
  io?.to(tenantRoom(tenantId)).emit(event, payload);
}

export function emitStockAlert(tenantId: string, payload: unknown): void {
  io?.to(tenantRoom(tenantId)).emit('stock:alert', payload);
}
