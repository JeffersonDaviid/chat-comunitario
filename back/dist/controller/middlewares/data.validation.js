"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const response_http_1 = require("../../utils/response-http");
const schemaValidator = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            (0, response_http_1.sendErrorResponse)(res, 400, 'Los datos no son válidos', error.issues.map((issue) => ({
                field: issue.path[0],
                message: issue.message,
            })));
        }
    }
};
exports.default = schemaValidator;
