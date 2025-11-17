import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject } from 'zod';
import { sendErrorResponse } from '../../utils/response-http';

const schemaValidator =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendErrorResponse(
          res,
          400,
          'Los datos no son válidos',
          error.issues.map((issue) => ({
            field: issue.path[0],
            message: issue.message,
          }))
        );
      }
    }
  };
export default schemaValidator;
