
import { createProduct, deleteProduct, editProduct, getSellerProducts } from "../service/sellerService";

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
