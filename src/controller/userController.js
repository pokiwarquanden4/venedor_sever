import { createOtp, createUser, editAccount, getPassword, getUserData, loginUser, sendCreateAccountOTP, updatePassword } from "../service/userService";


export const createUserController = async (req, res) => {
  return await createUser(req, res);
};

export const loginUserController = async (req, res) => {
  return await loginUser(req, res);
};

export const getUserDataController = async (req, res) => {
  return await getUserData(req, res);
};

export const createOtpController = async (req, res) => {
  return await createOtp(req, res);
};

export const getPasswordController = async (req, res) => {
  return await getPassword(req, res);
};

export const editAccountController = async (req, res) => {
  return await editAccount(req, res);
};

export const updatePasswordController = async (req, res) => {
  return await updatePassword(req, res);
};


export const sendCreateAccountOTPController = async (req, res) => {
  return await sendCreateAccountOTP(req, res);
};
