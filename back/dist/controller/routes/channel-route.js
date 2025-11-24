"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelRoute = void 0;
const express_1 = __importDefault(require("express"));
const channel_ctrl_1 = require("../channel-ctrl");
exports.channelRoute = express_1.default.Router();
exports.channelRoute.post('/create', channel_ctrl_1.createChannel);
exports.channelRoute.get('/community/:communityId', channel_ctrl_1.getChannelsByCommunity);
exports.channelRoute.get('/:communityId/:channelId', channel_ctrl_1.getChannelById);
exports.channelRoute.put('/:communityId/:channelId', channel_ctrl_1.updateChannel);
exports.channelRoute.delete('/:communityId/:channelId', channel_ctrl_1.deleteChannel);
