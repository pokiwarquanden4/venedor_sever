import { cancelOrder, editOrder, getOrder, getPayment, makePayment, purchase } from "../service/purchaseService";

export const getOrderController = async (req, res) => {
    return await getOrder(req, res);
};
export const editOrderController = async (req, res) => {
    return await editOrder(req, res);
};

export const makePaymentController = async (req, res) => {
    return await makePayment(req, res);
};

export const getPaymentController = async (req, res) => {
    return await getPayment(req, res);
};

export const cancelOrderController = async (req, res) => {
    return await cancelOrder(req, res);
};

export const purchaseController = async (req, res) => {
    return await purchase(req, res);
};