import { Request, Response } from 'express';
import * as purchaseReceipts from './purchaseReceipts.service';
import * as transfers from './transfers.service';
import * as stocktake from './stocktake.service';
import * as ledgerService from './ledger.service';
import { getStockForBranch } from './stock.service';
import { prisma } from '../../lib/prisma';

export const receipts = {
  list: async (req: Request, res: Response) => res.json(await purchaseReceipts.listPurchaseReceipts(req.auth!.tenantId)),
  create: async (req: Request, res: Response) => res.status(201).json(await purchaseReceipts.createPurchaseReceipt(req.auth!.tenantId, req.body)),
  confirm: async (req: Request, res: Response) => res.json(await purchaseReceipts.confirmPurchaseReceipt(req.auth!.tenantId, req.params.id)),
};

export const transfersController = {
  list: async (req: Request, res: Response) => res.json(await transfers.listTransfers(req.auth!.tenantId)),
  create: async (req: Request, res: Response) => res.status(201).json(await transfers.createTransfer(req.auth!.tenantId, req.body)),
  dispatch: async (req: Request, res: Response) => res.json(await transfers.dispatchTransfer(req.auth!.tenantId, req.params.id)),
  receive: async (req: Request, res: Response) => res.json(await transfers.receiveTransfer(req.auth!.tenantId, req.params.id)),
  cancel: async (req: Request, res: Response) => res.json(await transfers.cancelTransfer(req.auth!.tenantId, req.params.id)),
};

export const stocktakeController = {
  list: async (req: Request, res: Response) => res.json(await stocktake.listStocktakeSessions(req.auth!.tenantId)),
  open: async (req: Request, res: Response) => res.status(201).json(await stocktake.openStocktakeSession(req.auth!.tenantId, req.body)),
  complete: async (req: Request, res: Response) =>
    res.json(await stocktake.completeStocktakeSession(req.auth!.tenantId, req.params.id, req.body.items)),
};

export async function ledger(req: Request, res: Response) {
  res.json(await ledgerService.queryLedger(req.auth!.tenantId, req.query as any));
}

export async function stock(req: Request, res: Response) {
  const branchId = req.query.branchId as string | undefined;
  if (branchId) {
    res.json(await getStockForBranch(req.auth!.tenantId, branchId));
    return;
  }

  const items = await prisma.stockItem.findMany({
    where: { tenantId: req.auth!.tenantId },
    include: { product: true, branch: true },
  });
  res.json(items);
}
