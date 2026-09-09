import { Request, Response } from 'express';
import * as usersService from './users.service';

export async function list(req: Request, res: Response) {
  res.json(await usersService.listUsers(req.auth!.tenantId));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await usersService.createUser(req.auth!.tenantId, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await usersService.updateUser(req.auth!.tenantId, req.params.id, req.body));
}
