import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { loginSchema, refreshSchema, registerTenantSchema } from './auth.schema';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', validate(registerTenantSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.post('/logout', validate(refreshSchema), authController.logout);
authRouter.get('/me', authenticate, authController.me);
