-- Script para limpiar la base de datos y preparar para pruebas
-- Eliminar todas las comunidades (esto eliminará también canales, miembros, etc. en cascada)

DELETE FROM "Messages";
DELETE FROM "ChannelInvitations";
DELETE FROM "ChannelMembers";
DELETE FROM "Channels";
DELETE FROM "CommunityInvitations";
DELETE FROM "CommunityMembers";
DELETE FROM "Communities";

-- Verificar que todo está limpio
SELECT COUNT(*) as total_communities FROM "Communities";
SELECT COUNT(*) as total_channels FROM "Channels";
SELECT COUNT(*) as total_messages FROM "Messages";
SELECT COUNT(*) as total_community_members FROM "CommunityMembers";
SELECT COUNT(*) as total_channel_members FROM "ChannelMembers";
