"use strict";
const db = require("./models");
const fs = require("fs");
const path = require("path");

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

// const validateDataTypes = (data) => {
//     const expectedTypes = {
//         id: "number",
//         sellerId: "number",
//         productName: "string",
//         price: "number",
//         shipping: "number",
//         sold: "number",
//         rate: "number",
//         description: "string",
//         brandName: "string",
//         number: "number",
//         saleOff: "number",
//         imgURL: "string",
//         listImgURL: "string",
//         categoryId: "number",
//         disable: "boolean",
//     };

//     const errors = [];

//     for (const key in expectedTypes) {
//         if (typeof data[key] !== expectedTypes[key]) {
//             errors.push(`Type mismatch for ${key}: expected ${expectedTypes[key]}, got ${typeof data[key]}`);
//         }
//     }

//     return errors.length ? false : true;
// };

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
                        name: `Seller ${product.seller_id}`,
                        email: `seller${product.seller_id}@example.com`,
                        account: `seller${product.seller_id}`,
                        password: "defaultPassword123", // Make sure to hash this in real projects
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
                    listImgURL: productDetail.images.map((img) => img.base_url).join("_"),
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

        const results = []
        // Read the JSON file
        var rawData = fs.readFileSync(`src/data/list_menu.json`, 'utf-8');
        const listMenu = JSON.parse(rawData);

        listMenu.forEach((menu) => {
            const linkParts = menu.link.split("/");
            const urlKey = linkParts[linkParts.length - 2];
            const rawDataProduct = fs.readFileSync(`src/data/products/${urlKey}/products.json`, 'utf-8');
            const rawDataProductDetails = fs.readFileSync(`src/data/products/${urlKey}/productDetails.json`, 'utf-8');
            const rawDataProductComments = fs.readFileSync(`src/data/products/${urlKey}/productComments.json`, 'utf-8');

            //Data json
            const products = JSON.parse(rawDataProduct);
            const productDetails = JSON.parse(rawDataProductDetails);
            const productComments = JSON.parse(rawDataProductComments);

            products.forEach((product, index) => {
                const productDetail = productDetails[index]
                const productComment = productComments[product.id]
                Object.keys(productComment).map((k) => {
                    const data = productComment[k]
                    const commentList = data.data
                    commentList.forEach((c) => {
                        results.push(
                            {
                                id: c.id,
                                parentId: null,
                                productId: c.product_id,
                                userId: c.customer_id,
                                rate: c.rating,
                                content: c.content,
                            }
                        )
                        c.comments.forEach((subComment) => {
                            results.push(
                                {
                                    id: subComment.id,
                                    parentId: subComment.review_id,
                                    productId: c.product_id,
                                    userId: subComment.customer_id,
                                    rate: null,
                                    content: subComment.content,
                                }
                            )
                        })
                    })
                })
            })
        })

        await db.Comment.bulkCreate(results, { ignoreDuplicates: true });

        console.log("✅ Comment inserted successfully!");
    } catch (error) {
        console.error("❌ Error inserting categories:", error);
    }
}

// Run the function
async function run() {
    try {
        // await insertCategories();
        // await insertProducts();
        // await addComments();
    } catch (error) {
        console.error("❌ Error running script:", error);
    }
}

run();

