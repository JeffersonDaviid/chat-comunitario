"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const ws_1 = require("ws");
const auth_route_1 = require("./controller/routes/auth-route");
const DBSIMULATE_1 = require("./model/services/DBSIMULATE");
const static_1 = require("./utils/static");
const { PORT = 3000 } = process.env;
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use('/src/assets', express_1.default.static(path_1.default.join(process.cwd(), 'src', 'assets')));
app.use('/assets', express_1.default.static(path_1.default.join(process.cwd(), 'src', 'assets')));
app.get('/', (_req, res) => {
    res.send('<h2>Bienvenido a CHAT COMUNITARIO</h2>');
});
app.use('/api/auth', auth_route_1.authRoute);
const server = app.listen(PORT, () => {
    console.log(`Servidor HTTP (Express) iniciado en el puerto ${PORT}`);
});
const channelSockets = new Map();
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket, req) => {
    console.log(`WS: nueva conexión desde ${req.socket.remoteAddress}`);
    const url = new URL(req.url || '/ws', 'http://localhost');
    const communityId = url.searchParams.get('communityId');
    const cedula = url.searchParams.get('cedula');
    const channelIdFromConn = url.searchParams.get('channelId');
    if (!communityId || !cedula || !channelIdFromConn) {
        socket.send(JSON.stringify({
            type: 'error',
            message: 'Faltan parámetros communityId, cedula o channelId',
        }));
        socket.close();
        return;
    }
    const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
    if (!community) {
        socket.send(JSON.stringify({ type: 'error', message: 'Comunidad no encontrada' }));
        socket.close();
        return;
    }
    const isMember = community.members.some((m) => m.cedula === cedula);
    if (!isMember) {
        socket.send(JSON.stringify({ type: 'error', message: 'Usuario no es miembro de la comunidad' }));
        socket.close();
        return;
    }
    const channelExists = (community.channels || []).some((ch) => ch.id === channelIdFromConn);
    if (!channelExists) {
        socket.send(JSON.stringify({ type: 'error', message: 'Canal no encontrado en la comunidad' }));
        socket.close();
        return;
    }
    const chanMap = channelSockets.get(communityId) || new Map();
    const set = chanMap.get(channelIdFromConn) || new Set();
    set.add(socket);
    chanMap.set(channelIdFromConn, set);
    channelSockets.set(communityId, chanMap);
    socket.send(JSON.stringify({
        type: 'welcome',
        message: `Conectado a comunidad ${community.title} / canal`,
        communityId,
        channelId: channelIdFromConn,
    }));
    socket.on('message', (raw) => {
        var _a, _b, _c;
        let payload;
        try {
            payload = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString());
        }
        catch (_d) {
            payload = { type: 'text', content: raw.toString() };
        }
        const channelId = (payload === null || payload === void 0 ? void 0 : payload.channelId) || channelIdFromConn;
        if (!channelId) {
            socket.send(JSON.stringify({
                type: 'error',
                message: 'Falta channelId en el payload del mensaje',
            }));
            return;
        }
        const packet = {
            type: 'message',
            communityId,
            channelId,
            from: cedula,
            timestamp: new Date().toISOString(),
            data: payload,
        };
        try {
            const comm = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
            const user = DBSIMULATE_1.dbUsers.find((u) => u.cedula === cedula);
            const chan = (_a = comm === null || comm === void 0 ? void 0 : comm.channels) === null || _a === void 0 ? void 0 : _a.find((ch) => ch.id === channelId);
            if (!comm || !chan || !user) {
                socket.send(JSON.stringify({
                    type: 'error',
                    message: 'Comunidad/Canal/Usuario no válido para guardar',
                }));
            }
            else {
                chan.messages = chan.messages || [];
                chan.messages.push({
                    id: (0, static_1.generateUUID)(),
                    owner: user,
                    content: String((_c = (_b = payload === null || payload === void 0 ? void 0 : payload.text) !== null && _b !== void 0 ? _b : payload === null || payload === void 0 ? void 0 : payload.content) !== null && _c !== void 0 ? _c : ''),
                    timestamp: packet.timestamp,
                });
            }
        }
        catch (e) {
            console.warn('No se pudo persistir el mensaje en DB simulada:', e);
        }
        const targetsMap = channelSockets.get(communityId);
        const targets = targetsMap === null || targetsMap === void 0 ? void 0 : targetsMap.get(channelId);
        if (!targets)
            return;
        targets.forEach((client) => {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(JSON.stringify(packet));
            }
        });
    });
    socket.on('close', () => {
        const chanMapClose = channelSockets.get(communityId);
        if (chanMapClose) {
            const group = chanMapClose.get(channelIdFromConn);
            if (group) {
                group.delete(socket);
                if (group.size === 0) {
                    chanMapClose.delete(channelIdFromConn);
                }
            }
            if (chanMapClose.size === 0) {
                channelSockets.delete(communityId);
                console.log(`WS: comunidad ${communityId} sin canales activos.`);
            }
        }
        console.log(`WS: conexión cerrada para usuario ${cedula} en comunidad ${communityId} canal ${channelIdFromConn}`);
    });
});
console.log('Servidor WS escuchando en la ruta /ws (query: communityId, cedula, channelId)');
