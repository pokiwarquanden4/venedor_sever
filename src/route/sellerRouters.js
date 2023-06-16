import express from "express";
import multer from "multer";
import {
  createProductController,
  editOrderController,
  editProductController,
  getAllProductController,
  getOrderController,
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
  upload.array("img"),
  jwtMiddlewareController,
  createProductController
);

sellerRouters.post(
  routesConfig.sellers.editProduct.name,
  upload.array("img"),
  jwtMiddlewareController,
  editProductController
);

sellerRouters.get(
  routesConfig.sellers.getAllProducts.name,
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

sellerRouters.post(
  routesConfig.sellers.editOrder.name,
  jwtMiddlewareController,
  editOrderController
);

export default sellerRouters;
