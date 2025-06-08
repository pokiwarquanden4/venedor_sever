import db from "../models/index";
import { responseWithJWT } from "./jwt/jwtService";
import { addDVectorDB, deleteDVectorDB, updateVectorDB } from "../chatbot/vectorDB/vectorDBController";
import getCollection from "../chatbot/vectorDB/collection";

export const deleteProduct = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: { account: req.body.jwtAccount },
            });
            if (!user) {
                // Nếu không tìm thấy user, tìm trong staff
                user = await db.Staff.findOne({
                    where: { account: req.body.jwtAccount },
                });

                if (!user) {
                    return res.status(404).json({ message: "User or Staff not found" });
                }
            }

            const product = await db.Storage.findOne({
                where: {
                    id: req.body.id,
                },
            });

            // Delete related records first
            await db.StorageSpecific.destroy({ where: { storageId: product.id } });
            await db.StorageSpecificPics.destroy({ where: { storageId: product.id } });
            await db.Cart.destroy({ where: { productId: product.id } });
            await db.Comment.destroy({ where: { productId: product.id } });
            await db.WishList.destroy({ where: { productId: product.id } });
            await db.History.destroy({ where: { productId: product.id } });
            await db.DailyDeal.destroy({ where: { productId: product.id } });

            //Delete vectorDB
            const collection = await getCollection()
            await deleteDVectorDB(collection, [String(product.id)])

            // Delete the main product
            await product.destroy();

            const response = responseWithJWT(req, "Success", user);
            res.status(200).json(response);
        } else {
            res.status(400).json({ message: "jwtAccount is required" });
        }
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

export const createProduct = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });
            let stockOwnerId = user?.id

            if (!user) {
                // Nếu không tìm thấy user, tìm trong staff
                user = await db.Staff.findOne({
                    where: { account: req.body.jwtAccount },
                });
                stockOwnerId = user.sellerId

                if (!user) {
                    return res.status(404).json({ message: "User or Staff not found" });
                }
            }

            // Create Storage
            let nextID = ((await db.Storage.max("id")) || 0) + 1
            const newProduct = {
                ...req.body,
                id: nextID,
                sellerId: stockOwnerId,
                shipping: 0,
                rate: 0,
                sold: 0,
                view: 0,
                imgURL: req.body.mainImgUrl,
                listImgURL: req.body.listImgUrl.join('___'),
                disable: false,
            };
            await db.Storage.create(newProduct);

            //Add to vectorDB
            const collection = await getCollection()
            let docs = `${newProduct.productName} `
            if (req.body.specifics) {
                docs += `Options: `
                req.body.specifics.forEach((item) => {
                    docs += `${item.specificName}(${item.specific.join(', ')}) `
                })
            }

            const metadatas = {
                categoryId: newProduct.categoryId,
                categoryDetailId: newProduct.categoryDetailId,
                price: newProduct.price,
                saleOff: newProduct.saleOff,
                discountedPrice: newProduct.price - (newProduct.price * newProduct.saleOff / 100),
                sold: newProduct.sold,
                rate: newProduct.rate,
            }
            const ids = JSON.stringify(newProduct.id)
            await addDVectorDB(collection, {
                metadatas: [metadatas],
                ids: [ids],
                documents: [docs]
            })

            // Create Specifics
            const specificData = req.body.specifics.map((data) => ({
                specificName: data.specificName,
                storageId: newProduct.id,
                specific: data.specific.join("___"),
            }));
            await db.StorageSpecific.bulkCreate(specificData);

            //Create specific pics
            const specificPicsData = req.body.specificPics.map((data) => {
                const [option1, option2] = data.combination
                return {
                    option1: option1,
                    option2: option2,
                    storageId: newProduct.id,
                    price: data.price,
                    number: data.number,
                    saleOff: data.saleOff,
                    imgURL: data.img[0],
                    listImgURL: data.img.join('___'),
                }
            })
            db.StorageSpecificPics.bulkCreate(specificPicsData)

            const response = responseWithJWT(req, newProduct, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getSellerProducts = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Get the user
            let user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });
            let stockOwnerId = user?.id

            if (!user) {
                // Nếu không tìm thấy user, tìm trong staff
                user = await db.Staff.findOne({
                    where: { account: req.body.jwtAccount },
                });
                stockOwnerId = user.sellerId

                if (!user) {
                    return res.status(404).json({ message: "User or Staff not found" });
                }
            }

            // Get total count of storages for this user
            const total = await db.Storage.count({
                where: { sellerId: stockOwnerId },
            });

            const totalPages = Math.ceil(total / limit);

            // Get paginated storages
            const storages = await db.Storage.findAll({
                where: { sellerId: stockOwnerId },
                limit,
                offset,
                include: [
                    {
                        model: db.StorageSpecific,
                        required: false,
                    },
                ],
            });

            const response = responseWithJWT(req, {
                storages: storages,
                totalPages: totalPages
            }, user);

            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

