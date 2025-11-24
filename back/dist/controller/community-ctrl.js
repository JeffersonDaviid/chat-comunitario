"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMemberFromCommunity = exports.addMemberToCommunity = exports.deleteCommunity = exports.updateCommunity = exports.getCommunityById = exports.getCommunitiesByUser = exports.getAllCommunities = exports.createCommunity = void 0;
const DBSIMULATE_1 = require("../model/services/DBSIMULATE");
const static_1 = require("../utils/static");
const createCommunity = (req, res) => {
    try {
        const { title, description, ownerCedula } = req.body;
        if (!title || !description || !ownerCedula) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: title, description, ownerCedula',
            });
        }
        const owner = DBSIMULATE_1.dbUsers.find((u) => u.cedula === ownerCedula);
        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'Usuario propietario no encontrado',
            });
        }
        const newCommunity = {
            id: (0, static_1.generateUUID)(),
            title,
            description,
            owner,
            members: [owner],
            channels: [],
        };
        DBSIMULATE_1.dbCommunities.push(newCommunity);
        return res.status(201).json({
            success: true,
            message: 'Comunidad creada exitosamente',
            community: newCommunity,
        });
    }
    catch (error) {
        console.error('Error al crear comunidad:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear comunidad',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.createCommunity = createCommunity;
const getAllCommunities = (_req, res) => {
    try {
        return res.status(200).json({
            success: true,
            communities: DBSIMULATE_1.dbCommunities,
        });
    }
    catch (error) {
        console.error('Error al obtener comunidades:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener comunidades',
        });
    }
};
exports.getAllCommunities = getAllCommunities;
const getCommunitiesByUser = (req, res) => {
    try {
        const { cedula } = req.params;
        const userCommunities = DBSIMULATE_1.dbCommunities.filter((c) => c.members.some((m) => m.cedula === cedula));
        return res.status(200).json({
            success: true,
            communities: userCommunities,
        });
    }
    catch (error) {
        console.error('Error al obtener comunidades del usuario:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener comunidades',
        });
    }
};
exports.getCommunitiesByUser = getCommunitiesByUser;
const getCommunityById = (req, res) => {
    try {
        const { id } = req.params;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === id);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        return res.status(200).json({
            success: true,
            community,
        });
    }
    catch (error) {
        console.error('Error al obtener comunidad:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener comunidad',
        });
    }
};
exports.getCommunityById = getCommunityById;
const updateCommunity = (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === id);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        if (title)
            community.title = title;
        if (description)
            community.description = description;
        return res.status(200).json({
            success: true,
            message: 'Comunidad actualizada exitosamente',
            community,
        });
    }
    catch (error) {
        console.error('Error al actualizar comunidad:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar comunidad',
        });
    }
};
exports.updateCommunity = updateCommunity;
const deleteCommunity = (req, res) => {
    try {
        const { id } = req.params;
        const index = DBSIMULATE_1.dbCommunities.findIndex((c) => c.id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const deletedCommunity = DBSIMULATE_1.dbCommunities.splice(index, 1);
        return res.status(200).json({
            success: true,
            message: 'Comunidad eliminada exitosamente',
            community: deletedCommunity[0],
        });
    }
    catch (error) {
        console.error('Error al eliminar comunidad:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar comunidad',
        });
    }
};
exports.deleteCommunity = deleteCommunity;
const addMemberToCommunity = (req, res) => {
    try {
        const { communityId, memberCedula } = req.body;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const member = DBSIMULATE_1.dbUsers.find((u) => u.cedula === memberCedula);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }
        const alreadyMember = community.members.some((m) => m.cedula === memberCedula);
        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya es miembro de esta comunidad',
            });
        }
        community.members.push(member);
        return res.status(200).json({
            success: true,
            message: 'Miembro agregado a la comunidad',
            community,
        });
    }
    catch (error) {
        console.error('Error al agregar miembro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al agregar miembro',
        });
    }
};
exports.addMemberToCommunity = addMemberToCommunity;
const removeMemberFromCommunity = (req, res) => {
    try {
        const { communityId, memberCedula } = req.body;
        const community = DBSIMULATE_1.dbCommunities.find((c) => c.id === communityId);
        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }
        const memberIndex = community.members.findIndex((m) => m.cedula === memberCedula);
        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Miembro no encontrado en la comunidad',
            });
        }
        const removedMember = community.members.splice(memberIndex, 1);
        return res.status(200).json({
            success: true,
            message: 'Miembro removido de la comunidad',
            member: removedMember[0],
        });
    }
    catch (error) {
        console.error('Error al remover miembro:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al remover miembro',
        });
    }
};
exports.removeMemberFromCommunity = removeMemberFromCommunity;
