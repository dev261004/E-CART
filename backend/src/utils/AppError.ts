import { IAppError } from "./typeAliases";

class AppError extends Error implements IAppError {
  status: number;
  keyErrorField?: string;
  isOperational: boolean;

  constructor(
    status: number,
    message: string,
    keyErrorField?: string,
    isOperational = true
  ) {
    super(message);

    this.status = status;
    this.keyErrorField = keyErrorField;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