export const editProduct = async (req, res) => {
    try {
        if (req.body.jwtAccount) {
            let user = await db.User.findOne({
                where: {
                    account: req.body.jwtAccount,
                },
            });
            let stockOwnerId = user?.id

            if (!user) {
                // Nếu không tìm thấy user, tìm trong staff
                user = await db.Staff.findOne({
                    where: { account: req.body.jwtAccount },
                });
                stockOwnerId = user.sellerId

                if (!user) {
                    return res.status(404).json({ message: "User or Staff not found" });
                }
            }

            // Update Storage
            const newProduct = {
                ...req.body,
                sellerId: stockOwnerId,
                id: req.body.id,
                imgURL: req.body.mainImgUrl,
                listImgURL: req.body.listImgUrl.join('___'),
            };

            await db.Storage.update(newProduct, {
                where: {
                    id: req.body.id,
                    sellerId: stockOwnerId,
                },
            });

            const updatedProduct = await db.Storage.findOne({
                where: {
                    id: req.body.id,
                    sellerId: stockOwnerId,
                },
            });

            //Update to vectorDB
            const collection = await getCollection()
            let docs = `${newProduct.productName} `
            if (req.body.specifics) {
                docs += `Options: `
                req.body.specifics.forEach((item) => {
                    docs += `${item.specificName}(${item.specific.join(', ')}) `
                })
            }

            const metadatas = {
                categoryId: newProduct.categoryId,
                categoryDetailId: newProduct.categoryDetailId,
                price: newProduct.price,
                saleOff: newProduct.saleOff,
                discountedPrice: newProduct.price - (newProduct.price * newProduct.saleOff / 100),
                sold: newProduct.sold,
                rate: newProduct.rate,
            }
            const ids = JSON.stringify(newProduct.id)
            await updateVectorDB(collection, {
                metadatas: [metadatas],
                ids: [ids],
                documents: [docs]
            })

            await db.StorageSpecific.destroy({ where: { storageId: updatedProduct.id } });
            await db.StorageSpecificPics.destroy({ where: { storageId: updatedProduct.id } });

            // Create Specifics
            const specificData = req.body.specifics.map((data) => ({
                specificName: data.specificName,
                storageId: newProduct.id,
                specific: data.specific.join("___"),
            }));
            await db.StorageSpecific.bulkCreate(specificData);

            //Create specific pics
            const specificPicsData = req.body.specificPics.map((data) => {
                const [option1, option2] = data.combination
                return {
                    option1: option1,
                    option2: option2,
                    storageId: newProduct.id,
                    price: data.price,
                    number: data.number,
                    saleOff: data.saleOff,
                    imgURL: data.img[0],
                    listImgURL: data.img.join('___'),
                }
            })
            db.StorageSpecificPics.bulkCreate(specificPicsData)

            const response = responseWithJWT(req, newProduct, user);
            res.status(200).json(response);
        }
    } catch (err) {
        res.status(500).json(err);
    }
};