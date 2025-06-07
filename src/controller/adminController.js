import { getSellerList, getUserList, disableUser, createReport, createRefund, getAllReported, getGraph, handleReport } from "../service/adminService";

export const getUserListController = async (req, res) => {
    return await getUserList(req, res);
};

export const getSellerListController = async (req, res) => {
    return await getSellerList(req, res);
};

export const getGraphController = async (req, res) => {
    return await getGraph(req, res);
};

export const getAllReportedController = async (req, res) => {
    return await getAllReported(req, res);
};

export const disableUserController = async (req, res) => {
    return await disableUser(req, res);
};

export const handleReportController = async (req, res) => {
    return await handleReport(req, res);
};

export const createReportController = async (req, res) => {
    return await createReport(req, res);
};

export const createRefundController = async (req, res) => {
    return await createRefund(req, res);
};