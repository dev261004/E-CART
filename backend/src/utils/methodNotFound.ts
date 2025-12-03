// src/middleware/methodNotAllowed.ts
import { RequestHandler } from 'express';
import { ApiResponse } from '../utils/typeAliases';
import messages from '../utils/messages';

/**
 * Sends 405 Method Not Allowed for unsupported HTTP methods
 */
const methodNotAllowed: RequestHandler = (req, res) => {
  // typed response body
  const body: ApiResponse = {
    success: false,
    message: messages.ERROR.METHOD_NOT_ALLOWED
  };
  return res.status(405).json(body);
};

export default methodNotAllowed;
