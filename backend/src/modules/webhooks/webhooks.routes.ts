import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { webhookBurstSchema, webhookOrderSchema } from './webhooks.schema';
import * as webhooksController from './webhooks.controller';

export const webhooksRouter = Router();
webhooksRouter.use(authenticate, requireRole('OWNER', 'STAFF'));

webhooksRouter.get('/logs', webhooksController.logs);
webhooksRouter.post('/simulate', validate(webhookOrderSchema), webhooksController.simulateOrder);
webhooksRouter.post('/simulate/burst', validate(webhookBurstSchema), webhooksController.burst);
