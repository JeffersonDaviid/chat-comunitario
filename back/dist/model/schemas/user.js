"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.RegisterUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const RegisterUserSchema = zod_1.default.object({
    cedula: zod_1.default.string(),
    name: zod_1.default.string(),
    lastName: zod_1.default.string(),
    email: zod_1.default.email(),
    password: zod_1.default.string(),
    confirmPassword: zod_1.default.string(),
    address: zod_1.default.string(),
    profile: zod_1.default.instanceof(Buffer).optional(),
});
exports.RegisterUserSchema = RegisterUserSchema;
const LoginSchema = zod_1.default.object({
    email: zod_1.default.email(),
    password: zod_1.default.string(),
});
exports.LoginSchema = LoginSchema;
