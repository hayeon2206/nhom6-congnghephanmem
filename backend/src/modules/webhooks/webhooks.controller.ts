import { Request, Response } from 'express';
import * as webhooksService from './webhooks.service';

export async function simulateOrder(req: Request, res: Response) {
  res.status(201).json(await webhooksService.ingestWebhookOrder(req.auth!.tenantId, req.body));
}

export async function logs(req: Request, res: Response) {
  res.json(await webhooksService.listWebhookLogs(req.auth!.tenantId));
}

export async function burst(req: Request, res: Response) {
  res.status(201).json(await webhooksService.simulateBurst(req.auth!.tenantId, req.body));
}
