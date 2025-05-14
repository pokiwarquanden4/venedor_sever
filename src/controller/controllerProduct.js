import {
  createProduct,
  editProduct,
  getSellerProducts,
  searchProduct,
  searchProductById,
  searchCategoryProduct,
  getOrder,
  editOrder,
  getDailyDealsProduct,
  getLatestProduct,
  getBestSellerProduct,
  getFeatureProduct,
  getCatoryList,
  deleteProduct,
  getRatingData,
  getSalesData,
  getProductSalesData,
  getRankingData,
  getSaleToBuyData,
} from "../service/categoryService";
import { addComment, getCommentOfProduct } from "../service/commentService";
import { askOverviewAI } from "../service/messageService";

export const createProductController = async (req, res) => {
  return await createProduct(req, res);
};

export const deleteProductController = async (req, res) => {
  return await deleteProduct(req, res);
};

export const getAllProductController = async (req, res) => {
  return await getSellerProducts(req, res);
};

export const editProductController = async (req, res) => {
  return await editProduct(req, res);
};

export const searchProductController = async (req, res) => {
  return await searchProduct(req, res);
};

export const searchProductByIdController = async (req, res) => {
  return await searchProductById(req, res);
};

export const searchCategoryProductController = async (req, res) => {
  return await searchCategoryProduct(req, res);
};
export const getOrderController = async (req, res) => {
  return await getOrder(req, res);
};
export const editOrderController = async (req, res) => {
  return await editOrder(req, res);
};

export const getDailyDealsProductController = async (req, res) => {
  return await getDailyDealsProduct(req, res);
};
export const getLatestProductController = async (req, res) => {
  return await getLatestProduct(req, res);
};
export const getBestSellerProductController = async (req, res) => {
  return await getBestSellerProduct(req, res);
};
export const getFeatureProductController = async (req, res) => {
  return await getFeatureProduct(req, res);
};

export const getCommentController = async (req, res) => {
  return await getCommentOfProduct(req, res);
};
export const getCatgoryController = async (req, res) => {
  return await getCatoryList(req, res);
};
export const getShopRankingRatingController = async (req, res) => {
  return await getRatingData(req, res);
};
export const getShopRankingSalesController = async (req, res) => {
  return await getSalesData(req, res);
};
export const getShopRankingProductSalesController = async (req, res) => {
  return await getProductSalesData(req, res);
};
export const getRankingDataController = async (req, res) => {
  return await getRankingData(req, res);
};
export const getSalesToBuyDataController = async (req, res) => {
  return await getSaleToBuyData(req, res);
};
export const addCommentController = async (req, res) => {
  return await addComment(req, res);
};
export const askOverviewAIController = async (req, res) => {
  return await askOverviewAI(req, res);
};
