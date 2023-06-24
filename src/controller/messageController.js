import {
  createRoomChat,
  getAllRoomChat,
  getMessageByRoomChat,
} from "../service/messageService";

export const createRoomChatController = async (req, res) => {
  return await createRoomChat(req, res);
};
export const getAllRoomChatController = async (req, res) => {
  return await getAllRoomChat(req, res);
};
export const getMessageByRoomChatController = async (req, res) => {
  return await getMessageByRoomChat(req, res);
};
