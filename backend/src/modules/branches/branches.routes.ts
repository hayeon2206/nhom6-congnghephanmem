import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createBranchSchema, updateBranchSchema } from './branches.schema';
import * as branchesController from './branches.controller';

export const branchesRouter = Router();

branchesRouter.use(authenticate);
branchesRouter.get('/', branchesController.list);
branchesRouter.post('/', requireRole('OWNER'), validate(createBranchSchema), branchesController.create);
branchesRouter.patch('/:id', requireRole('OWNER'), validate(updateBranchSchema), branchesController.update);
branchesRouter.post('/:id/toggle', requireRole('OWNER'), branchesController.toggle);
