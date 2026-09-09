import { Request, Response } from 'express';
import * as reportsService from './reports.service';

export async function revenue(req: Request, res: Response) {
  res.json(await reportsService.getRevenueProfitReport(req.auth!.tenantId, req.query as any));
}

export async function velocity(req: Request, res: Response) {
  res.json(await reportsService.getInventoryVelocityReport(req.auth!.tenantId, req.query as any));
}

export async function stockAlerts(req: Request, res: Response) {
  res.json(await reportsService.getStockAlerts(req.auth!.tenantId, req.query.branchId as string | undefined));
}
