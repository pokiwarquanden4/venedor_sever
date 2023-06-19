import db from "../models/index";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  deleteObject,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { firebaseConfig } from "../config/fireBase";
import { responseWithJWT } from "./jwt/jwtService";
import { Op } from "sequelize";
import sequelize from "sequelize";

initializeApp(firebaseConfig);
const storage = getStorage();

export const createProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      //Add Img
      let nextID = ((await db.Storage.max("id")) || 0) + 1,
        imgURL,
        listImgURL = "";
      for (let i = 0; i < req.files.length; i++) {
        const storageRef = ref(
          storage,
          `Product/${user.account}/${nextID}/${i === 0 ? "main" : "all"}/${
            req.files[i].originalname
          }`
        );
        const metadata = {
          contentType: req.files[i].mimetype,
        };
        const snapshot = await uploadBytesResumable(
          storageRef,
          req.files[i].buffer,
          metadata
        );
        const downloadURL = await getDownloadURL(snapshot.ref);
        if (i === 0) {
          imgURL = downloadURL;
        } else {
          listImgURL += `___${downloadURL}`;
        }
      }

      const newProduct = {
        ...req.body,
        id: nextID,
        sellerId: user.id,
        shipping: 0,
        rate: 0,
        sold: 0,
        imgURL: imgURL,
        listImgURL: listImgURL,
        disable: false,
      };
      await db.Storage.create(newProduct);

      const response = responseWithJWT(req, newProduct, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getAllProducts = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });
      const obj = [];
      for (let i = 0; i < user.dataValues.Storages.length; i++) {
        obj.push(user.dataValues.Storages[i].dataValues);
      }
      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const editProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      let removeListImg = req.body.remove.split("___").splice(1);

      //Delete files in FireBase
      for (let i = 0; i < removeListImg.length; i++) {
        deleteFile(removeListImg[i]);
      }

      //Current Product
      const currentProduct = await db.Storage.findOne({
        where: {
          id: req.body.id,
        },
      });

      //Add Img
      let imgURL,
        listImgURL = "";
      for (let i = 0; i < req.files.length; i++) {
        const storageRef = ref(
          storage,
          `Product/${user.account}/${currentProduct.dataValues.id}/${
            i === 0 && req.body.main === "true" ? "main" : "all"
          }/${req.files[i].originalname}`
        );
        const metadata = {
          contentType: req.files[i].mimetype,
        };
        const snapshot = await uploadBytesResumable(
          storageRef,
          req.files[i].buffer,
          metadata
        );
        const downloadURL = await getDownloadURL(snapshot.ref);
        if (i === 0 && req.body.main === "true") {
          imgURL = downloadURL;
        } else {
          listImgURL += `___${downloadURL}`;
        }
      }

      const obj = {
        productName: req.body.productName,
        price: req.body.price,
        description: req.body.description,
        detailDescription: req.body.detailDescription,
        number: req.body.number,
        saleOff: req.body.saleOff,
        category: req.body.category,
      };
      if (imgURL) {
        obj.imgURL = imgURL;
        removeListImg = removeListImg.splice(1);
      }
      let newListImgURL = currentProduct.dataValues.listImgURL;
      for (let i = 0; i < removeListImg.length; i++) {
        newListImgURL = newListImgURL.replace(`___${removeListImg[i]}`, "");
      }
      newListImgURL += listImgURL;
      obj.listImgURL = newListImgURL;

      await db.Storage.update(
        {
          ...obj,
        },
        {
          where: {
            sellerId: user.dataValues.id,
            id: req.body.id,
          },
        }
      );

      const response = responseWithJWT(req, "Success", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const searchProduct = async (req, res) => {
  try {
    const data = req.query;
    const products = await db.Storage.findAll({
      where: {
        description: {
          [Op.like]: `%${data.content}%`,
        },
      },
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const searchProductById = async (req, res) => {
  try {
    const data = req.query;
    const products = await db.Storage.findOne({
      where: {
        id: data.id,
      },
    });
    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const searchCategoryProduct = async (req, res) => {
  try {
    const data = req.query;
    let products;
    if (data.category) {
      products = await db.Storage.findAll({
        where: {
          category: data.category,
        },
      });
    } else {
      products = await db.Storage.findAll();
    }

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

const deleteFile = (url) => {
  const fileRef = ref(storage, url);
  deleteObject(fileRef);
};

export const getOrder = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            include: [
              {
                model: db.History,
                include: [
                  {
                    model: db.Address,
                  },
                ],
              },
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      const response = responseWithJWT(req, user.dataValues.Storages, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const editOrder = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            where: {
              id: req.body.productId,
            },
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      const history = await db.History.findOne({
        where: {
          id: req.body.historyId,
          productId: user.dataValues.Storages[0].dataValues.id,
        },
      });

      if (
        history &&
        req.body.status != 1 &&
        req.body.status != 0 &&
        req.body.status != 2
      ) {
        await db.Storage.update(
          {
            number:
              user.dataValues.Storages[0].dataValues.number + req.body.number,
          },
          {
            where: {
              id: user.dataValues.Storages[0].dataValues.id,
            },
          }
        );
        await db.History.destroy({
          where: {
            id: req.body.historyId,
            productId: user.dataValues.Storages[0].dataValues.id,
          },
        });
      } else {
        await db.History.update(
          {
            status: req.body.status,
          },
          {
            where: {
              id: req.body.historyId,
              productId: user.dataValues.Storages[0].dataValues.id,
            },
          }
        );
      }

      const response = responseWithJWT(req, "Ok", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getDailyDealsProduct = async (req, res) => {
  try {
    const products = await db.Storage.findAll({
      order: sequelize.literal("RAND()"),
      limit: 4,
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getLatestProduct = async (req, res) => {
  try {
    const products = await db.Storage.findAll({
      order: [["createdAt", "DESC"]],
      limit: 8,
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getBestSellerProduct = async (req, res) => {
  try {
    const products = await db.Storage.findAll({
      order: [["sold", "DESC"]],
      limit: 8,
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getFeatureProduct = async (req, res) => {
  try {
    const products = await db.Storage.findAll({
      order: [["rate", "DESC"]],
      limit: 8,
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};
