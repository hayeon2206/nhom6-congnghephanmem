import 'express-async-errors';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { branchesRouter } from './modules/branches/branches.routes';
import { brandsRouter, categoriesRouter, productsRouter } from './modules/catalog/catalog.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { posRouter } from './modules/pos/pos.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  if (!env.isTest) app.use(morgan('dev'));

  app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok', service: 'oism-backend' }));

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/branches', branchesRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/brands', brandsRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/pos', posRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/webhooks', webhooksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
