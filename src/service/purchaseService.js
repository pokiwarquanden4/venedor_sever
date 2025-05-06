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
