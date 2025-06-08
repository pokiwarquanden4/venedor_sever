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
