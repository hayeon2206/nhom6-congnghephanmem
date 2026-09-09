import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { posCheckoutSchema, posLookupSchema } from './pos.schema';
import * as posController from './pos.controller';

export const posRouter = Router();
posRouter.use(authenticate, requireRole('OWNER', 'STAFF', 'CASHIER'));

posRouter.get('/lookup', validate(posLookupSchema, 'query'), posController.lookup);
posRouter.post('/checkout', validate(posCheckoutSchema), posController.checkout);
