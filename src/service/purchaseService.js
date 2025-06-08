import nodemailer from "nodemailer";
import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";

const mailing = async (subject, text, toGmail, imgURL) => {
  let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "venedorshop@gmail.com",
      pass: "nnxmjaopbwiexjpi",
    },
  });

  let details = {
    from: "venedorshop@gmail.com",
    to: toGmail,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: "image.jpg",
        path: imgURL,
        cid: "unique@nodemailer.com",
      },
    ],
  };

  mailTransporter.sendMail(details, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("ok");
    }
  });
};

export const purchase = async (req, res) => {
  try {
    let returnValue = 'OK'

    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Cart,
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });

      user.Carts.forEach(async (item) => {
        const product = await db.Storage.findOne({
          where: {
            id: item.productId,
          },
        });

        if (item.specificPicsId) {
          const specific = await db.StorageSpecificPics.findOne({
            where: {
              id: item.specificPicsId,
            },
          });

          if (specific.number - item.quantity >= 0) {
            await db.StorageSpecificPics.update(
              {
                number: specific.number - item.quantity,
              },
              {
                where: {
                  id: item.specificPicsId,
                },
              }
            );

            await db.History.create({
              userId: user.dataValues.id,
              specificPicsId: item.specificPicsId,
              addressId: req.body.addressId,
              productId: item.productId,
              number: item.quantity,
              paid:
                item.quantity *
                (product.dataValues.price -
                  product.dataValues.price * (product.dataValues.saleOff / 100)),
              status: 0,
              cancel: false,
            });

            await db.Cart.destroy({
              where: {
                id: item.id,
              },
            });

            await mailing(
              "Thank you for buying",
              `Product Name: ${product.productName} \nQuantity: ${item.quantity
              } \nPaid: ${item.quantity *
              (product.dataValues.price -
                product.dataValues.price * (product.dataValues.saleOff / 100))
              }$`,
              user.dataValues.email,
              product.dataValues.imgURL
            );
          } else {
            returnValue = {
              err: true,
              message: "Not enough product in stock",
            }
          }
        } else {
          if (product.number - item.quantity >= 0) {
            await db.Storage.update(
              {
                number: product.number - item.quantity,
              },
              {
                where: {
                  id: item.productId,
                },
              }
            );

            await db.History.create({
              userId: user.dataValues.id,
              specificPicsId: null,
              addressId: req.body.addressId,
              productId: item.productId,
              number: item.quantity,
              paid:
                item.quantity *
                (product.dataValues.price -
                  product.dataValues.price * (product.dataValues.saleOff / 100)),
              status: 0,
              cancel: false,
            });

            await db.Cart.destroy({
              where: {
                id: item.id,
              },
            });

            await mailing(
              "Thank you for buying",
              `Product Name: ${product.productName} \nQuantity: ${item.quantity
              } \nPaid: ${item.quantity *
              (product.dataValues.price -
                product.dataValues.price * (product.dataValues.saleOff / 100))
              }$`,
              user.dataValues.email,
              product.dataValues.imgURL
            );
          } else {
            returnValue = {
              err: true,
              message: "Not enough product in stock",
            }
          }
        }
      });

      const response = responseWithJWT(req, returnValue, user);
      res.status(200).json(response);
    }
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

export const makePayment = async (req, res) => {
  try {
    const data = req.body

    // Tạo payment mới
    const payment = await db.Payment.create({
      gateway: data.gateway,
      transactionDate: data.transactionDate,
      accountNumber: data.accountNumber,
      code: data.code,
      content: data.content,
      transferType: data.transferType,
      transferAmount: data.transferAmount,
      accumulated: data.accumulated,
      subAccount: data.subAccount,
      referenceCode: data.referenceCode,
      description: data.description,
      historyId: data.historyId || null,
    });

    const response = responseWithJWT(req, payment);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getPayment = async (req, res) => {
  try {
    // Lấy tất cả các payment, chỉ lấy trường description
    const payments = await db.Payment.findAll({
      attributes: ['content'],
    });

    // Trả về mảng các content
    const descriptions = payments.map(payment => payment.content);

    const response = responseWithJWT(req, descriptions);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const history = await db.History.findOne({
        where: {
          id: req.body.historyId,
          userId: user.dataValues.id,
        },
      });

      if (history) {
        if (req.body.number) {
          const product = await db.Storage.findOne({
            where: {
              id: req.body.productId,
            },
          });

          await db.Storage.update(
            {
              sold: product.dataValues.sold + req.body.number,
            },
            {
              where: {
                id: product.dataValues.id,
              },
            }
          );
        } else {
          const product = await db.Storage.findOne({
            where: {
              id: history.dataValues.productId,
            },
          });

          await db.Storage.update(
            {
              number: product.dataValues.number + history.dataValues.number,
            },
            {
              where: {
                id: product.dataValues.id,
              },
            }
          );
        }
      }

      await db.History.destroy({
        where: {
          id: req.body.historyId,
          userId: user.dataValues.id,
        },
      });

      const response = responseWithJWT(req, "Ok", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
