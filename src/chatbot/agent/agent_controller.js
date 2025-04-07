import { sequelize } from "../../config/connectDB"
import db, { Sequelize } from "../../models"
import { getProductIdsVectorDB } from "../getData"
import classificationAgent from "./classification_agent"
import generateSQL from "./generateSQl"
import guard_agent from "./guard_agent"
import recommentAgent from "./recomment_agent"
import recommentCategoryAgent from "./recommentCategory"
import translation_agent from "./translation_agent"

const agentController = async (preData, message) => {
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

    const ids = await getProductIdsVectorDB(generateResults.decision, recommentId, categoryIds)
    const storageIds = ids.slice(0, 5).map(id => Number(id));
    const sqlProducts = await getProducts(storageIds)
    return {
        products: sqlProducts.slice(0, 5),
        message: generateResults.message
    }
}

async function getProducts(storageIds) {
    return await executeQuery(storageIds);
}

async function executeQuery(storageIds) {
    try {
        console.log(storageIds)
        const results = await db.Storage.findAll({
            where: {
                id: storageIds
            },
            include: [
                {
                    model: db.StorageSpecific
                }
            ],
        });
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}


export default agentController