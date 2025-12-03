// src/middleware/validate.ts
import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiResponse } from '../utils/typeAliases';
import messages from '../utils/messages';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * validate<T>(schema, target)
 * - schema: Joi.Schema
 * - target: 'body' | 'params' | 'query'  (default: 'body')
 */
const validate = <T = any>(
  schema: Joi.Schema,
  target: 'body' | 'params' | 'query' = 'body'
): RequestHandler => {
  return (req: Request, res: Response<ApiResponse<any>>, next: NextFunction) => {
    try {
      const source: any =
        target === 'body' ? req.body : target === 'params' ? req.params : req.query;

      // Defensive sanitization: clone and trim string values to avoid issues like "true\n" or " 123 "
      const sanitizedSource: Record<string, any> = Array.isArray(source)
        ? (source as any)
        : { ...source };

      Object.keys(sanitizedSource).forEach((k) => {
        const v = sanitizedSource[k];
        if (typeof v === 'string') {
          // trim whitespace and remove stray newlines
          sanitizedSource[k] = v.trim();
        }
        
        // if arrays of strings, optionally trim each item
        else if (Array.isArray(v)) {
          sanitizedSource[k] = v.map((it) => (typeof it === 'string' ? it.trim() : it));
        }
      });

      const { error, value } = schema.validate(sanitizedSource, {
        abortEarly: false,   
        stripUnknown: true,  
        convert: true        
      });

      if (error) {
        const firstMessage = error.details?.[0]?.message || messages.ERROR.INVALID_FIELD_TYPE;

        const details = error.details?.map((d) => ({
          message: d.message,
          path: d.path,
          type: d.type,
          context: d.context
        })) || [];

        console.error('[validate] validation failed', {
          route: `${req.method} ${req.originalUrl}`,
          target,
          details
        });

        const payload: ApiResponse<any> = {
          success: false,
          message: firstMessage,
          data: isDev ? { errors: details } : undefined
        };

        return res.status(400).json(payload);
      }

      // assign sanitized & validated value back
      if (target === 'body') {
        req.body = value as T;
      } else if (target === 'params') {
        const paramsObj = req.params as Record<string, any>;
        Object.keys(value).forEach((k) => {
          const v = value[k];
          paramsObj[k] = v === undefined || v === null ? '' : String(v);
        });
      } else {
        const queryObj = req.query as Record<string, any>;
        Object.keys(value).forEach((k) => {
          queryObj[k] = value[k];
        });
      }

      next();
    } catch (err: any) {
      console.error('[validate] unexpected error', err);
      const payload: ApiResponse<any> = {
        success: false,
        message: err?.message ?? messages.ERROR.SERVER_ERROR,
        data: isDev ? { error: err?.stack || err } : undefined
      };
      return res.status(400).json(payload);
    }
  };
};

export default validate;
