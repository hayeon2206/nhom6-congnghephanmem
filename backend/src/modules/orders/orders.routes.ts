import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createOrderSchema, listOrdersQuerySchema } from './orders.schema';
import * as ordersController from './orders.controller';

export const ordersRouter = Router();
ordersRouter.use(authenticate);

ordersRouter.get('/', validate(listOrdersQuerySchema, 'query'), ordersController.list);
ordersRouter.get('/:id', ordersController.get);
ordersRouter.post('/', requireRole('OWNER', 'STAFF'), validate(createOrderSchema), ordersController.create);

// FR-ORD-03: staff review pending orders, approve/cancel.
ordersRouter.post('/:id/reserve', requireRole('OWNER', 'STAFF'), ordersController.reserve);
ordersRouter.post('/:id/confirm', requireRole('OWNER', 'STAFF'), ordersController.confirm);
ordersRouter.post('/:id/complete', requireRole('OWNER', 'STAFF'), ordersController.complete);
ordersRouter.post('/:id/cancel', requireRole('OWNER', 'STAFF'), ordersController.cancel);
