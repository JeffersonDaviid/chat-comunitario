"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.RegisterUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validateEcuadorianId = (cedula) => {
    if (!/^\d{10}$/.test(cedula))
        return false;
    const province = parseInt(cedula.substring(0, 2));
    if (province < 1 || province > 24)
        return false;
    const digits = cedula.split('').map(Number);
    const verifier = digits[9];
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        let value = digits[i] * coefficients[i];
        if (value > 9)
            value -= 9;
        sum += value;
    }
    const calculatedVerifier = (10 - (sum % 10)) % 10;
    return verifier === calculatedVerifier;
};
const RegisterUserSchema = zod_1.default.object({
    cedula: zod_1.default.string().refine(validateEcuadorianId, {
        message: 'Cédula ecuatoriana inválida',
    }),
    name: zod_1.default.string().min(1, 'El nombre es requerido'),
    lastName: zod_1.default.string().min(1, 'El apellido es requerido'),
    email: zod_1.default.string().email('Email inválido'),
    password: zod_1.default.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: zod_1.default.string(),
    phone: zod_1.default.string().regex(/^09\d{8}$/, 'El teléfono debe tener 10 dígitos y comenzar con 09'),
    address: zod_1.default.string().min(1, 'La dirección es requerida'),
    latitude: zod_1.default.number().min(-90).max(90),
    longitude: zod_1.default.number().min(-180).max(180),
    profile: zod_1.default.instanceof(Buffer).optional(),
});
exports.RegisterUserSchema = RegisterUserSchema;
const LoginSchema = zod_1.default.object({
    email: zod_1.default.email(),
    password: zod_1.default.string(),
});
exports.LoginSchema = LoginSchema;
