import {
  createProduct,
  editProduct,
  getAllProducts,
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
} from "../service/categoryService";
import { addComment, getCommentOfProduct } from "../service/commentService";

export const createProductController = async (req, res) => {
  return await createProduct(req, res);
};

export const getAllProductController = async (req, res) => {
  return await getAllProducts(req, res);
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
export const addCommentController = async (req, res) => {
  return await addComment(req, res);
};
