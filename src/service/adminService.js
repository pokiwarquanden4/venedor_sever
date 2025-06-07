import getCollection from "../chatbot/vectorDB/collection";
import { deleteDVectorDB } from "../chatbot/vectorDB/vectorDBController";
import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
import { Op, where } from "sequelize";

export const getUserList = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            const { page = 1, limit = 20, text = "" } = req.query;
            const offset = (page - 1) * limit;

            let whereCondition = { roleName: 'User' };

            if (text) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { account: { [Op.like]: `%${text}%` } }
                    ]
                };
            }

            const { count, rows: users } = await db.User.findAndCountAll({
                attributes: {
                    exclude: ['otp', 'password'],
                    include: [
                        [
                            db.sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Reporteds AS reported
                    WHERE reported.userId = User.id AND reported.status = 2
                )`),
                            'reportedCount'
                        ]
                    ]
                },
                where: whereCondition,
                include: [
                    {
                        model: db.Reported,
                        as: 'Reporteds',
                        attributes: ['id', 'productId', 'reason', 'status', 'createdAt'],
                        where: { status: 2 },
                        required: false,
                    }
                ],
                offset: parseInt(offset),
                limit: parseInt(limit),
                order: [
                    [db.sequelize.literal('reportedCount'), 'DESC'],
                    ['createdAt', 'DESC']
                ],
            });

            const data = {
                totalPages: Math.ceil(count / limit),
                users,
            };

            const response = responseWithJWT(req, data, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getSellerList = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            const { page = 1, limit = 20, text = "" } = req.query;
            const offset = (page - 1) * limit;

            let whereCondition = { roleName: 'Seller' };

            if (text) {
                whereCondition = {
                    ...whereCondition,
                    [Op.or]: [
                        { account: { [Op.like]: `%${text}%` } }
                    ]
                };
            }

            // Lấy danh sách seller và đếm số lần bị reported với status = 1
            const { count, rows: sellers } = await db.User.findAndCountAll({
                attributes: {
                    exclude: ['otp', 'password'],
                    include: [
                        [
                            db.sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Reporteds AS reported
                    WHERE reported.userId = User.id AND reported.status = 2
                )`),
                            'reportedCount'
                        ]
                    ]
                },
                where: whereCondition,
                include: [
                    {
                        model: db.Reported,
                        as: 'Reporteds',
                        attributes: ['id', 'productId', 'reason', 'status', 'createdAt'],
                        where: { status: 1 },
                        required: false,
                    }
                ],
                offset: parseInt(offset),
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']],
            });

            const data = {
                totalPages: Math.ceil(count / limit),
                sellers: sellers,
            };

            const response = responseWithJWT(req, data, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const disableUser = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            // Tìm user theo id hoặc account
            const customer = await db.User.findOne({
                where: { id: req.body.userId }
            });

            if (!customer) {
                return res.status(404).json({ message: "User not found" });
            }

            // Cập nhật disable
            await customer.update({ disable: req.body.disable });

            const response = responseWithJWT(req, { message: "User disabled successfully" }, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const createReport = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            // Lấy thông tin user gửi report
            const user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            // Tạo report mới
            const report = await db.Reported.create({
                userId: user.id,        // Người bị report
                productId: req.body.productId,  // Sản phẩm bị report (nếu có)
                reason: req.body.reason,        // Lý do report
                status: 0,        // Trạng thái report
            });

            const response = responseWithJWT(req, report, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getAllReported = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            // Lấy danh sách report và phân trang
            const { count, rows: reports } = await db.Reported.findAndCountAll({
                where: { status: 0 },
                include: [
                    {
                        model: db.User,
                        attributes: ['id', 'name', 'account', 'email'],
                    },
                    {
                        model: db.Storage,
                        attributes: ['id', 'productName'],
                        include: [
                            {
                                model: db.User,
                                attributes: ['id', 'name', 'account', 'email'],
                            }
                        ]
                    }
                ],
                offset: parseInt(offset),
                limit: parseInt(limit),
                order: [['createdAt', 'DESC']],
            });

            const data = {
                totalPages: Math.ceil(count / limit),
                reports,
            };

            const response = responseWithJWT(req, data, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const createRefund = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            // Lấy thông tin user gửi yêu cầu hoàn tiền
            const user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            // Tạo yêu cầu hoàn tiền mới
            const refund = await db.Refund.create({
                userId: user.id,
                productId: req.body.productId,
                reason: req.body.reason,
                evidenceURL: req.body.evidenceURL,
                refundBankURL: req.body.refundBankURL,
                status: 0,
            });

            const response = responseWithJWT(req, refund, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const handleReport = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            // Lấy thông tin user gửi yêu cầu hoàn tiền
            const user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            const { reportId, status } = req.body;

            // Lấy report
            const report = await db.Reported.findByPk(reportId, {
                include: [{ model: db.Storage }]
            });

            if (!report) {
                return res.status(404).json({ message: "Report not found" });
            }

            // Nếu status = 1 thì xoá sản phẩm và cập nhật status
            if (status === 1) {
                // Xoá sản phẩm liên quan
                if (report.Storage) {
                    const id = report.Storage.id

                    const product = await db.Storage.findOne({
                        where: {
                            id: id,
                        },
                    });

                    await db.StorageSpecific.destroy({ where: { storageId: product.id } });
                    await db.StorageSpecificPics.destroy({ where: { storageId: product.id } });
                    await db.Cart.destroy({ where: { productId: product.id } });
                    await db.Comment.destroy({ where: { productId: product.id } });
                    await db.WishList.destroy({ where: { productId: product.id } });
                    await db.History.destroy({ where: { productId: product.id } });
                    await db.DailyDeal.destroy({ where: { productId: product.id } });

                    const collection = await getCollection()
                    await deleteDVectorDB(collection, [String(product.id)])

                    await product.destroy();
                }
                // Cập nhật lại status của report
                await report.update({ status: 1 });
            } else if (status === 2) {
                // Chỉ cập nhật lại status của report
                await report.update({ status: 2 });
            }

            const response = responseWithJWT(req, report, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getGraph = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let admin = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });

            const { userId } = req.query;

            // Lấy user theo userId (hoặc có thể dùng account nếu muốn)
            const user = await db.User.findOne({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.roleName === 'User') {
                // Lấy 10 đơn hàng gần nhất của user
                const histories = await db.History.findAll({
                    where: { userId: user.id },
                    include: [
                        {
                            model: db.Storage,
                            attributes: ['productName'],
                        }
                    ],
                    order: [['createdAt', 'DESC']],
                    limit: 10,
                });

                // Map dữ liệu trả về
                const orders = histories.map(h => ({
                    name: h.Storage?.productName,
                    price: h.paid,
                    date: h.createdAt
                }));

                const response = responseWithJWT(req, orders, admin);
                res.status(200).json(response);
            }

            if (user.roleName === 'Seller') {
                // Lấy ngày đầu tháng trước
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

                // Lấy tất cả sản phẩm của seller
                const storages = await db.Storage.findAll({
                    where: { sellerId: user.id },
                    attributes: ['id', 'productName'],
                    include: [
                        {
                            model: db.History,
                            attributes: ['paid', 'createdAt'],
                            where: {
                                createdAt: {
                                    [db.Sequelize.Op.gte]: lastMonth
                                }
                            },
                            required: false
                        }
                    ]
                });

                // Map dữ liệu trả về: name và tổng số tiền trong 1 tháng
                const orders = storages.map(storage => ({
                    name: storage.productName,
                    price: storage.Histories.reduce((sum, h) => sum + (h.paid || 0), 0)
                }));

                const response = responseWithJWT(req, orders, admin);
                res.status(200).json(response);
            }
        }
    } catch (err) {
        res.status(500).json(err);
    }
};