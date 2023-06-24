import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
import { Op } from "sequelize";
import sequelize from "sequelize";

export const createRoomChat = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const roomChat = await db.RoomChat.findOne({
        where: {
          userId: user.dataValues.id,
          sellerId: req.body.sellerId,
        },
      });

      if (!roomChat) {
        await db.RoomChat.create({
          userId: user.dataValues.id,
          sellerId: req.body.sellerId,
        });
      }

      const response = responseWithJWT(req, "Ok", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getAllRoomChat = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const idLists = await db.RoomChat.findAll({
        where: {
          [sequelize.Op.or]: [
            { userId: user.dataValues.id },
            { sellerId: user.dataValues.id },
          ],
        },
      });

      let userName;
      let guestName;
      if (idLists.length !== 0) {
        if (idLists[0].dataValues.userId === user.dataValues.id) {
          guestName = await db.User.findOne({
            where: {
              id: idLists[0].dataValues.sellerId,
            },
            attributes: ["name"],
          });
          userName = user.dataValues.name;
        }
        if (idLists[0].dataValues.sellerId === user.dataValues.id) {
          guestName = await db.User.findOne({
            where: {
              id: idLists[0].dataValues.userId,
            },
            attributes: ["name"],
          });
          userName = user.dataValues.name;
        }
      }

      const obj = [];
      idLists.forEach((item) => {
        obj.push({
          ...item.dataValues,
          userName,
          guestName: guestName.dataValues.name,
        });
      });

      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getMessageByRoomChat = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const messages = await db.Message.findAll({
        where: {
          roomId: req.query.id,
        },
      });
      const response = responseWithJWT(req, messages, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
export const createMessage = async (data) => {
  try {
    await db.Message.create({
      roomId: data.roomId,
      isSeller: data.isSeller,
      content: data.content,
    });
  } catch (err) {
    console.log(err);
  }
};
