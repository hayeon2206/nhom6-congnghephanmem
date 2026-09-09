import { Request, Response } from 'express';
import * as branchesService from './branches.service';

export async function list(req: Request, res: Response) {
  res.json(await branchesService.listBranches(req.auth!.tenantId));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await branchesService.createBranch(req.auth!.tenantId, req.body));
}

export async function update(req: Request, res: Response) {
  res.json(await branchesService.updateBranch(req.auth!.tenantId, req.params.id, req.body));
}

export async function toggle(req: Request, res: Response) {
  res.json(await branchesService.toggleBranchVisibility(req.auth!.tenantId, req.params.id));
}
