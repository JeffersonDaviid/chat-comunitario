"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChannel = exports.updateChannel = exports.getChannelById = exports.getChannelsByCommunity = exports.createChannel = void 0;
const DBSIMULATE_1 = require("../model/services/DBSIMULATE");
const static_1 = require("../utils/static");
const createChannel = (req, res) => {
    var _a;
    try {
        const { communityId, name, description } = req.body;
        if (!communityId || !name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: communityId, name, description',
            });
        }
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        if ((_a = community.channels) === null || _a === void 0 ? void 0 : _a.some((ch) => ch.name === name)) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un canal con este nombre en la comunidad',
            });
        }
        const newChannel = {
            id: (0, static_1.generateUUID)(),
            name,
            description,
            messages: [],
        };
        if (!community.channels) {
            community.channels = [];
        }
        community.channels.push(newChannel);
        return res.status(201).json({
            success: true,
            message: 'Canal creado exitosamente',
            channel: newChannel,
        });
    }
    catch (error) {
        console.error('Error al crear canal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear canal',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.createChannel = createChannel;
const getChannelsByCommunity = (req, res) => {
    try {
        const { communityId } = req.params;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        return res.status(200).json({
            success: true,
            channels: community.channels || [],
        });
    }
    catch (error) {
        console.error('Error al obtener canales:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener canales',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.getChannelsByCommunity = getChannelsByCommunity;
const getChannelById = (req, res) => {
    var _a;
    try {
        const { communityId, channelId } = req.params;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const channel = (_a = community.channels) === null || _a === void 0 ? void 0 : _a.find((ch) => ch.id === channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Canal no encontrado',
            });
        }
        return res.status(200).json({
            success: true,
            channel,
        });
    }
    catch (error) {
        console.error('Error al obtener canal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener canal',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.getChannelById = getChannelById;
const updateChannel = (req, res) => {
    var _a, _b;
    try {
        const { communityId, channelId } = req.params;
        const { name, description } = req.body;
        if (!name && !description) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar',
            });
        }
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const channel = (_a = community.channels) === null || _a === void 0 ? void 0 : _a.find((ch) => ch.id === channelId);
        if (!channel) {
            return res.status(404).json({
                success: false,
                message: 'Canal no encontrado',
            });
        }
        if (name && name !== channel.name) {
            if ((_b = community.channels) === null || _b === void 0 ? void 0 : _b.some((ch) => ch.name === name && ch.id !== channelId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un canal con este nombre',
                });
            }
        }
        if (name)
            channel.name = name;
        if (description)
            channel.description = description;
        return res.status(200).json({
            success: true,
            message: 'Canal actualizado exitosamente',
            channel,
        });
    }
    catch (error) {
        console.error('Error al actualizar canal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar canal',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.updateChannel = updateChannel;
const deleteChannel = (req, res) => {
    var _a, _b;
    try {
        const { communityId, channelId } = req.params;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const channelIndex = (_a = community.channels) === null || _a === void 0 ? void 0 : _a.findIndex((ch) => ch.id === channelId);
        if (channelIndex === undefined || channelIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Canal no encontrado',
            });
        }
        (_b = community.channels) === null || _b === void 0 ? void 0 : _b.splice(channelIndex, 1);
        return res.status(200).json({
            success: true,
            message: 'Canal eliminado exitosamente',
        });
    }
    catch (error) {
        console.error('Error al eliminar canal:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar canal',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.deleteChannel = deleteChannel;
