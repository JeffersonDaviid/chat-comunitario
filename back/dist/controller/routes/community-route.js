"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communityRoute = void 0;
const express_1 = __importDefault(require("express"));
const community_ctrl_1 = require("../community-ctrl");
exports.communityRoute = express_1.default.Router();
exports.communityRoute.post('/create', community_ctrl_1.createCommunity);
exports.communityRoute.get('/all', community_ctrl_1.getAllCommunities);
exports.communityRoute.get('/user/:cedula', community_ctrl_1.getCommunitiesByUser);
exports.communityRoute.get('/:id', community_ctrl_1.getCommunityById);
exports.communityRoute.put('/:id', community_ctrl_1.updateCommunity);
exports.communityRoute.delete('/:id', community_ctrl_1.deleteCommunity);
exports.communityRoute.post('/member/add', community_ctrl_1.addMemberToCommunity);
exports.communityRoute.post('/member/remove', community_ctrl_1.removeMemberFromCommunity);
