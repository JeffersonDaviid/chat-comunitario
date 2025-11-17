import { Response } from 'express';

interface ApiResponse {
  message: string;
  data?: any;
  error?: any;
}

const sendResponse = (
  res: Response,
  status: number,
  message: string = '',
  data?: any,
  error?: any
) => {
  const response: ApiResponse = { message };

  if (data) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  res.status(status).json(response);
};

const sendSuccessResponse = (
  res: Response,
  status: number = 200,
  message: string = '',
  data?: any
) => {
  sendResponse(res, status, message, data);
};

const sendErrorResponse = (
  res: Response,
  status: number = 500,
  message: string = '',
  error?: any
) => {
  sendResponse(res, status, message, undefined, error);
};

export { sendSuccessResponse, sendErrorResponse };
