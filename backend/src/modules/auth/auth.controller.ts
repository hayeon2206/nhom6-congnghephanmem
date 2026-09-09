import { Request, Response } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response) {
  const result = await authService.registerTenant(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function refresh(req: Request, res: Response) {
  const result = await authService.refreshTokens(req.body.refreshToken);
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.auth!.userId);
  res.json(user);
}
