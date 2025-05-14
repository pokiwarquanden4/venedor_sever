import express from "express";
import multer from "multer";
import {
  askOverviewAIController,
  createProductController,
  deleteProductController,
  editOrderController,
  editProductController,
  getAllProductController,
  getOrderController,
  getRankingDataController,
  getSalesToBuyDataController,
  getShopRankingProductSalesController,
  getShopRankingRatingController,
  getShopRankingSalesController,
  searchCategoryProductController,
  searchProductByIdController,
  searchProductController,
} from "../controller/controllerProduct";
import { routesConfig } from "../config/routesConfig";
import { jwtMiddlewareController } from "../middleware/jwtMiddleware";

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

export default sellerRouters;
