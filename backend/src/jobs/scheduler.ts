import cron from 'node-cron';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { cancelExpiredReservations } from '../modules/orders/orders.service';
import { getStockAlerts } from '../modules/reports/reports.service';
import { emitStockAlert } from '../realtime/socket';

/**
 * FR-SIM-03: background processing (node-cron here, in place of Hangfire) for two jobs:
 *  1. auto-cancel Reserved orders whose hold has expired, releasing stock back to the pool.
 *  2. periodically push low-stock alerts to connected clients (FR-REP-03).
 */
export function startBackgroundJobs(): void {
  // Every minute: sweep expired reservations across all tenants.
  cron.schedule('* * * * *', async () => {
    try {
      const cancelled = await cancelExpiredReservations(env.reservationExpiryMinutes);
      if (cancelled > 0) {
        // eslint-disable-next-line no-console
        console.log(`[jobs] auto-cancelled ${cancelled} expired reserved order(s).`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[jobs] cancelExpiredReservations failed:', err);
    }
  });

  // Every 15 minutes: broadcast stock alerts per tenant so dashboards stay fresh without polling.
  cron.schedule('*/15 * * * *', async () => {
    try {
      const tenants = await prisma.tenant.findMany({ select: { id: true } });
      for (const tenant of tenants) {
        const alerts = await getStockAlerts(tenant.id);
        if (alerts.length > 0) emitStockAlert(tenant.id, alerts);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[jobs] stock alert broadcast failed:', err);
    }
  });
}
