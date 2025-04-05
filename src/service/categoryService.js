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
import { Op, where } from "sequelize";
import sequelize from "sequelize";
import { queryVectorDB } from "../chatbot/vectorDB/vectorDBController";
import getCollection from "../chatbot/vectorDB/collection";

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
          `Product/${user.account}/${nextID}/${i === 0 ? "main" : "all"}/${req.files[i].originalname
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
      listImgURL = listImgURL.slice(3)

      const newProduct = {
        ...req.body,
        categoryList: '/' + req.body.categoryList.split(',').join('/') + '/',
        id: nextID,
        sellerId: user.id,
        shipping: 0,
        rate: 0,
        sold: 0,
        imgURL: imgURL,
        listImgURL: listImgURL,
        disable: false,
      };

      // Create Storage and get storageId
      const createdStorage = await db.Storage.create(newProduct);
      const storageId = createdStorage.id; // Get the generated ID

      // Create Specifics using the new storageId
      const formattedData = JSON.parse(req.body.specifics).map((data) => ({
        specificName: data.specificName,
        storageId: storageId, // Use the newly created storageId
        specific: data.specific.join("___"), // Convert array to string
      }));

      await db.StorageSpecific.bulkCreate(formattedData); // Insert all specifics at once

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
            include: [
              {
                model: db.StorageSpecific, // Lấy StorageSpecific từ Storage
                required: false,
              },
            ],
            required: false, // Nếu Storage có thể không tồn tại
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
      let removeListImg = req.body.remove.split("___");
      //Delete files in FireBase
      for (let i = 0; i < removeListImg.length; i++) {
        removeListImg[i] && deleteFile(removeListImg[i]);
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
          `Product/${user.account}/${currentProduct.dataValues.id}/${i === 0 && req.body.main === "true" ? "main" : "all"
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
      listImgURL = listImgURL.slice(3)

      const obj = {
        productName: req.body.productName,
        price: req.body.price,
        description: req.body.description,
        number: req.body.number,
        saleOff: req.body.saleOff,
        categoryId: req.body.categoryId,
        categoryList: '/' + req.body.categoryList.split(',').join('/') + '/',
        brandName: req.body.brandName
      };
      if (imgURL) {
        obj.imgURL = imgURL;
        removeListImg = removeListImg.splice(1);
      }
      let newListImgURL = '___' + currentProduct.dataValues.listImgURL;
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

      //Update specific
      const AllS = await db.StorageSpecific.findAll({
        where: { storageId: req.body.id },
      });

      const newSpecifics = JSON.parse(req.body.specifics).map((data) => ({
        id: data.id || null, // Có thể undefined nếu là mới
        specificName: data.specificName,
        storageId: req.body.id,
        specific: data.specific.join("___"),
      }));

      const AllSIds = AllS.map((item) => item.id);
      const newSpecificsIds = newSpecifics.map((item) => item.id).filter((id) => id !== null);

      const toUpdate = newSpecifics.filter((item) => AllSIds.includes(item.id)); // Cập nhật
      const toDelete = AllS.filter((item) => !newSpecificsIds.includes(item.id)); // Xóa
      const toAdd = newSpecifics.filter((item) => item.id === null); // Thêm

      for (const item of toUpdate) {
        await db.StorageSpecific.update(
          { specificName: item.specificName, specific: item.specific },
          { where: { id: item.id } }
        );
      }
      await db.StorageSpecific.destroy({
        where: { id: toDelete.map((item) => item.id) },
      });
      await db.StorageSpecific.bulkCreate(toAdd);

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
    const collection = await getCollection()
    const searchs = {
      text: data.content,
      whereDocuments: {},
      whereMetadatas: {},
      _sortHint: {},
    }
    const results = await queryVectorDB(collection, searchs, 10)
    const products = await db.Storage.findAll({
      where: {
        id: {
          [Op.in]: results.ids[0].map(i => Number(i)), // Convert each string ID to a number
        },
      },
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
      limit: 10,
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
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
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
    const { categoryId, page = 1, limit = 10 } = req.query; // Mặc định page = 1, limit = 10
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const { count, rows: products } = await db.Storage.findAndCountAll({
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
      where: whereCondition,
      distinct: true, // ✅ Ensures correct count
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const data = {
      totalPages: Math.ceil(count / limit),
      products,
    };
    const response = responseWithJWT(req, data);
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
      const { page = 1, limit = 10, productId } = req.query; // Default: page=1, limit=10
      const offset = (page - 1) * limit;

      const user = await db.User.findOne({
        include: [{ model: db.Storage }],
        where: { account: req.body.jwtAccount },
      });

      // Check if user exists
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If productId is undefined, get all storage IDs
      let selectedProductIds = productId != 0
        ? [productId]
        : user.dataValues.Storages.map((storage) => storage.id);

      // Count total histories for pagination
      const totalHistories = await db.History.count({
        where: { productId: selectedProductIds },
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalHistories / limit);

      // Fetch paginated histories
      const histories = await db.History.findAll({
        where: { productId: selectedProductIds },
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [["createdAt", "DESC"]],
      });

      // Create response
      const response = responseWithJWT(
        req,
        {
          storages: user.dataValues.Storages,
          histories: histories,
          totalPages: totalPages,
        },
        user
      );

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
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
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
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
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
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
    });

    const response = responseWithJWT(req, products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCatoryList = async (req, res) => {
  try {
    const data =
    {
      "8322": {
        "name": "Nhà Sách Tiki",
        "icon": "https://salt.tikicdn.com/ts/category/ed/20/60/afa9b3b474bf7ad70f10dd6443211d5f.png"
      },
      "1883": {
        "name": "Nhà Cửa - Đời Sống",
        "icon": "https://salt.tikicdn.com/ts/category/f6/22/46/7e2185d2cf1bca72d5aeac385a865b2b.png"
      },
      "1789": {
        "name": "Điện Thoại - Máy Tính Bảng",
        "icon": "https://salt.tikicdn.com/ts/category/54/c0/ff/fe98a4afa2d3e5142dc8096addc4e40b.png"
      },
      "2549": {
        "name": "Đồ Chơi - Mẹ & Bé",
        "icon": "https://salt.tikicdn.com/ts/category/13/64/43/226301adcc7660ffcf44a61bb6df99b7.png"
      },
      "1815": {
        "name": "Thiết Bị Số - Phụ Kiện Số",
        "icon": "https://salt.tikicdn.com/ts/category/75/34/29/78e428fdd90408587181005f5cc3de32.png"
      },
      "1882": {
        "name": "Điện Gia Dụng",
        "icon": "https://salt.tikicdn.com/ts/category/61/d4/ea/e6ea3ffc1fcde3b6224d2bb691ea16a2.png"
      },
      "1520": {
        "name": "Làm Đẹp - Sức Khỏe",
        "icon": "https://salt.tikicdn.com/ts/category/73/0e/89/bf5095601d17f9971d7a08a1ffe98a42.png"
      },
      "8594": {
        "name": "Ô Tô - Xe Máy - Xe Đạp",
        "icon": "https://salt.tikicdn.com/ts/category/69/f5/36/c6cd9e2849854630ed74ff1678db8f19.png"
      },
      "931": {
        "name": "Thời trang nữ",
        "icon": "https://salt.tikicdn.com/ts/category/55/5b/80/48cbaafe144c25d5065786ecace86d38.png"
      },
      "4384": {
        "name": "Bách Hóa Online",
        "icon": "https://salt.tikicdn.com/ts/category/40/0f/9b/62a58fd19f540c70fce804e2a9bb5b2d.png"
      },
      "1975": {
        "name": "Thể Thao - Dã Ngoại",
        "icon": "https://salt.tikicdn.com/ts/category/0b/5e/3d/00941c9eb338ea62a47d5b1e042843d8.png"
      },
      "915": {
        "name": "Thời trang nam",
        "icon": "https://salt.tikicdn.com/ts/category/00/5d/97/384ca1a678c4ee93a0886a204f47645d.png"
      },
      "17166": {
        "name": "Cross Border - Hàng Quốc Tế",
        "icon": "https://salt.tikicdn.com/ts/category/3c/e4/99/eeee1801c838468d94af9997ec2bbe42.png"
      },
      "1846": {
        "name": "Laptop - Máy Vi Tính - Linh kiện",
        "icon": "https://salt.tikicdn.com/ts/category/92/b5/c0/3ffdb7dbfafd5f8330783e1df20747f6.png"
      },
      "1686": {
        "name": "Giày - Dép nam",
        "icon": "https://salt.tikicdn.com/ts/category/d6/7f/6c/5d53b60efb9448b6a1609c825c29fa40.png"
      },
      "4221": {
        "name": "Điện Tử - Điện Lạnh",
        "icon": "https://salt.tikicdn.com/ts/category/c8/82/d4/64c561c4ced585c74b9c292208e4995a.png"
      },
      "1703": {
        "name": "Giày - Dép nữ",
        "icon": "https://salt.tikicdn.com/ts/category/cf/ed/e1/5a6b58f21fbcad0d201480c987f8defe.png"
      },
      "1801": {
        "name": "Máy Ảnh - Máy Quay Phim",
        "icon": "https://salt.tikicdn.com/ts/category/2d/7c/45/e4976f3fa4061ab310c11d2a1b759e5b.png"
      },
      "27498": {
        "name": "Phụ kiện thời trang",
        "icon": "https://salt.tikicdn.com/ts/category/ca/53/64/49c6189a0e1c1bf7cb91b01ff6d3fe43.png"
      },
      "44792": {
        "name": "NGON",
        "icon": "https://salt.tikicdn.com/ts/category/1e/8c/08/d8b02f8a0d958c74539316e8cd437cbd.png"
      },
      "8371": {
        "name": "Đồng hồ và Trang sức",
        "icon": "https://salt.tikicdn.com/ts/category/8b/d4/a8/5924758b5c36f3b1c43b6843f52d6dd2.png"
      },
      "6000": {
        "name": "Balo và Vali",
        "icon": "https://salt.tikicdn.com/ts/category/3e/c0/30/1110651bd36a3e0d9b962cf135c818ee.png"
      },
      "11312": {
        "name": "Voucher - Dịch vụ",
        "icon": "https://salt.tikicdn.com/ts/category/0a/c9/7b/8e466bdf6d4a5f5e14665ce56e58631d.png"
      },
      "976": {
        "name": "Túi thời trang nữ",
        "icon": "https://salt.tikicdn.com/ts/category/31/a7/94/6524d2ecbec216816d91b6066452e3f2.png"
      },
      "27616": {
        "name": "Túi thời trang nam",
        "icon": "https://salt.tikicdn.com/ts/category/9b/31/af/669e6a133118e5439d6c175e27c1f963.png"
      },
      "15078": {
        "name": "Chăm sóc nhà cửa",
        "icon": "https://salt.tikicdn.com/cache/280x280/ts/product/e2/e0/b4/032924958e08c0c9802fca3f157d53a9.jpg"
      }
    }

    const categories = await db.Category.findAll({
      include: [
        {
          model: db.CategoryDetail,
        },
      ],
    });

    const groupedData = categories.reduce((acc, category) => {
      acc[category.id] = category.CategoryDetails; // Nhóm theo categoryId
      return acc;
    }, {});

    const response = responseWithJWT(req, {
      category: data,
      categoryDetails: groupedData
    });
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};
