import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/** Validates & coerces body/query/params against a Zod schema, replacing req.<part> with the parsed value. */
export function validate(schema: Schema, part: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req[part] = schema.parse(req[part]);
    next();
  };
}
