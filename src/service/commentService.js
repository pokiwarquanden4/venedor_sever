import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";

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

            const { productId, content, rate, parentId } = req.body;
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
