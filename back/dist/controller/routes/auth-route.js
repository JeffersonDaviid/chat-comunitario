"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = require("express");
const data_validation_1 = __importDefault(require("../middlewares/data.validation"));
const user_1 = require("../../model/schemas/user");
const register_ctrl_1 = require("../register-ctrl");
const login_ctrl_1 = require("../login-ctrl");
const DBSIMULATE_1 = require("../../model/services/DBSIMULATE");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'image/jpeg')
            return cb(null, true);
        cb(new Error('Solo se permite imagen JPG'));
    },
    limits: { fileSize: 2 * 1024 * 1024 },
});
exports.authRoute = (0, express_1.Router)();
exports.authRoute.post('/register', upload.single('profile'), (req, _res, next) => {
    var _a;
    if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.buffer) {
        ;
        req.body.profile = req.file.buffer;
    }
    next();
}, (0, data_validation_1.default)(user_1.RegisterUserSchema), register_ctrl_1.registerCtrl);
exports.authRoute.post('/login', (0, data_validation_1.default)(user_1.LoginSchema), login_ctrl_1.loginCtrl);
exports.authRoute.get('/communities/:cedula', (req, res) => {
    const { cedula } = req.params;
    if (!cedula)
        return res.status(400).json({ message: 'Falta cédula' });
    const communities = DBSIMULATE_1.dbCommunities
        .filter((c) => c.members.some((m) => m.cedula === cedula))
        .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        channels: (c.channels || []).map((ch) => ({
            id: ch.id,
            name: ch.name,
            description: ch.description,
        })),
    }));
    res.json({ communities });
});
exports.authRoute.get('/communities/:communityId/channels/:channelId/messages', (req, res) => {
    const { communityId, channelId } = req.params;
    const comm = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
    if (!comm)
        return res.status(404).json({ message: 'Comunidad no encontrada' });
    const chan = (comm.channels || []).find((ch) => ch.id === channelId);
    if (!chan)
        return res.status(404).json({ message: 'Canal no encontrado' });
    const messages = (chan.messages || []).map((m) => ({
        id: m.id,
        owner: m.owner
            ? { cedula: m.owner.cedula, name: m.owner.name, lastName: m.owner.lastName }
            : undefined,
        content: m.content,
        timestamp: m.timestamp,
    }));
    res.json({ messages });
});
