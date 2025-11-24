"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCtrl = void 0;
const response_http_1 = require("../utils/response-http");
const saveProfilePic_1 = require("../model/services/saveProfilePic");
const DBSIMULATE_1 = require("../model/services/DBSIMULATE");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const registerCtrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const profileBuffer = data.profile instanceof Buffer ? data.profile : undefined;
        if (data.password !== data.confirmPassword) {
            return (0, response_http_1.sendErrorResponse)(res, 400, 'Las contraseñas no coinciden');
        }
        const existingUser = DBSIMULATE_1.dbUsers.find(u => u.cedula === data.cedula || u.email === data.email);
        if (existingUser) {
            return (0, response_http_1.sendErrorResponse)(res, 400, 'Ya existe un usuario con esa cédula o email');
        }
        const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
        let profileImgPath = '';
        if (profileBuffer) {
            try {
                profileImgPath = yield (0, saveProfilePic_1.saveProfilePic)(data.cedula, profileBuffer);
            }
            catch (e) {
                return (0, response_http_1.sendErrorResponse)(res, 400, 'No se pudo guardar la imagen de perfil', e);
            }
        }
        const newUser = {
            cedula: data.cedula,
            name: data.name,
            lastName: data.lastName,
            email: data.email,
            password: hashedPassword,
            phone: data.phone,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            profileImg: profileImgPath,
        };
        DBSIMULATE_1.dbUsers.push(newUser);
        const { password } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        (0, response_http_1.sendSuccessResponse)(res, 201, 'Usuario registrado con éxito', { user: userWithoutPassword });
    }
    catch (error) {
        (0, response_http_1.sendErrorResponse)(res, 400, 'Ocurrió un error al registrar', error);
    }
});
exports.registerCtrl = registerCtrl;
