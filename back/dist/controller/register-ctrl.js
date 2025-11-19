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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCtrl = void 0;
const response_http_1 = require("../utils/response-http");
const saveProfilePic_1 = require("../model/services/saveProfilePic");
const registerCtrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const profileBuffer = data.profile instanceof Buffer ? data.profile : undefined;
        if (data.password !== data.confirmPassword) {
            return (0, response_http_1.sendErrorResponse)(res, 400, 'Las contraseñas no coinciden');
        }
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
            password: data.password,
            address: data.address,
            profileImg: profileImgPath,
        };
        (0, response_http_1.sendSuccessResponse)(res, 201, 'Usuario registrado con éxito', { user: newUser });
    }
    catch (error) {
        (0, response_http_1.sendErrorResponse)(res, 400, 'Ocurrió un error al registrar', error);
    }
});
exports.registerCtrl = registerCtrl;
