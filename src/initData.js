"use strict";
import db from "./models/index.js";  // Ensure the file has a `.js` extension if not using TypeScript
import fs from "fs";
import path from "path";
// import _, { includes } from "lodash";
import { addDVectorDB, deleteVectorDB, queryVectorDB, updateVectorDB } from "./chatbot/vectorDB/vectorDBController.js";
import getCollection, { clearVectorDB } from "./chatbot/vectorDB/collection.js";
import { faker } from '@faker-js/faker';
import { Op } from "sequelize";

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

                const arr = product.primary_category_path.split('/')
                const categoryDetailId = arr[arr.length - 1]

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
                    number: 100,
                    saleOff: Math.round(((product.original_price - product.price) / product.original_price) * 100),
                    imgURL: product.thumbnail_url,
                    listImgURL: productDetail.images.map((img) => img.base_url).join("___"),
                    categoryDetailId: categoryDetailId,
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

async function insertDescriptionsDetailImage() {
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

                if (product.quantity_sold === null || !productDetail.configurable_products) continue;
                productDetail.configurable_products.forEach((item) => {
                    results.push({
                        option1: item.option1,
                        option2: item.option2,
                        storageId: product.id,
                        price: item.original_price,
                        saleOff: Math.round(((item.original_price - item.price) / item.original_price) * 100),
                        number: Math.floor(Math.random() * 101),
                        imgURL: item.thumbnail_url,
                        listImgURL: item.images.map(img => img.large_url).join('___'),
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
            await db.StorageSpecificPics.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function updateProductNumber() {
    try {
        // Lấy tất cả sản phẩm
        const allProducts = await db.Storage.findAll();

        // Duyệt qua từng sản phẩm
        for (const product of allProducts) {
            // Tính tổng 'number' từ StorageSpecificPics có liên quan
            const total = await db.StorageSpecificPics.sum("number", {
                where: { storageId: product.id },
            });

            // Cập nhật lại 'number' trong Storage
            await product.update({ number: total || 0 }); // Nếu không có dữ liệu, set là 0
        }

        console.log("✅ Products update successfully!");
    } catch (error) {
        console.error("❌ Error updating products:", error);
    }
}

async function addProductToVectorDB() {
    try {
        const documents = [];
        const ids = []
        const metadatas = []

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

                const arr = product.primary_category_path.split('/')
                const categoryDetailId = arr[arr.length - 1]

                const saleOff = Math.round(((product.original_price - product.price) / product.original_price) * 100)
                metadatas.push({
                    categoryId: categoryId,
                    categoryDetailId: categoryDetailId,
                    price: product.original_price,
                    saleOff: saleOff,
                    discountedPrice: product.original_price - (product.original_price * saleOff / 100),
                    sold: product.quantity_sold.value,
                    rate: product.rating_average,
                })
                ids.push(JSON.stringify(product.id))
                documents.push(doc)
            }
        }
        const collection = await getCollection()

        await updateVectorDB(collection, {
            metadatas,
            ids,
            documents
        }, 200)

        console.log("✅ Products inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting products:", error);
    }
}

async function createAddresses() {
    try {
        const users = await db.User.findAll({
            where: {
                roleName: 'User'
            }
        });

        const addressPromises = users.map(user => {
            return {
                userId: user.id, // Link address to the user
                name: user.name, // Add default or dynamic values as needed
                company: faker.company.name(), // Generate a random company name
                address1: faker.location.streetAddress(), // Generate a random street address
                address2: faker.location.secondaryAddress(), // Generate a random secondary address (optional)
                city: faker.location.city(), // Generate a random city name
                country: faker.location.country(), // Generate a random country name
                phoneNumber: faker.phone.number(), // Generate a random phone number
            };
        });

        // Insert in chunks to avoid memory overload
        const chunkArray = (array, chunkSize) =>
            Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
                array.slice(i * chunkSize, i * chunkSize + chunkSize)
            );

        const chunkSize = 200; // Define the chunk size
        const dataChunks = chunkArray(addressPromises, chunkSize); // Use addressPromises

        for (const chunk of dataChunks) {
            await db.Address.bulkCreate(chunk, { ignoreDuplicates: true, validate: true });
        }

        console.log("✅ Addresses inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting addresses:", error);
    }
}

async function createHistory() {
    const limit = 1000; // Lấy mỗi lần 1000 comment
    let lastId = 0
    let count = 0
    while (true) {
        const comments = await db.Comment.findAll({
            where: {
                parentId: null,
                id: { [Op.gt]: lastId } // Chỉ lấy bản ghi có ID lớn hơn lastId
            },
            include: [
                {
                    model: db.User,
                    where: { roleName: 'User' },
                    include: [{ model: db.Address }]
                },
                {
                    model: db.Storage,
                    include: [{ model: db.StorageSpecific }]
                }
            ],
            limit,
        });

        if (comments.length === 0) break; // Không còn dữ liệu để xử lý

        lastId = comments[comments.length - 1].id;

        const histories = comments.map(comment => {
            const randomNumber = Math.floor(Math.random() * 3) + 1;
            const addressData = comment.User.Addresses;
            const storageData = comment.Storage;
            const storageSpecificData = comment.Storage.StorageSpecifics;

            return {
                userId: comment.userId,
                productId: comment.productId,
                number: randomNumber,
                cancel: 0,
                status: 2,
                addressId: addressData[Math.floor(Math.random() * addressData.length)].id,
                paid: (storageData.price - (storageData.price * storageData.saleOff / 100)) * randomNumber,
                specific: storageSpecificData.map(item => {
                    const specific = item.specific.split('___');
                    return specific[Math.floor(Math.random() * specific.length)];
                }).join(' - '),
            };
        });

        await db.History.bulkCreate(histories, { ignoreDuplicates: true, validate: true });
        count += histories.length
        console.log(`✅ Inserted ${count} records...`);
    }
    console.log("✅ All data inserted successfully!");

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
        // await insertCategoryDetails()
        // await insertProducts();
        // await insertDescriptionsDetail();
        // await insertDescriptionsDetailImage()
        // await updateProductNumber()
        // await addComments();
        // await createAddresses()
        // await createHistory()
        await addProductToVectorDB();
    } catch (error) {
        console.error("❌ Error running script:", error);
    }
}

run();

