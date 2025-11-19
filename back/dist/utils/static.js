"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUID = generateUID;
exports.generateShortUID = generateShortUID;
exports.generateUUID = generateUUID;
const crypto_1 = require("crypto");
function generateUID(length = 16) {
    return (0, crypto_1.randomBytes)(length).toString('hex');
}
function generateShortUID(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
