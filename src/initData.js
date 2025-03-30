"use strict";
import db from "./models/index.js";  // Ensure the file has a `.js` extension if not using TypeScript
import fs from "fs";
import path from "path";
import _ from "lodash";
import { addDVectorDB, deleteVectorDB, queryVectorDB } from "./chatbot/vectorDB/vectorDBController.js";
import getCollection, { clearVectorDB } from "./chatbot/vectorDB/collection.js";

async function insertCategories() {
    try {
        // Read the JSON file
        var rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        // Map the data to match the Category model
        const data = listMenu.map((item) => ({
            id: parseInt(item.link.split("/").pop().replace("c", ""), 10), // Convert ID to integer
            categoryName: item.text,
        }));

        // Insert data into the database
        await db.Category.bulkCreate(data, { ignoreDuplicates: true });

        console.log("✅ Categories inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting categories:", error);
    }
}

const lastNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Đặng', 'Bùi', 'Đỗ', 'Vũ', 'Phan',
    'Huỳnh', 'Dương', 'Lý', 'Tô', 'Tạ', 'Châu', 'Hồ', 'Ngô', 'Tăng', 'Quách',
    'Tôn', 'Hà', 'Cao', 'Đinh', 'Thái', 'Triệu', 'La', 'Lâm', 'Trịnh', 'Vương'
];

const middleNames = [
    'Văn', 'Thị', 'Minh', 'Quang', 'Thanh', 'Ngọc', 'Công', 'Hồng', 'Đình', 'Xuân',
    'Phúc', 'Tuấn', 'Hải', 'Anh', 'Đức', 'Bá', 'Chí', 'Hoài', 'Khánh', 'Tấn',
    'Kiều', 'Linh', 'Tâm', 'Thành', 'Như', 'Trọng', 'Kim', 'Diệu', 'Quỳnh', 'Bảo'
];

