import { Request, Response } from 'express';
import * as posService from './pos.service';

export async function lookup(req: Request, res: Response) {
  const { q, branchId } = req.query as { q: string; branchId: string };
  res.json(await posService.lookupProducts(req.auth!.tenantId, branchId, q));
}

export async function checkout(req: Request, res: Response) {
  res.status(201).json(await posService.fastCheckout(req.auth!.tenantId, req.body));
}
