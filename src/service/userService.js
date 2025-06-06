import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from 'uuid';

function generateRandomNumber() {
  var randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return randomNumber.toString();
}
function generateRandomPassword() {
  const length = 10;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }

  return password;
}

const mailing = async (subject, text, toGmail) => {
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
  };

  mailTransporter.sendMail(details, (err) => {
    if (err) {
      return err;
    } else {
      return true;
    }
  });
};

export const createOtp = async (req, res) => {
  try {
    const user = await db.User.findOne({
      where: {
        account: req.body.account,
      },
    });
    const randomOtp = generateRandomNumber();
    await mailing("Your OTP code", `OTP: ${randomOtp}`, user.dataValues.email);

    await db.User.update(
      {
        otp: randomOtp,
      },
      {
        where: {
          id: user.dataValues.id,
        },
      }
    );

    res.status(200).json("OK");
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getPassword = async (req, res) => {
  try {
    if (req.body.otp !== "") {
      const user = await db.User.findOne({
        where: {
          account: req.body.account,
          otp: req.body.otp,
        },
      });
      const randomPassword = generateRandomPassword();
      await mailing(
        "Your new password code",
        `Password: ${randomPassword}`,
        user.dataValues.email
      );

      await db.User.update(
        {
          otp: "",
          password: randomPassword,
        },
        {
          where: {
            id: user.dataValues.id,
          },
        }
      );

      res.status(200).json("OK");
    } else {
      res.status(500).json("OTP is not valid");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const sendCreateAccountOTP = async (req, res) => {
  try {
    const randomOtp = generateRandomNumber();
    const expirationTime = new Date();
    expirationTime.setTime(expirationTime.getTime() + 10 * 60000); // Thêm 10 phút (10 * 60000 milliseconds) vào thời gian hiện tại

    await db.Otp.create({
      email: req.body.email,
      account: req.body.account,
      otp: randomOtp,
      expired: expirationTime,
    });

    await mailing(
      "Account Verification",
      `Your account ${req.body.account} is linked to this Gmail. This will assist you in case you forget your password.\nOTP: ${randomOtp}`,
      req.body.email
    );
    res.status(200).json("OK");
  } catch (err) {
    res.status(500).json(err);
  }
};

export const createUser = async (req, res) => {
  try {
    const validOtp = await db.Otp.findOne({
      where: {
        email: req.body.email,
        account: req.body.account,
      },
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    const currentTime = new Date();
    if (
      validOtp &&
      validOtp.dataValues.otp === req.body.otp &&
      new Date(validOtp.dataValues.expired) > currentTime
    ) {
      // ✅ Add ID to req.body
      req.body.id = uuidv4();

      const user = await db.User.create(req.body);

      if (user.dataValues.roleName === "User") {
        await db.Customer.create({
          userId: user.dataValues.id,
          money: 0,
        });
      }

      if (user.dataValues.roleName === "Seller") {
        await db.Seller.create({
          sellerId: user.dataValues.id,
          totalMoney: 0,
          permit: true,
        });
      }

      res.status(200).json("OK");
    } else {
      res.status(500).json("Otp is not valid");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const loginUser = async (req, res) => {
  try {
    req.body.refreshToken = true;
    const data = req.query;
    let user
    user = await db.User.findOne({
      include: [
        {
          model: db.Customer,
        },
        {
          model: db.Seller,
        },
        {
          model: db.WishList,
        },
      ],
      where: {
        account: data.account,
        password: data.password,
        disable: false
      },
    });

    if (!user) {
      user = await db.Staff.findOne({
        where: {
          account: data.account,
          password: data.password,
        },
      });
    }

    user.dataValues = {
      ...user.dataValues,
      password: null,
    };
    if (user) {
      const responseData = responseWithJWT(
        req,
        user.dataValues,
        user.dataValues
      );
      res.status(200).json(responseData);
    } else {
      res.status(500).json({ err: true });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getUserData = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      let user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
        attributes: { exclude: ["password", "otp"] }
      });

      if (!user) {
        // Nếu không tìm thấy user, tìm trong staff
        user = await db.Staff.findOne({
          where: { account: req.body.jwtAccount },
          attributes: { exclude: ["password"] }
        });

        if (!user) {
          return res.status(404).json({ message: "User or Staff not found" });
        }
      }

      const response = responseWithJWT(req, user, user);
      res.status(200).json(response);
    } else {
      res.status(200).json("not found");
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createAddress = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      req.body = {
        ...req.body,
        userId: user.dataValues.id,
      };
      await db.Address.create(req.body);
      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const editAddress = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      await db.Address.update(
        {
          name: req.body.name,
          company: req.body.company,
          address1: req.body.address1,
          address2: req.body.address2,
          city: req.body.city,
          country: req.body.country,
          phoneNumber: req.body.phoneNumber,
        },
        {
          where: {
            userId: user.dataValues.id,
            id: req.body.id,
          },
        }
      );
      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getAddress = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.Address,
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });
      const obj = [];
      for (let i = 0; i < user.dataValues.Addresses.length; i++) {
        obj.push(user.dataValues.Addresses[i].dataValues);
      }
      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      await db.Address.destroy({
        where: {
          userId: user.dataValues.id,
          id: req.body.id,
        },
      });
      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getWishList = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const listId = [];
      const obj = [];
      if (req.query.data) {
        req.query.data.forEach((item) => {
          listId.push(parseInt(item.productId));
        });
        const products = await db.Storage.findAll({
          where: {
            id: listId,
          },
          include: [
            {
              model: db.StorageSpecific,
            },
          ],
        });
        for (let i = 0; i < products.length; i++) {
          obj.push(products[i].dataValues);
        }
      }
      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const createWishList = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });
      await db.WishList.create({
        userId: user.dataValues.id,
        productId: req.body.productId,
      });

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const deleteWishList = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      await db.WishList.destroy({
        where: {
          id: req.body.id,
          userId: user.dataValues.id,
        },
      });

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const deleteAllWishList = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      await db.WishList.destroy({
        where: {
          userId: user.dataValues.id,
        },
      });

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const wishList = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.WishList,
          },
        ],
        where: {
          account: req.body.jwtAccount,
        },
      });
      const obj = [];
      user.dataValues.WishLists.forEach((item) => {
        obj.push(item);
      });

      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCartProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const carts = await db.Cart.findAll({
        include: [
          {
            model: db.Storage,
          },
          {
            model: db.StorageSpecificPics,
          },
        ],
        where: {
          userId: user.dataValues.id,
        },
      });
      const obj = [];
      if (carts.length > 0) {
        carts.forEach((item) => {
          obj.push({
            specific: item.dataValues.StorageSpecificPic,
            cartQuantity: item.dataValues.quantity,
            cartId: item.dataValues.id,
            ...item.dataValues.Storage.dataValues,
          });
        });
      }

      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const deleteCartProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      await db.Cart.destroy({
        where: {
          id: req.body.cartId,
          productId: req.body.id,
          userId: user.dataValues.id,
        },
      });

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const createCartProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      const available = await db.Cart.increment(
        {
          quantity: req.body.quantity,
        },
        {
          where: {
            userId: user.dataValues.id,
            productId: req.body.id,
            specificPicsId: req.body.specificPicsId
          },
        }
      );
      if (!available[0][1]) {
        await db.Cart.create({
          userId: user.dataValues.id,
          productId: req.body.id,
          quantity: req.body.quantity,
          specificPicsId: req.body.specificPicsId
        });
      }

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
export const editCartProduct = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      let returnValue = 'OK'

      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      if (req.body.specificId) {
        const specific = await db.StorageSpecificPics.findOne({
          where: {
            id: req.body.specificId,
          },
        });

        if (specific.dataValues.number - req.body.quantity < 0) {
          returnValue = {
            err: true,
            message: "Not enough product in stock",
          }
        } else {
          await db.Cart.update(
            {
              quantity: req.body.quantity,
            },
            {
              where: {
                userId: user.dataValues.id,
                productId: req.body.id,
              },
            }
          );
        }
      } else {
        const product = await db.Storage.findOne({
          where: {
            id: req.body.id,
          },
        });

        if (product.dataValues.number - req.body.quantity < 0) {
          returnValue = {
            err: true,
            message: "Not enough product in stock",
          }
        } else {
          await db.Cart.update(
            {
              quantity: req.body.quantity,
            },
            {
              where: {
                userId: user.dataValues.id,
                productId: req.body.id,
              },
            }
          );
        }
      }

      const response = responseWithJWT(req, returnValue, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
export const getHistory = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        include: [
          {
            model: db.History,
            include: [
              {
                model: db.StorageSpecificPics,
              },
            ],
            include: [
              {
                model: db.Storage,
                attributes: ["id"],
                include: [
                  {
                    model: db.Refund,
                    attributes: ["id", 'status'],
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

      const listItemsID = [];
      user.dataValues.Histories.forEach((item) => {
        listItemsID.push(item.productId);
      });

      const products = await db.Storage.findAll({
        where: {
          id: listItemsID,
        },
        attributes: ["id", "imgURL", "productName", "categoryId"],
      });

      const obj = [];
      user.dataValues.Histories.forEach((item) => {
        const product = products.find((e) => {
          return e.id === item.productId;
        });
        obj.push({
          ...item.dataValues,
          imgURL: product.imgURL,
          productName: product.productName,
          category: product.category,
        });
      });

      const response = responseWithJWT(req, obj, user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const editAccount = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      await db.User.update(
        {
          name: req.body.name,
          gender: req.body.gender,
        },
        {
          where: {
            account: user.dataValues.account,
          },
        }
      );

      const response = responseWithJWT(req, "OK", user);
      res.status(200).json(response);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

export const updatePassword = async (req, res) => {
  try {
    if (req.body.jwtAccount) {
      const user = await db.User.findOne({
        where: {
          account: req.body.jwtAccount,
        },
      });

      if (req.body.password == user.dataValues.password) {
        await db.User.update(
          {
            password: req.body.newPassword,
          },
          {
            where: {
              account: user.dataValues.account,
            },
          }
        );

        const response = responseWithJWT(req, "OK", user);
        res.status(200).json(response);
      } else {
        res.status(500).json("Wrong Password");
      }
    }
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


export const makePayment = async (req, res) => {
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
