import { createStaff, deleteStaff, editStaff, getAllStaff } from "../service/staffService";

export const createStaffController = async (req, res) => {
    return await createStaff(req, res);
};

export const editStaffController = async (req, res) => {
    return await editStaff(req, res);
};

export const deleteStaffController = async (req, res) => {
    return await deleteStaff(req, res);
};

export const getAllStaffController = async (req, res) => {
    return await getAllStaff(req, res);
};

