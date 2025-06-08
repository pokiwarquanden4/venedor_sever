import {
  askAI,
  askOverviewAI,
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

export const askAIController = async (req, res) => {
  return await askAI(req, res);
};

export const askOverviewAIController = async (req, res) => {
  return await askOverviewAI(req, res);
};