const firstNames = [
    'An', 'Hoa', 'Tuấn', 'Huy', 'Lan', 'Tùng', 'Hà', 'Anh', 'Mai', 'Đức',
    'Long', 'Khanh', 'Dũng', 'Hạnh', 'Phong', 'Thảo', 'Trinh', 'Hiếu', 'Hải', 'Linh',
    'Sơn', 'Giang', 'Quý', 'Tiến', 'Nam', 'Vũ', 'Quân', 'Như', 'Hương', 'Uyên',
    'Thắng', 'Bình', 'Nhật', 'Thịnh', 'Phát', 'Vinh', 'Cường', 'Trang', 'Bích', 'Tài'
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomName() {
    return `${getRandomElement(lastNames)} ${getRandomElement(middleNames)} ${getRandomElement(firstNames)}`;
}

async function insertProducts() {
    try {
        const results = [];
        const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        for (const menu of listMenu) {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];
            const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);
            const rawDataProduct = fs.readFileSync(`src/data/products/${urlKey}/products.json`, 'utf-8');
            const rawDataProductDetails = fs.readFileSync(`src/data/products/${urlKey}/productDetails.json`, 'utf-8');
            const productDetails = JSON.parse(rawDataProductDetails);
            const products = JSON.parse(rawDataProduct);

            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                const productDetail = productDetails[index];

                if (product.quantity_sold === null) continue;

                // Check if seller exists
                let seller = await db.User.findOne({ where: { id: product.seller_id } });

                // If seller doesn't exist, create a new one
                if (!seller) {
                    seller = await db.User.create({
                        id: product.seller_id,
                        name: `${generateRandomName()}`,
                        email: `seller${product.seller_id}@gmail.com`,
                        account: `seller${product.seller_id}`,
                        password: "1234567890", // Make sure to hash this in real projects
                        roleName: "Seller"
                    });

                    await db.Seller.create({
                        sellerId: product.seller_id,
                        totalMoney: 0,
                        permit: true,
                    });
                }

                results.push({
                    id: product.id,
                    sellerId: seller.id, // Ensure seller exists
                    productName: product.name,
                    price: product.original_price,
                    shipping: 0,
                    sold: product.quantity_sold.value,
                    rate: product.rating_average,
                    description: productDetail.description,
                    brandName: product.brand_name,
                    number: productDetail.stock_item?.qty || 100,
                    saleOff: Math.round(((product.original_price - product.price) / product.original_price) * 100),
                    imgURL: product.thumbnail_url,
                    listImgURL: productDetail.images.map((img) => img.base_url).join("___"),
                    categoryList: product.primary_category_path,
                    categoryId: categoryId,
                    disable: false
                });
            }
        }

        // Insert in chunks to avoid memory overload
        const chunkArray = (array, chunkSize) =>
            Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
                array.slice(i * chunkSize, i * chunkSize + chunkSize)
            );

        const chunkSize = 100;
        const dataChunks = chunkArray(results, chunkSize);

        for (const chunk of dataChunks) {
            await db.Storage.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function addComments() {
    try {
        const results = [];
        const userLists = []
        const customerLists = []

        // Read the JSON file
        const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        for (const menu of listMenu) {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];

            const rawDataProductComments = fs.readFileSync(`src/data/products/${urlKey}/productCommentsConvert.json`, 'utf-8');

            // Parse JSON data
            const productComments = JSON.parse(rawDataProductComments);

            for (let i = 0; i < productComments.length; i++) {
                const data = productComments[i];

                // Check if user exists
                let user = await db.User.findOne({ where: { id: data.userId } });

                // If user doesn't exist, create a new one
                if (!user) {
                    userLists.push({
                        id: data.userId,
                        name: `${generateRandomName()}`,
                        email: `user${data.userId}@gmail.com`,
                        account: `user${data.userId}`,
                        password: "1234567890", // Ensure to hash this in production
                        roleName: "User",
                    })

                    customerLists.push({
                        userId: data.userId,
                        money: 0,
                    })
                }

                results.push({
                    id: data.id,
                    parentId: data.parentId,
                    productId: data.productId,
                    userId: data.userId,
                    rate: data.rate,
                    content: data.content,
                    createdAt: data.createdAt
                });
            }
        }

        // Insert in chunks to avoid memory overload
        const chunkArray = (array, chunkSize) =>
            Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
                array.slice(i * chunkSize, i * chunkSize + chunkSize)
            );

        //Chunk User
        var chunkSize = 100;
        var dataChunks = chunkArray(userLists, chunkSize);
        for (var chunk of dataChunks) {
            await db.User.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        //Chunk Comment
        var chunkSize = 100;
        var dataChunks = chunkArray(customerLists, chunkSize);
        for (var chunk of dataChunks) {
            await db.Customer.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        //Chunk Comment
        var chunkSize = 100;
        var dataChunks = chunkArray(results, chunkSize);
        for (var chunk of dataChunks) {
            await db.Comment.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Comment inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting categories:", error);
    }
}


async function insertDescriptionsDetail() {
    try {
        const results = [];
        const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        for (const menu of listMenu) {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];
            const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);
            const rawDataProduct = fs.readFileSync(`src/data/products/${urlKey}/products.json`, 'utf-8');
            const rawDataProductDetails = fs.readFileSync(`src/data/products/${urlKey}/productDetails.json`, 'utf-8');
            const productDetails = JSON.parse(rawDataProductDetails);
            const products = JSON.parse(rawDataProduct);

            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                const productDetail = productDetails[index];

                if (product.quantity_sold === null || !productDetail.configurable_options) continue;
                productDetail.configurable_options.forEach((item) => {
                    results.push({
                        specificName: item.name,
                        storageId: product.id,
                        specific: item.values.map((value) => value.label).join('___'),
                    });
                })
            }
        }

        // Insert in chunks to avoid memory overload
        const chunkArray = (array, chunkSize) =>
            Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
                array.slice(i * chunkSize, i * chunkSize + chunkSize)
            );

        const chunkSize = 100;
        const dataChunks = chunkArray(results, chunkSize);

        for (const chunk of dataChunks) {
            await db.StorageSpecific.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function addProductToVectorDB() {
    try {
        const documents = [];
        const ids = []

        const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        for (const menu of listMenu) {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];
            const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);
            const rawDataProduct = fs.readFileSync(`src/data/products/${urlKey}/products.json`, 'utf-8');
            const rawDataProductDetails = fs.readFileSync(`src/data/products/${urlKey}/productDetails.json`, 'utf-8');
            const productDetails = JSON.parse(rawDataProductDetails);
            const products = JSON.parse(rawDataProduct);

            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                const productDetail = productDetails[index];

                if (product.quantity_sold === null) continue;

                let doc = `${product.name}  `
                if (productDetail.configurable_options) {
                    doc += `Options: `
                    productDetail.configurable_options.forEach((item) => {
                        doc += `${item.name}(${item.values.map((value) => value.label).join(', ')}) `
                    })
                }

                doc += 'categoryList: '
                doc += product.primary_category_path
                    .split('/')   // Split the string into an array
                    .map(num => `c${num}`)  // Prefix each number with "c"
                    .join('/');   // Join back into a string

                ids.push(JSON.stringify(product.id))
                documents.push(doc)
            }
        }
        const collection = await getCollection()

        await addDVectorDB(collection, {
            ids,
            documents
        }, 200)

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function findProductInVectorDB() {
    try {
        const collection = await getCollection()
        await queryVectorDB(collection)

        console.log("✅ Products query successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function deleteProductInVectorDB() {
    try {
        const collection = await getCollection()
        await deleteVectorDB(collection)

        console.log("✅ Products delete successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function insertCategoryDetails() {
    try {
        const results = [];
        const rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        for (const menu of listMenu) {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];
            const categoryId = parseInt(menu.link.split("/").pop().replace("c", ""), 10);
            const rawCategories = fs.readFileSync(`src/data/products/${urlKey}/categoryList.json`, 'utf-8');
            const categories = JSON.parse(rawCategories);

            Object.keys(categories).forEach((id) => {
                const val = categories[id]

                results.push({
                    id: id,
                    categoryName: val,
                    categoryId: categoryId
                })
            })
        }

        // Insert in chunks to avoid memory overload
        const chunkArray = (array, chunkSize) =>
            Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
                array.slice(i * chunkSize, i * chunkSize + chunkSize)
            );

        const chunkSize = 100;
        const dataChunks = chunkArray(results, chunkSize);

        for (const chunk of dataChunks) {
            await db.CategoryDetail.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

// Run the function
async function run() {
    try {
        // await insertCategories();
        // await insertProducts();
        // await addComments();
        // await insertDescriptionsDetail();
        // await addProductToVectorDB();
        // await findProductInVectorDB();
        // await clearVectorDB()
        // await insertCategoryDetails()
    } catch (error) {
        console.error("❌ Error running script:", error);
    }
}

run();

