import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
import sequelize from "sequelize";

// Tạo staff mới
export const createStaff = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });

            const { name, roleName, phone, salary, account, password } = req.body;
            await db.Staff.create({
                sellerId: user.id,
                name,
                roleName,
                phone,
                salary,
                account,
                password,
            });


            // Lấy tất cả staff cùng sellerId với user hiện tại
            const staffs = await db.Staff.findAll({
                where: {
                    sellerId: user.id,
                },
            });
            const response = responseWithJWT(req, staffs, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json({ message: "Error creating staff", error: err });
    }
};

// Sửa staff
export const editStaff = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });

            const { id, name, roleName, phone, salary, account, password } = req.body;
            const staff = await db.Staff.findByPk(id);

            await staff.update({ name, roleName, phone, salary, account, password });

            // Lấy tất cả staff cùng sellerId với user hiện tại
            const staffs = await db.Staff.findAll({
                where: {
                    sellerId: user.id,
                },
            });
            const response = responseWithJWT(req, staffs, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json({ message: "Error editing staff", error: err });
    }
};

// Xóa staff
export const deleteStaff = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });

            const { id } = req.body;
            const staff = await db.Staff.findByPk(id);
            await staff.destroy();

            // Lấy tất cả staff cùng sellerId với user hiện tại
            const staffs = await db.Staff.findAll({
                where: {
                    sellerId: user.id,
                },
            });

            const response = responseWithJWT(req, staffs, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json({ message: "Error deleting staff", error: err });
    }
};

// Lấy danh sách tất cả staff
export const getAllStaff = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });

            // Lấy tất cả staff cùng sellerId với user hiện tại
            const staffs = await db.Staff.findAll({
                where: {
                    sellerId: user.id,
                },
            });

            const response = responseWithJWT(req, staffs, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json({ message: "Error getting staff list", error: err });
    }
};