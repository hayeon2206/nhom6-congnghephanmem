import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  completeStocktakeSchema,
  createPurchaseReceiptSchema,
  createStocktakeSchema,
  createTransferSchema,
  ledgerQuerySchema,
  stockQuerySchema,
} from './inventory.schema';
import { ledger, receipts, stock, stocktakeController, transfersController } from './inventory.controller';

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

// Stock levels & append-only ledger (read access for all authenticated roles)
inventoryRouter.get('/stock', validate(stockQuerySchema, 'query'), stock);
inventoryRouter.get('/ledger', validate(ledgerQuerySchema, 'query'), ledger);

// FR-INV-02 Purchase receipts
inventoryRouter.get('/purchase-receipts', receipts.list);
inventoryRouter.post('/purchase-receipts', requireRole('OWNER', 'STAFF'), validate(createPurchaseReceiptSchema), receipts.create);
inventoryRouter.post('/purchase-receipts/:id/confirm', requireRole('OWNER', 'STAFF'), receipts.confirm);

// FR-INV-03 Stock transfers (2-step: dispatch -> receive)
inventoryRouter.get('/transfers', transfersController.list);
inventoryRouter.post('/transfers', requireRole('OWNER', 'STAFF'), validate(createTransferSchema), transfersController.create);
inventoryRouter.post('/transfers/:id/dispatch', requireRole('OWNER', 'STAFF'), transfersController.dispatch);
inventoryRouter.post('/transfers/:id/receive', requireRole('OWNER', 'STAFF'), transfersController.receive);
inventoryRouter.post('/transfers/:id/cancel', requireRole('OWNER', 'STAFF'), transfersController.cancel);

// FR-INV-04 Stocktake sessions
inventoryRouter.get('/stocktake', stocktakeController.list);
inventoryRouter.post('/stocktake', requireRole('OWNER', 'STAFF'), validate(createStocktakeSchema), stocktakeController.open);
inventoryRouter.post(
  '/stocktake/:id/complete',
  requireRole('OWNER', 'STAFF'),
  validate(completeStocktakeSchema),
  stocktakeController.complete,
);
