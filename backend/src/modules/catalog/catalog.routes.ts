import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createBrandSchema,
  createCategorySchema,
  createProductSchema,
  searchProductSchema,
  updateBrandSchema,
  updateCategorySchema,
  updateProductSchema,
} from './catalog.schema';
import { brands, categories, products } from './catalog.controller';

export const categoriesRouter = Router();
categoriesRouter.use(authenticate);
categoriesRouter.get('/', categories.list);
categoriesRouter.post('/', requireRole('OWNER', 'STAFF'), validate(createCategorySchema), categories.create);
categoriesRouter.patch('/:id', requireRole('OWNER', 'STAFF'), validate(updateCategorySchema), categories.update);
categoriesRouter.delete('/:id', requireRole('OWNER', 'STAFF'), categories.remove);

export const brandsRouter = Router();
brandsRouter.use(authenticate);
brandsRouter.get('/', brands.list);
brandsRouter.post('/', requireRole('OWNER', 'STAFF'), validate(createBrandSchema), brands.create);
brandsRouter.patch('/:id', requireRole('OWNER', 'STAFF'), validate(updateBrandSchema), brands.update);
brandsRouter.delete('/:id', requireRole('OWNER', 'STAFF'), brands.remove);

export const productsRouter = Router();
productsRouter.use(authenticate);
productsRouter.get('/', validate(searchProductSchema, 'query'), products.search);
productsRouter.get('/:id', products.get);
productsRouter.post('/', requireRole('OWNER', 'STAFF'), validate(createProductSchema), products.create);
productsRouter.patch('/:id', requireRole('OWNER', 'STAFF'), validate(updateProductSchema), products.update);
