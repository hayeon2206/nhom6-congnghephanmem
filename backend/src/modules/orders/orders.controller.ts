import { Request, Response } from 'express';
import * as ordersService from './orders.service';

export async function list(req: Request, res: Response) {
  res.json(await ordersService.listOrders(req.auth!.tenantId, req.query as any));
}

export async function get(req: Request, res: Response) {
  res.json(await ordersService.getOrder(req.auth!.tenantId, req.params.id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await ordersService.createOrder(req.auth!.tenantId, req.body));
}

export async function reserve(req: Request, res: Response) {
  res.json(await ordersService.reserveOrder(req.auth!.tenantId, req.params.id));
}

export async function confirm(req: Request, res: Response) {
  res.json(await ordersService.confirmOrder(req.auth!.tenantId, req.params.id));
}

export async function complete(req: Request, res: Response) {
  res.json(await ordersService.completeOrder(req.auth!.tenantId, req.params.id));
}

export async function cancel(req: Request, res: Response) {
  res.json(await ordersService.cancelOrder(req.auth!.tenantId, req.params.id));
}
