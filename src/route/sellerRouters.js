import express from "express";
import multer from "multer";
import { routesConfig } from "../config/routesConfig";
import { jwtMiddlewareController } from "../middleware/jwtMiddleware";
import { createProductController, deleteProductController, editProductController, getAllProductController } from "../controller/sellerController";
import { getRankingDataController, getSalesToBuyDataController, getShopRankingProductSalesController, getShopRankingRatingController, getShopRankingSalesController, getStockNumberController, searchCategoryProductController, searchProductByIdController, searchProductController } from "../controller/productController";
import { editOrderController, getOrderController } from "../controller/purchaseController";
import { askOverviewAIController } from "../controller/messageController";
import { createStaffController, deleteStaffController, editStaffController, getAllStaffController } from "../controller/staffController";

const upload = multer({ storage: multer.memoryStorage() });

//Routers
const sellerRouters = express.Router();

sellerRouters.post(
  routesConfig.sellers.createProduct.name,
  jwtMiddlewareController,
  createProductController
);

sellerRouters.post(
  routesConfig.sellers.deleteProduct.name,
  jwtMiddlewareController,
  deleteProductController
);

sellerRouters.post(
  routesConfig.sellers.editProduct.name,
  jwtMiddlewareController,
  editProductController
);

sellerRouters.get(
  routesConfig.sellers.getSellerProducts.name,
  jwtMiddlewareController,
  getAllProductController
);

sellerRouters.get(
  routesConfig.sellers.getProducts.name,
  jwtMiddlewareController,
  searchProductController
);

sellerRouters.get(
  routesConfig.sellers.getProductById.name,
  jwtMiddlewareController,
  searchProductByIdController
);

sellerRouters.get(
  routesConfig.sellers.searchCategoryProduct.name,
  jwtMiddlewareController,
  searchCategoryProductController
);

sellerRouters.get(
  routesConfig.sellers.oder.name,
  jwtMiddlewareController,
  getOrderController
);

sellerRouters.get(
  routesConfig.sellers.getShopRankingRating.name,
  jwtMiddlewareController,
  getShopRankingRatingController
);

sellerRouters.get(
  routesConfig.sellers.getShopRankingSales.name,
  jwtMiddlewareController,
  getShopRankingSalesController
);

sellerRouters.get(
  routesConfig.sellers.getStockNumber.name,
  jwtMiddlewareController,
  getStockNumberController
);


sellerRouters.get(
  routesConfig.sellers.getShopRankingProductSales.name,
  jwtMiddlewareController,
  getShopRankingProductSalesController
);

sellerRouters.get(
  routesConfig.sellers.getRankingData.name,
  jwtMiddlewareController,
  getRankingDataController
);

sellerRouters.post(
  routesConfig.sellers.askOverviewAI.name,
  jwtMiddlewareController,
  askOverviewAIController
);

sellerRouters.get(
  routesConfig.sellers.getSaleToBuyData.name,
  jwtMiddlewareController,
  getSalesToBuyDataController
);

sellerRouters.post(
  routesConfig.sellers.editOrder.name,
  jwtMiddlewareController,
  editOrderController
);

sellerRouters.post(
  routesConfig.sellers.createStaff.name,
  jwtMiddlewareController,
  createStaffController
);

sellerRouters.post(
  routesConfig.sellers.editStaff.name,
  jwtMiddlewareController,
  editStaffController
);

sellerRouters.post(
  routesConfig.sellers.deleteStaff.name,
  jwtMiddlewareController,
  deleteStaffController
);

sellerRouters.get(
  routesConfig.sellers.getAllStaff.name,
  jwtMiddlewareController,
  getAllStaffController
);

export default sellerRouters;
