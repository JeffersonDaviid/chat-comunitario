"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCtrl = void 0;
const response_http_1 = require("../utils/response-http");
const DBSIMULATE_1 = require("../model/services/DBSIMULATE");
const loginCtrl = (req, res) => {
    try {
        const { email, password } = req.body;
        const found = DBSIMULATE_1.dbUsers.find((u) => u.email === email && u.password === password);
        if (!found) {
            return (0, response_http_1.sendErrorResponse)(res, 401, 'Credenciales inválidas');
        }
        const _a = found, { password: _pwd } = _a, safeUser = __rest(_a, ["password"]);
        const token = `fake-token-${safeUser.cedula}`;
        return (0, response_http_1.sendSuccessResponse)(res, 200, 'Login exitoso', {
            token,
            user: safeUser,
        });
    }
    catch (error) {
        return (0, response_http_1.sendErrorResponse)(res, 400, 'Ocurrió un error al iniciar sesión', error);
    }
};
exports.loginCtrl = loginCtrl;
exports.default = exports.loginCtrl;
