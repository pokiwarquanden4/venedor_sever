
import { addComment, getCommentOfProduct, createAddress, createCartProduct, createWishList, deleteAddress, deleteAllWishList, deleteCartProduct, deleteWishList, editAddress, editCartProduct, getAddress, getCartProduct, getHistory, getWishList, wishList } from "../service/customerService";

export const addCommentController = async (req, res) => {
    return await addComment(req, res);
};

export const getCommentController = async (req, res) => {
    return await getCommentOfProduct(req, res);
};

export const createAddressController = async (req, res) => {
    return await createAddress(req, res);
};

export const editAddressController = async (req, res) => {
    return await editAddress(req, res);
};

export const getAddressController = async (req, res) => {
    return await getAddress(req, res);
};

export const deleteAddressController = async (req, res) => {
    return await deleteAddress(req, res);
};

export const getWishListController = async (req, res) => {
    return await getWishList(req, res);
};

export const createWishListController = async (req, res) => {
    return await createWishList(req, res);
};

export const deleteWishListController = async (req, res) => {
    return await deleteWishList(req, res);
};

export const deleteAllWishListController = async (req, res) => {
    return await deleteAllWishList(req, res);
};

export const wishListController = async (req, res) => {
    return await wishList(req, res);
};

export const getCartProductController = async (req, res) => {
    return await getCartProduct(req, res);
};

export const deleteCartProductController = async (req, res) => {
    return await deleteCartProduct(req, res);
};

export const createCartProductController = async (req, res) => {
    return await createCartProduct(req, res);
};

export const editCartProductController = async (req, res) => {
    return await editCartProduct(req, res);
};

export const getHistoryController = async (req, res) => {
    return await getHistory(req, res);
};