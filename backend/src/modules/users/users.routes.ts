import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createUserSchema, updateUserSchema } from './users.schema';
import * as usersController from './users.controller';

export const usersRouter = Router();

usersRouter.use(authenticate, requireRole('OWNER'));
usersRouter.get('/', usersController.list);
usersRouter.post('/', validate(createUserSchema), usersController.create);
usersRouter.patch('/:id', validate(updateUserSchema), usersController.update);
