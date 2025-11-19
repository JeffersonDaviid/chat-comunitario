"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.sendSuccessResponse = void 0;
const sendResponse = (res, status, message = '', data, error) => {
    const response = { message };
    if (data) {
        response.data = data;
    }
    if (error) {
        response.error = error;
    }
    res.status(status).json(response);
};
const sendSuccessResponse = (res, status = 200, message = '', data) => {
    sendResponse(res, status, message, data);
};
exports.sendSuccessResponse = sendSuccessResponse;
const sendErrorResponse = (res, status = 500, message = '', error) => {
    sendResponse(res, status, message, undefined, error);
};
exports.sendErrorResponse = sendErrorResponse;
