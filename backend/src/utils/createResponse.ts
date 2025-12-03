import { Response } from "express";
import { ApiResponse } from "./typeAliases";

const createResponse = <T = any>(
  res: Response,
  status: number,
  message: string,
  payload?: T
): Response<ApiResponse<T>> => {
  const success = status >= 200 && status < 300;

  return res.status(status).json({
    success,
    message,
    data: payload,
  });
};

export default createResponse;
