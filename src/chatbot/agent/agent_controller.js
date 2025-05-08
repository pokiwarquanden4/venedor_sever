import { sequelize } from "../../config/connectDB"
import db, { Sequelize } from "../../models"
import { getProductIdsVectorDB } from "../getData"
import classificationAgent from "./classification_agent"
import generateSQL from "./generateSQl"
import guard_agent from "./guard_agent"
import optionSelect_agent from "./optionSelect_agent"
import recommentAgent from "./recomment_agent"
import recommentCategoryAgent from "./recommentCategory"
import translation_agent from "./translation_agent"
import stringSimilarity from 'string-similarity'

function extractValuesInParentheses(str) {
    const matches = str.match(/\(([^)]+)\)/g);
    return matches ? matches.map(s => s.slice(1, -1)) : [];
}

async function compareOptionsFunc(preData, message, storageOptions, storageIds, sqlProducts) {
    //Select options 
    const options = await Promise.all(
        storageOptions.map(async (option) => {
            const value = await optionSelect_agent(preData, message, option)
            return value.decision
        })
    )

    const optionsExtract = options.map((option, index) => {
        return {
            id: storageIds[index],
            option: extractValuesInParentheses(option)
        }
    })

    const op = sqlProducts.map(p => {
        const specific = {}
        p.StorageSpecifics.forEach(df => {
            specific[df.specificName] = df.specific.split('___')
        })
        return {
            id: p.id,
            specific: specific
        }
    })

    const results = op.map((item) => {
        const options = optionsExtract.find(option => option.id === item.id).option
        const specificRanking = {}
        Object.keys(item.specific).forEach(key => {
            const val = item.specific[key]
            const newRank = val.map(text => {
                let highestSimilar = 0
                options.forEach(option => {
                    const similarity = stringSimilarity.compareTwoStrings(
                        option.toLowerCase(),
                        text.toLowerCase()
                    );

                    if (similarity > highestSimilar) highestSimilar = similarity
                })

                return highestSimilar
            })

            specificRanking[key] = newRank
        })

        return {
            id: item.id,
            specific: item.specific,
            specificVector: specificRanking
        }
    })

    return results
}

export const agentChatbotController = async (preData, message) => {
    // Translation and combine history
    const translation = await translation_agent(preData, message)
    const translation_decision = translation.decision
    message = translation_decision
    console.log(message)

    // Guard
    const guardData = await guard_agent(preData, message)
    const guard_decision = guardData.decision
    if (guard_decision !== 'allowed') {
        return {
            products: [],
            message: guardData.message
        }
    }

    // Filter by big category
    let recommentId
    let categoryIds = []
    const previousChoices = []
    let attempt = 0;

    while (true) {
        if (attempt >= 2) {
            return {
                products: [],
                message: "Xin lỗi chúng tôi không thể tìm thấy sản phẩm mà bạn mong muốn, điều này có thể do shop hiện đang không có nguồn hàng"
            }
        }

        const recomment = await recommentAgent(preData, message, previousChoices);
        recommentId = recomment.decision;
        if (!recommentId) {
            attempt++; // tăng số lần thử
            continue
        }
        console.log('recommentId: ' + recommentId);

        const recommentByCategory = await recommentCategoryAgent(preData, message, recommentId);
        categoryIds = recommentByCategory.decision;
        console.log('categoryId: ' + categoryIds);

        if (categoryIds.length) {
            break;
        } else {
            previousChoices.push(recommentId);
            attempt++; // tăng số lần thử
        }
    }

    // Classification filtering
    const generateResults = await generateSQL(preData, message)
    console.log(generateResults)

    const data = await getProductIdsVectorDB(generateResults.decision, recommentId, categoryIds, message)
    if (!data) return {
        products: [],
        message: "Xin lỗi chúng tôi không thể tìm thấy sản phẩm mà bạn mong muốn, điều này có thể do shop hiện đang không có nguồn hàng"
    }
    const storageIds = data.slice(0, 4).map(item => Number(item.id));
    const storageOptions = data.slice(0, 4).map(item => item.options)

    const sqlProducts = await db.Storage.findAll({
        where: {
            id: storageIds
        },
        include: [
            {
                model: db.StorageSpecific
            },
            {
                model: db.StorageSpecificPics
            }
        ],
    });

    const compareOptions = await compareOptionsFunc(preData, message, storageOptions, storageIds, sqlProducts)

    return {
        products: sqlProducts,
        compareOptions: compareOptions,
        message: generateResults.message
    }
}

export const agentSearchController = async (preData, message, limit = undefined) => {
    // Translation and combine history
    const translation = await translation_agent(preData, message);
    const translation_decision = translation.decision;
    message = translation_decision;
    console.log(message);

    // Filter by big category
    let recommentId;
    let categoryIds = [];
    const previousChoices = [];
    let attempt = 0;

    while (true) {
        if (attempt >= 1) {
            return {
                products: [],
            };
        }

        const recomment = await recommentAgent(preData, message, previousChoices);
        if (!recomment) return { products: [] };
        recommentId = recomment.decision;
        console.log('recommentId: ' + recommentId);

        const recommentByCategory = await recommentCategoryAgent(preData, message, recommentId);
        if (!recommentByCategory) return { products: [] };
        categoryIds = recommentByCategory.decision;
        console.log('categoryId: ' + categoryIds);

        if (categoryIds.length) {
            break;
        } else {
            previousChoices.push(recommentId);
            attempt++; // tăng số lần thử
        }
    }

    const data = await getProductIdsVectorDB([], recommentId, categoryIds, message);
    if (!data) return { products: [] };
    let storageIds = []
    if (limit) {
        storageIds = data.slice(0, limit).map(item => Number(item.id));
    } else {
        storageIds = data.map(item => Number(item.id));
    }

    const sqlProducts = await db.Storage.findAll({
        where: {
            id: storageIds
        },
        include: [
            {
                model: db.StorageSpecific
            },
            {
                model: db.StorageSpecificPics
            }
        ],
    });

    return {
        products: sqlProducts,
    };
};