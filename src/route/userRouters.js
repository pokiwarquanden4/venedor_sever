import express from "express";
import {
  cancelOrderController,
  createAddressController,
  createCartProductController,
  createOtpController,
  createUserController,
  createWishListController,
  deleteAddressController,
  deleteAllWishListController,
  deleteCartProductController,
  deleteWishListController,
  editAccountController,
  editAddressController,
  editCartProductController,
  getAddressController,
  getCartProductController,
  getHistoryController,
  getPasswordController,
  getWishListController,
  loginUserController,
  purchaseController,
  wishListController,
} from "../controller/controllerUser";
import { routesConfig } from "../config/routesConfig";
import { jwtMiddlewareController } from "../middleware/jwtMiddleware";
import {
  getBestSellerProductController,
  getDailyDealsProductController,
  getFeatureProductController,
  getLatestProductController,
} from "../controller/controllerProduct";

//Routers
const userRouter = express.Router();

userRouter.get(
  routesConfig.users.login.name,
  jwtMiddlewareController,
  loginUserController
);
userRouter.post(
  routesConfig.users.createUser.name,
  jwtMiddlewareController,
  createUserController
);
userRouter.post(
  routesConfig.users.createAddress.name,
  jwtMiddlewareController,
  createAddressController
);
userRouter.post(
  routesConfig.users.editAddress.name,
  jwtMiddlewareController,
  editAddressController
);
userRouter.get(
  routesConfig.users.getAddress.name,
  jwtMiddlewareController,
  getAddressController
);
userRouter.post(
  routesConfig.users.deleteAddress.name,
  jwtMiddlewareController,
  deleteAddressController
);
userRouter.get(
  routesConfig.users.getWishList.name,
  jwtMiddlewareController,
  getWishListController
);
userRouter.post(
  routesConfig.users.deleteWishList.name,
  jwtMiddlewareController,
  deleteWishListController
);
userRouter.post(
  routesConfig.users.deleteAllWishList.name,
  jwtMiddlewareController,
  deleteAllWishListController
);
userRouter.post(
  routesConfig.users.createWishList.name,
  jwtMiddlewareController,
  createWishListController
);
userRouter.get(
  routesConfig.users.wishList.name,
  jwtMiddlewareController,
  wishListController
);
userRouter.get(
  routesConfig.users.getCartProduct.name,
  jwtMiddlewareController,
  getCartProductController
);
userRouter.post(
  routesConfig.users.deleteCartProduct.name,
  jwtMiddlewareController,
  deleteCartProductController
);
userRouter.post(
  routesConfig.users.createCartProduct.name,
  jwtMiddlewareController,
  createCartProductController
);
userRouter.post(
  routesConfig.users.editCartProduct.name,
  jwtMiddlewareController,
  editCartProductController
);
userRouter.post(
  routesConfig.users.purchase.name,
  jwtMiddlewareController,
  purchaseController
);
userRouter.post(
  routesConfig.users.createOtp.name,
  jwtMiddlewareController,
  createOtpController
);
userRouter.post(
  routesConfig.users.getPassword.name,
  jwtMiddlewareController,
  getPasswordController
);
userRouter.get(
  routesConfig.users.getHistory.name,
  jwtMiddlewareController,
  getHistoryController
);
userRouter.post(
  routesConfig.users.editAccount.name,
  jwtMiddlewareController,
  editAccountController
);

userRouter.post(
  routesConfig.users.cancelOder.name,
  jwtMiddlewareController,
  cancelOrderController
);

userRouter.get(
  routesConfig.users.getDailyDealsProduct.name,
  jwtMiddlewareController,
  getDailyDealsProductController
);

userRouter.get(
  routesConfig.users.getLatestProduct.name,
  jwtMiddlewareController,
  getLatestProductController
);

userRouter.get(
  routesConfig.users.getBestSellerProduct.name,
  jwtMiddlewareController,
  getBestSellerProductController
);

userRouter.get(
  routesConfig.users.getFeatureProduct.name,
  jwtMiddlewareController,
  getFeatureProductController
);

export default userRouter;
