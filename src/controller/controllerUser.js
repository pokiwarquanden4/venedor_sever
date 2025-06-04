import {
  loginUser,
  createUser,
  createAddress,
  editAddress,
  getAddress,
  deleteAddress,
  getWishList,
  wishList,
  createWishList,
  deleteWishList,
  deleteAllWishList,
  deleteCartProduct,
  getCartProduct,
  createCartProduct,
  editCartProduct,
  createOtp,
  getPassword,
  getHistory,
  editAccount,
  cancelOrder,
  sendCreateAccountOTP,
  getUserData,
  updatePassword,
  makePayment,
  getPayment,
} from "../service/userService";
import { purchase } from "../service/purchaseService";

export const createUserController = async (req, res) => {
  return await createUser(req, res);
};

export const loginUserController = async (req, res) => {
  return await loginUser(req, res);
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
export const getUserDataController = async (req, res) => {
  return await getUserData(req, res);
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
export const purchaseController = async (req, res) => {
  return await purchase(req, res);
};
export const createOtpController = async (req, res) => {
  return await createOtp(req, res);
};

export const getPasswordController = async (req, res) => {
  return await getPassword(req, res);
};

export const getHistoryController = async (req, res) => {
  return await getHistory(req, res);
};

export const editAccountController = async (req, res) => {
  return await editAccount(req, res);
};

export const updatePasswordController = async (req, res) => {
  return await updatePassword(req, res);
};

export const cancelOrderController = async (req, res) => {
  return await cancelOrder(req, res);
};

export const sendCreateAccountOTPController = async (req, res) => {
  return await sendCreateAccountOTP(req, res);
};

export const makePaymentController = async (req, res) => {
  return await makePayment(req, res);
};

export const getPaymentController = async (req, res) => {
  return await getPayment(req, res);
};
