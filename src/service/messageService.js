import { askChatbotSearchingP, askChatbot } from "../chatbot/chatbot";
import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
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
    const { message, cacheMessage, gender = 'Male' } = req.body;
    const data = await askChatbotSearchingP(cacheMessage, message, gender)

    const results = data.products.map((product) => {
      const options = data.compareOptions.find(item => item.id === product.id)
      const optionKey = [];

      for (const key in options.specificVector) {
        const vector = options.specificVector[key];
        const labels = options.specific[key];

        const max = Math.max(...vector);
        const maxIndex = vector.indexOf(max);

        optionKey.push(labels[maxIndex]);
      }

      const storageSpecificPics = product.StorageSpecificPics.find(item => {
        if (
          item.option1 === optionKey[0] && (item.option2 || undefined) === optionKey[1]
        ) {
          return true
        }
        return false
      }) || product.StorageSpecificPics[0]

      if (storageSpecificPics) {
        return {
          id: product.id,
          categoryId: product.categoryId,
          productName: product.productName,
          price: storageSpecificPics.price,
          rate: product.rate,
          brandName: product.brandName,
          saleOff: storageSpecificPics.saleOff,
          imgURL: storageSpecificPics.imgURL,
          StorageSpecifics: product.StorageSpecifics,
          storageSpecificPics: storageSpecificPics
        }
      }

      return {
        id: product.id,
        categoryId: product.categoryId,
        productName: product.productName,
        price: product.price,
        rate: product.rate,
        brandName: product.brandName,
        saleOff: product.saleOff,
        imgURL: product.imgURL,
        StorageSpecifics: product.StorageSpecifics
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

export const askOverviewAI = async (req, res) => {
  try {
    const { message, shopStats } = req.body;
    const advice = await askChatbot(message, shopStats)

    const response = responseWithJWT(req, {
      message: advice
    });
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
  }
};
