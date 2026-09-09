import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { revenueReportQuerySchema, stockAlertQuerySchema, velocityReportQuerySchema } from './reports.schema';
import * as reportsController from './reports.controller';

export const reportsRouter = Router();
reportsRouter.use(authenticate);

reportsRouter.get('/revenue-profit', validate(revenueReportQuerySchema, 'query'), reportsController.revenue);
reportsRouter.get('/inventory-velocity', validate(velocityReportQuerySchema, 'query'), reportsController.velocity);
reportsRouter.get('/stock-alerts', validate(stockAlertQuerySchema, 'query'), reportsController.stockAlerts);
