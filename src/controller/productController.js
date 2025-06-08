import {
  searchProduct,
  searchProductById,
  searchCategoryProduct,
  getDailyDealsProduct,
  getLatestProduct,
  getBestSellerProduct,
  getFeatureProduct,
  getCatoryList,
  getRatingData,
  getSalesData,
  getStockNumber,
  getProductSalesData,
  getRankingData,
  getSaleToBuyData,
} from "../service/categoryService";

export const searchProductController = async (req, res) => {
  return await searchProduct(req, res);
};

export const searchProductByIdController = async (req, res) => {
  return await searchProductById(req, res);
};

export const searchCategoryProductController = async (req, res) => {
  return await searchCategoryProduct(req, res);
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

export const getCatgoryController = async (req, res) => {
  return await getCatoryList(req, res);
};
export const getShopRankingRatingController = async (req, res) => {
  return await getRatingData(req, res);
};
export const getShopRankingSalesController = async (req, res) => {
  return await getSalesData(req, res);
};
export const getStockNumberController = async (req, res) => {
  return await getStockNumber(req, res);
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
