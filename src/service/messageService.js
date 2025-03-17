import askChatbot from "../chatbot/chatbot";
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
      const obj = [];

      for (let i = 0; i < idLists.length; i++) {
        if (idLists[i].dataValues.userId === user.dataValues.id) {
          guestName = await db.User.findOne({
            where: {
              id: idLists[i].dataValues.sellerId,
            },
            attributes: ["name"],
          });
          userName = user.dataValues.name;

          obj.push({
            ...idLists[i].dataValues,
            userName,
            guestName: guestName.dataValues.name,
          });
        }
        if (idLists[i].dataValues.sellerId === user.dataValues.id) {
          guestName = await db.User.findOne({
            where: {
              id: idLists[i].dataValues.userId,
            },
            attributes: ["name"],
          });
          userName = user.dataValues.name;

          obj.push({
            ...idLists[i].dataValues,
            userName,
            guestName: guestName.dataValues.name,
          });
        }
      }

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

export const askAI = async (req, res) => {
  try {
    const { message, cacheMessage } = req.body;
    const data = await askChatbot([], message)
    const results = data.products.map((product) => {
      return {
        id: product.id,
        productName: product.productName,
        price: product.price,
        rate: product.rate,
        brandName: product.brandName,
        saleOff: product.saleOff,
        imgURL: product.imgURL
      }
    })


    const response = responseWithJWT(req, {
      message: data.message,
      products: results
    });
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
  }
};
