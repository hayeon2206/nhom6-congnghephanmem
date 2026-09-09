import { Request, Response } from 'express';
import * as catalogService from './catalog.service';

export const categories = {
  list: async (req: Request, res: Response) => res.json(await catalogService.listCategories(req.auth!.tenantId)),
  create: async (req: Request, res: Response) => res.status(201).json(await catalogService.createCategory(req.auth!.tenantId, req.body)),
  update: async (req: Request, res: Response) => res.json(await catalogService.updateCategory(req.auth!.tenantId, req.params.id, req.body)),
  remove: async (req: Request, res: Response) => {
    await catalogService.deleteCategory(req.auth!.tenantId, req.params.id);
    res.status(204).send();
  },
};

export const brands = {
  list: async (req: Request, res: Response) => res.json(await catalogService.listBrands(req.auth!.tenantId)),
  create: async (req: Request, res: Response) => res.status(201).json(await catalogService.createBrand(req.auth!.tenantId, req.body)),
  update: async (req: Request, res: Response) => res.json(await catalogService.updateBrand(req.auth!.tenantId, req.params.id, req.body)),
  remove: async (req: Request, res: Response) => {
    await catalogService.deleteBrand(req.auth!.tenantId, req.params.id);
    res.status(204).send();
  },
};

export const products = {
  search: async (req: Request, res: Response) => res.json(await catalogService.searchProducts(req.auth!.tenantId, req.query as any)),
  get: async (req: Request, res: Response) => res.json(await catalogService.getProduct(req.auth!.tenantId, req.params.id)),
  create: async (req: Request, res: Response) => res.status(201).json(await catalogService.createProduct(req.auth!.tenantId, req.body)),
  update: async (req: Request, res: Response) => res.json(await catalogService.updateProduct(req.auth!.tenantId, req.params.id, req.body)),
};
