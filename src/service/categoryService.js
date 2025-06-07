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
import { addDVectorDB, deleteDVectorDB, updateVectorDB } from "../chatbot/vectorDB/vectorDBController";
import getCollection from "../chatbot/vectorDB/collection";
import { agentSearchController } from "../chatbot/agent/agent_controller";

initializeApp(firebaseConfig);
const storage = getStorage();

export const deleteProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      let user = await db.User.findOne({
        where: { account: req.body.jwtAccount },
      });
      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          where: { account: req.body.jwtAccount },
        });

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      const product = await db.Storage.findOne({
        where: {
          id: req.body.id,
        },
      });

      // Delete related records first
      await db.StorageSpecific.destroy({ where: { storageId: product.id } });
      await db.StorageSpecificPics.destroy({ where: { storageId: product.id } });
      await db.Cart.destroy({ where: { productId: product.id } });
      await db.Comment.destroy({ where: { productId: product.id } });
      await db.WishList.destroy({ where: { productId: product.id } });
      await db.History.destroy({ where: { productId: product.id } });
      await db.DailyDeal.destroy({ where: { productId: product.id } });

      //Delete vectorDB
      const collection = await getCollection()
      await deleteDVectorDB(collection, [String(product.id)])

      // Delete the main product
      await product.destroy();

      const response = responseWithJWT(req, "Success", user);
      res.status(200).json(response);
    } else {
      res.status(400).json({ message: "jwtAccount is required" });
    }
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const createProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      let user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      let stockOwnerId = user?.id

      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          where: { account: req.body.jwtAccount },
        });
        stockOwnerId = user.sellerId

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      // Create Storage
      let nextID = ((await db.Storage.max("id")) || 0) + 1
      const newProduct = {
        ...req.body,
        id: nextID,
        sellerId: stockOwnerId,
        shipping: 0,
        rate: 0,
        sold: 0,
        view: 0,
        imgURL: req.body.mainImgUrl,
        listImgURL: req.body.listImgUrl.join('___'),
        disable: false,
      };
      await db.Storage.create(newProduct);

      //Add to vectorDB
      const collection = await getCollection()
      let docs = `${newProduct.productName} `
      if (req.body.specifics) {
        docs += `Options: `
        req.body.specifics.forEach((item) => {
          docs += `${item.specificName}(${item.specific.join(', ')}) `
        })
      }

      const metadatas = {
        categoryId: newProduct.categoryId,
        categoryDetailId: newProduct.categoryDetailId,
        price: newProduct.price,
        saleOff: newProduct.saleOff,
        discountedPrice: newProduct.price - (newProduct.price * newProduct.saleOff / 100),
        sold: newProduct.sold,
        rate: newProduct.rate,
      }
      const ids = JSON.stringify(newProduct.id)
      await addDVectorDB(collection, {
        metadatas: [metadatas],
        ids: [ids],
        documents: [docs]
      })

      // Create Specifics
      const specificData = req.body.specifics.map((data) => ({
        specificName: data.specificName,
        storageId: newProduct.id,
        specific: data.specific.join("___"),
      }));
      await db.StorageSpecific.bulkCreate(specificData);

      //Create specific pics
      const specificPicsData = req.body.specificPics.map((data) => {
        const [option1, option2] = data.combination
        return {
          option1: option1,
          option2: option2,
          storageId: newProduct.id,
          price: data.price,
          number: data.number,
          saleOff: data.saleOff,
          imgURL: data.img[0],
          listImgURL: data.img.join('___'),
        }
      })
      db.StorageSpecificPics.bulkCreate(specificPicsData)

      const response = responseWithJWT(req, newProduct, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Get the user
      let user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      let stockOwnerId = user?.id

      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          where: { account: req.body.jwtAccount },
        });
        stockOwnerId = user.sellerId

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      // Get total count of storages for this user
      const total = await db.Storage.count({
        where: { sellerId: stockOwnerId },
      });

      const totalPages = Math.ceil(total / limit);

      // Get paginated storages
      const storages = await db.Storage.findAll({
        where: { sellerId: stockOwnerId },
        limit,
        offset,
        include: [
          {
            model: db.StorageSpecific,
            required: false,
          },
        ],
      });

      const response = responseWithJWT(req, {
        storages: storages,
        totalPages: totalPages
      }, user);

      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const editProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      let user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      let stockOwnerId = user?.id

      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          where: { account: req.body.jwtAccount },
        });
        stockOwnerId = user.sellerId

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      // Update Storage
      const newProduct = {
        ...req.body,
        sellerId: stockOwnerId,
        id: req.body.id,
        imgURL: req.body.mainImgUrl,
        listImgURL: req.body.listImgUrl.join('___'),
      };

      await db.Storage.update(newProduct, {
        where: {
          id: req.body.id,
          sellerId: stockOwnerId,
        },
      });

      const updatedProduct = await db.Storage.findOne({
        where: {
          id: req.body.id,
          sellerId: stockOwnerId,
        },
      });

      //Update to vectorDB
      const collection = await getCollection()
      let docs = `${newProduct.productName} `
      if (req.body.specifics) {
        docs += `Options: `
        req.body.specifics.forEach((item) => {
          docs += `${item.specificName}(${item.specific.join(', ')}) `
        })
      }

      const metadatas = {
        categoryId: newProduct.categoryId,
        categoryDetailId: newProduct.categoryDetailId,
        price: newProduct.price,
        saleOff: newProduct.saleOff,
        discountedPrice: newProduct.price - (newProduct.price * newProduct.saleOff / 100),
        sold: newProduct.sold,
        rate: newProduct.rate,
      }
      const ids = JSON.stringify(newProduct.id)
      await updateVectorDB(collection, {
        metadatas: [metadatas],
        ids: [ids],
        documents: [docs]
      })

      await db.StorageSpecific.destroy({ where: { storageId: updatedProduct.id } });
      await db.StorageSpecificPics.destroy({ where: { storageId: updatedProduct.id } });

      // Create Specifics
      const specificData = req.body.specifics.map((data) => ({
        specificName: data.specificName,
        storageId: newProduct.id,
        specific: data.specific.join("___"),
      }));
      await db.StorageSpecific.bulkCreate(specificData);

      //Create specific pics
      const specificPicsData = req.body.specificPics.map((data) => {
        const [option1, option2] = data.combination
        return {
          option1: option1,
          option2: option2,
          storageId: newProduct.id,
          price: data.price,
          number: data.number,
          saleOff: data.saleOff,
          imgURL: data.img[0],
          listImgURL: data.img.join('___'),
        }
      })
      db.StorageSpecificPics.bulkCreate(specificPicsData)

      const response = responseWithJWT(req, newProduct, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const searchProduct = async (req, res) => {
  try {
    const data = req.query;
    const results = await agentSearchController([], data.content, req.query.limit)

    const response = responseWithJWT(req, results.products);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const searchProductById = async (req, res) => {
  try {
    const data = req.query;

    // Tìm sản phẩm theo ID
    const product = await db.Storage.findOne({
      include: [
        {
          model: db.StorageSpecific,
        },
        {
          model: db.StorageSpecificPics,
        },
      ],
      where: {
        id: data.id,
      },
    });

    // Tăng giá trị view lên 1
    await product.update({ view: product.view + 1 });

    // Trả về sản phẩm sau khi tăng view
    const response = responseWithJWT(req, product);
    res.status(200).json(response);
  } catch (err) {
    console.error("Error in searchProductById:", err);
    res.status(500).json(err);
  }
};

export const searchCategoryProduct = async (req, res) => {
  try {
    const { sortType, categoryId, page = 1, limit = 10 } = req.query; // Mặc định page = 1, limit = 10
    const offset = (page - 1) * limit;

    let whereCondition = {};
    if (categoryId && categoryId != 0) {
      whereCondition.categoryId = categoryId;
    }

    // Xử lý sortType
    let order = [];
    switch (sortType) {
      case "Tính năng":
        order = [["rate", "DESC"]]; // Sắp xếp theo đánh giá cao nhất
        break;
      case "Bán chạy nhất":
        order = [["sold", "DESC"]]; // Sắp xếp theo số lượng bán nhiều nhất
        break;
      case "Theo bảng chữ cái, A-Z":
        order = [["productName", "ASC"]]; // Sắp xếp theo tên sản phẩm từ A-Z
        break;
      case "Theo bảng chữ cái, Z-A":
        order = [["productName", "DESC"]]; // Sắp xếp theo tên sản phẩm từ Z-A
        break;
      case "Giá, thấp đến cao":
        order = [
          [sequelize.literal("price * (1 - (saleOff / 100))"), "ASC"] // Sắp xếp theo giá sau giảm dần
        ];
        break;
      case "Giá, cao đến thấp":
        order = [
          [sequelize.literal("price * (1 - (saleOff / 100))"), "DESC"] // Sắp xếp theo giá sau giảm tăng
        ];
        break;
      case "Ngày, cũ đến mới":
        order = [["createdAt", "ASC"]]; // Sắp xếp theo ngày tạo từ cũ đến mới
        break;
      case "Ngày, mới đến cũ":
        order = [["createdAt", "DESC"]]; // Sắp xếp theo ngày tạo từ mới đến cũ
        break;
      default:
        order = [["createdAt", "DESC"]]; // Mặc định sắp xếp theo ngày tạo từ mới đến cũ
    }

    const { count, rows: products } = await db.Storage.findAndCountAll({
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
      where: whereCondition,
      distinct: true, // ✅ Đảm bảo đếm chính xác
      limit: parseInt(limit),
      offset: parseInt(offset),
      order, // Áp dụng sắp xếp
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

export const getOrder = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const { page = 1, limit = 10, productId = 0, statusFilter = -1, selectedId = undefined } = req.query; // Default: page=1, limit=10
      const offset = (page - 1) * limit;

      let user = await db.User.findOne({
        include: [{ model: db.Storage }],
        where: { account: req.body.jwtAccount },
      });
      let storages = user?.dataValues.Storages
      // Check if user exists
      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          include: [
            {
              model: db.User,
              include: [
                {
                  model: db.Storage,
                },
              ],
            },
          ],
          where: { account: req.body.jwtAccount },
        });

        storages = user?.User.Storages;

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      // If productId is 0, get all storage IDs
      let selectedProductIds = productId == 0
        ? storages.map((storage) => storage.id)
        : [productId];

      // Build where condition
      let whereCondition = { productId: selectedProductIds };
      if (selectedId) {
        whereCondition.id = selectedId; // Add selectedId to the where condition
      }
      if (statusFilter != -1) {
        whereCondition.status = statusFilter; // Add statusFilter to the where condition  
      }

      const { count: totalHistories, rows: histories } = await db.History.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.Address, // Bao gồm thông tin từ bảng Address
          },
        ],
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalHistories / limit);

      // Create response
      const response = responseWithJWT(
        req,
        {
          storages: storages,
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
      let user = await db.User.findOne({
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
      let storage = user?.dataValues.Storages[0].dataValues
      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          include: [
            {
              model: db.User,
              include: [
                {
                  model: db.Storage,
                  where: {
                    id: req.body.productId,
                  },
                },
              ],
            },
          ],
          where: { account: req.body.jwtAccount },
        });

        storage = user?.User.Storages[0].dataValues;

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      const history = await db.History.findOne({
        where: {
          id: req.body.historyId,
        },
      });

      // Kiểm tra quyền theo role
      const { role, status } = req.body;
      let allow = false;
      if (role === "Seller") {
        allow = true; // Full quyền
      } else if (role === "Stocker" && [0, 1, 3].includes(Number(status))) {
        allow = true;
      } else if (role === "Shipper" && [2, 3].includes(Number(status))) {
        allow = true;
      }

      if (!allow) {
        return res.status(403).json({ message: "Bạn không có quyền cập nhật trạng thái này!" });
      }

      if (history && status == 3) {
        await db.Storage.update(
          {
            number:
              storage.number + req.body.number,
          },
          {
            where: {
              id: storage.id,
            },
          }
        );
      }

      // Thực hiện cập nhật trạng thái
      await db.History.update(
        {
          status: status,
        },
        {
          where: {
            id: req.body.historyId,
            productId: storage.id,
          },
        }
      );

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
    // Step 1: Fetch a larger set of products (e.g., 1000 random products)
    const products = await db.Storage.findAll({
      limit: 1000, // Fetch a larger set of products (adjust as needed)
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
    });

    // Step 2: Sort the random products by 'createdAt' in descending order
    const sortedProducts = products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Step 3: Select the top 8 products after sorting
    const topProducts = sortedProducts.slice(0, 20);

    // Step 4: Return the response with the top products
    const response = responseWithJWT(req, topProducts);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};


export const getBestSellerProduct = async (req, res) => {
  try {
    // Step 1: Fetch a larger set of products (e.g., 1000 random products)
    const products = await db.Storage.findAll({
      limit: 1000, // Fetch a larger set of products (adjust as needed)
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
    });

    // Step 2: Sort the random products by 'sold' in descending order
    const sortedProducts = products.sort((a, b) => b.sold - a.sold);

    // Step 3: Select the top 8 products after sorting
    const topProducts = sortedProducts.slice(0, 20);

    // Step 4: Return the response with the top products
    const response = responseWithJWT(req, topProducts);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getFeatureProduct = async (req, res) => {
  try {
    const products = await db.Storage.findAll({
      limit: 1000,
      include: [
        {
          model: db.StorageSpecific,
        },
      ],
    });
    const sortedProducts = products.sort((a, b) => b.rate - a.rate);
    const topProducts = sortedProducts.slice(0, 20);

    const response = responseWithJWT(req, topProducts);
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
        "icon": "https://cdn.chanhtuoi.com/uploads/2021/09/top-thuong-hieu-thoi-trang-nu-duoc-ua-chuong.jpg"
      },
      "1883": {
        "name": "Nhà Cửa - Đời Sống",
        "icon": "https://lavenderstudio.com.vn/wp-content/uploads/2017/11/chup-hinh-nha-cua-dep-8-1024x691.jpg"
      },
      "1789": {
        "name": "Điện Thoại - Máy Tính Bảng",
        "icon": "https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_3183/3183.png?version=160216"
      },
      "2549": {
        "name": "Đồ Chơi - Mẹ & Bé",
        "icon": "https://imgs.vietnamnet.vn/Images/2015/09/16/15/20150916150425-choi-voi-con-2.jpg?width=0&s=PmhL6coCcZaIPGjMVCLDrw"
      },
      "1815": {
        "name": "Thiết Bị Số - Phụ Kiện Số",
        "icon": "https://file.hstatic.net/1000069970/file/phu-kien-dien-thoai-icon_1024x1024.jpg"
      },
      "1882": {
        "name": "Điện Gia Dụng",
        "icon": "https://file.hstatic.net/200000868155/file/do-gia-dung-la-gi-do-dien-gia-dung-gom-nhung-gi-18-10-2022-1.jpg"
      },
      "1520": {
        "name": "Làm Đẹp - Sức Khỏe",
        "icon": "https://suckhoehangngay.mediacdn.vn/thumb_w/650/154880486097817600/2020/7/3/yoga-chua-thoai-hoa-cot-song-15937679556291792714348.jpg"
      },
      "8594": {
        "name": "Ô Tô - Xe Máy - Xe Đạp",
        "icon": "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-o-to.jpg"
      },
      "931": {
        "name": "Thời trang nữ",
        "icon": "https://chupanhnoithat.vn/upload/images/ch%E1%BB%A5p%20%E1%BA%A3nh%20lookbook.jpg"
      },
      "4384": {
        "name": "Bách Hóa Online",
        "icon": "https://eurorack.vn/vnt_upload/news/09_2020/cua-hang-tap-hoa.png"
      },
      "1975": {
        "name": "Thể Thao - Dã Ngoại",
        "icon": "https://images2.thanhnien.vn/zoom/686_429/Uploaded/hongkyqc/2022_11_29/3011-h1-2959.jpg"
      },
      "915": {
        "name": "Thời trang nam",
        "icon": "https://laforce.vn/wp-content/uploads/2023/06/phong-cach-thoi-trang-nam.jpg"
      },
      "17166": {
        "name": "Cross Border - Hàng Quốc Tế",
        "icon": "https://tphcm.cdnchinhphu.vn/334895287454388224/2023/11/21/chiphilogistics-1-17005301254681872115281.jpeg"
      },
      "1846": {
        "name": "Laptop - Máy Vi Tính - Linh kiện",
        "icon": "https://svstore.com.vn/wp-content/uploads/2024/05/laptop-man-hinh-4k-1.jpg"
      },
      "1686": {
        "name": "Giày - Dép nam",
        "icon": "https://www.baolongan.vn/image/news/2022/20220413/images/d1.png"
      },
      "4221": {
        "name": "Điện Tử - Điện Lạnh",
        "icon": "https://phuongnamvina.com/img_data/images/kinh-doanh-vat-tu-dien-lanh-va-nhung-dieu-can-biet.jpeg"
      },
      "1703": {
        "name": "Giày - Dép nữ",
        "icon": "https://top10tphcm.com/wp-content/uploads/2021/08/shop-giay-dep-nu-quan-1-dep-va-chat-luong.jpg"
      },
      "1801": {
        "name": "Máy Ảnh - Máy Quay Phim",
        "icon": "https://blog.janbox.com/wp-content/uploads/2022/06/Top-5-thuong-hieu-may-anh-xach-tay-Nhat-Ban.jpg"
      },
      "27498": {
        "name": "Phụ kiện thời trang",
        "icon": "https://phuongnamvina.com/img_data/images/bi-quyet-kinh-doanh-phu-kien-thoi-trang-sieu-loi-nhuan.jpg"
      },
      "44792": {
        "name": "NGON",
        "icon": "https://thegioianh.diendandoanhnghiep.vn/wp-content/uploads/2023/03/vietnamese_food_top_banner.jpeg"
      },
      "8371": {
        "name": "Đồng hồ và Trang sức",
        "icon": "https://channel.mediacdn.vn/prupload/879/2018/09/img20180906154644335.jpg"
      },
      "6000": {
        "name": "Balo và Vali",
        "icon": "https://nonbaohiemdep.vn/wp-content/uploads/2024/07/balo-du-lich-2-1-1024x680.jpg"
      },
      "11312": {
        "name": "Voucher - Dịch vụ",
        "icon": "https://trangtri360.com/wp-content/uploads/2024/05/mau-voucher-giam-gia-la-gi.jpg"
      },
      "976": {
        "name": "Túi thời trang nữ",
        "icon": "https://cafebiz.cafebizcdn.vn/thumb_w/600/pr/2021/photo-1-16225228336782062106352-331-0-930-960-crop-1622522862921-63758158216474.jpg"
      },
      "27616": {
        "name": "Túi thời trang nam",
        "icon": "https://sakos.vn/wp-content/uploads/2023/05/5-10.jpg"
      },
      "15078": {
        "name": "Chăm sóc nhà cửa",
        "icon": "https://mihanoi.vn/wp-content/uploads/2024/05/7-meo-vat-huu-ich-cho-viec-don-dep-nha-cua-259f9c42b591423d82b6f0ff9997ecae.jpg"
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

export const getRatingData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id'],
            include: [
              {
                model: db.Comment,
                attributes: ['rate'],
              },
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatings = 0;

      user.Storages.forEach((storage) => {
        storage.Comments.forEach((comment) => {
          if (comment.rate >= 1 && comment.rate <= 5) {
            ratings[comment.rate]++;
            totalRatings++;
          }
        });
      });

      const ratingData = Object.keys(ratings).map((key) => {
        const value = ratings[key];
        const percent = totalRatings > 0 ? ((value / totalRatings) * 100).toFixed(2) : 0;
        return {
          name: '★'.repeat(key),
          value: value,
          percent: parseFloat(percent),
        };
      });
      const response = responseWithJWT(req, ratingData, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getRatingData:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getSalesData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const filer = req.query;

      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id'],
            include: [
              {
                model: db.History,
                attributes: ['paid', 'createdAt'],
              },
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filer.salesFiler);

      const salesMap = {};

      user.Storages.forEach((storage) => {
        storage.Histories.forEach((history) => {
          const createdAt = new Date(history.createdAt);
          if (createdAt >= daysAgo) {
            const day = createdAt.toLocaleDateString('vi-VN');
            salesMap[day] = (salesMap[day] || 0) + parseFloat(history.paid);
          }
        });
      });

      const sales = Object.keys(salesMap).map((day) => ({
        day: day,
        sales: salesMap[day],
      }));

      const response = responseWithJWT(req, sales, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getSalesData:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getStockNumber = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id', 'productName', 'number'],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      // Map dữ liệu về dạng { name, stock }
      const data = user.Storages.map(storage => ({
        name: storage.productName,
        stock: storage.number,
      }));

      const response = responseWithJWT(req, data, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getStockNumber:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getProductSalesData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const filer = req.query;

      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id', 'productName'],
            include: [
              {
                model: db.History,
                attributes: ['number', 'createdAt'],
              },
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filer.productSalesFilter);

      const salesMap = {};

      user.Storages.forEach((storage) => {
        salesMap[storage.productName] = 0
        storage.Histories.forEach((history) => {
          const createdAt = new Date(history.createdAt);
          if (createdAt >= daysAgo) {
            salesMap[storage.productName] += history.number
          }
        });
      });

      const productSales = Object.keys(salesMap).map((name) => ({
        name: name,
        saleNumber: salesMap[name],
      }));

      const response = responseWithJWT(req, productSales, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getSalesData:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getRankingData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id', 'view'],
            include: [
              {
                model: db.History,
                attributes: ['number'],
              }
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      })

      const results = {
        productCount: 0,
        salesHistory: 0,
        salesNumber: 0,
        view: 0,
        viewToBuy: 0,
      };
      user.Storages.forEach((storage) => {
        results.productCount += 1
        results.view += storage.view

        storage.Histories.forEach((history) => {
          results.salesHistory += 1
          results.salesNumber += history.number
        });
      });
      results.viewToBuy = (results.salesNumber / results.view) * 100

      const response = responseWithJWT(req, results, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getSalesData:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

export const getSaleToBuyData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Storage,
            attributes: ['id', 'view', 'productName'],
            include: [
              {
                model: db.History,
                attributes: ['number'],
              },
            ],
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      })

      const results = user.Storages.map((storage) => {
        const result = {
          productId: storage.id,
          productName: storage.productName,
          salesNumber: 0,
          viewNumber: storage.view,
          rate: 0
        }
        storage.Histories.forEach((history) => {
          result.salesNumber += history.number
        });

        result.rate = (result.salesNumber / result.viewNumber) * 100

        return result
      });

      const response = responseWithJWT(req, results, user);
      res.status(200).json(response);
    }
  } catch (err) {
    console.error("Error in getSalesData:", err);
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
