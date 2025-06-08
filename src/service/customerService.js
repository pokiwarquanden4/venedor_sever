import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";

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

export const getCommentOfProduct = async (req, res) => {
    try {
        let { page, limit, productId } = req.query;

        // Chuyển đổi sang số nguyên và thiết lập giá trị mặc định
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        // Lấy tổng số bình luận gốc để tính tổng số trang
        const totalComments = await db.Comment.count({
            where: { productId, parentId: null },
        });
        const totalPages = Math.ceil(totalComments / limit);

        // Truy vấn chỉ các bình luận gốc
        const comments = await db.Comment.findAll({
            where: { productId, parentId: null },
            include: [
                {
                    model: db.User,
                    attributes: ["id", "name", "account"] // Thêm username vào kết quả
                },
                {
                    model: db.Comment,
                    as: "children", // Lấy tất cả các bình luận con
                    include: [
                        {
                            model: db.User,
                            attributes: ["id", "name", "account"] // Thêm username cho bình luận con
                        }
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        // Định dạng phản hồi
        const response = responseWithJWT(req, {
            page,
            comments,
            totalPages
        });
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const addComment = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });

            const { productId, content, rate, parentId, historyId = undefined } = req.body;
            const userId = user.id

            // Kiểm tra dữ liệu đầu vào

            if (!productId || (!userId && userId !== 0) || !content) {
                return res.status(400).json({ success: false, message: "Thiếu dữ liệu cần thiết" });
            }

            // Tạo id mới
            const newId = await db.Comment.max('id') + 1 || 1; // Lấy id lớn nhất hiện tại và tăng thêm 1, nếu không có thì bắt đầu từ 1
            // Tạo bình luận mới
            const newComment = await db.Comment.create({
                id: newId, // Thêm id mới
                productId,
                userId,
                content,
                rate: rate || null, // Nếu không có đánh giá sao, để null
                parentId: parentId || null, // Nếu không có parentId, là bình luận gốc
            });

            // Cập nhật feedbackId của History
            if (historyId !== undefined) {
                await db.History.update(
                    { feedbackId: newId }, // Gán feedbackId bằng id của bình luận mới
                    {
                        where: {
                            id: historyId,
                            userId: userId,
                        },
                    }
                );
            }

            const response = responseWithJWT(req, {
                comment: {
                    ...newComment.dataValues, // Bao gồm toàn bộ dữ liệu của bình luận
                    User: {
                        id: user.id,
                        name: user.name,
                        account: user.account, // Thêm thông tin người dùng
                    },
                },
            }, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};