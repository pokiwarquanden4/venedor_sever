import { sequelize } from "../../config/connectDB"
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
    while (true) {
        console.log('in')
        const recomment = await recommentAgent(preData, message, previousChoices)
        recommentId = recomment.decision
        console.log('recommentId: ' + recommentId)

        // Filter by category
        const recommentByCategory = await recommentCategoryAgent(preData, message, recommentId)
        categoryIds = recommentByCategory.decision
        console.log('categoryId: ' + categoryIds)
        if (categoryIds.length) {
            break
        } else {
            previousChoices.push(recommentId)
        }
    }


    // Classification filtering
    const generateResults = await generateSQL(preData, message)
    console.log(generateResults)

    const ids = await getProductIdsVectorDB(generateResults.decision, recommentId, categoryIds)
    const query = `SELECT * FROM storages WHERE id IN (${ids.slice(0, 5).join(",")}) 
                 ORDER BY FIELD(id, ${ids.slice(0, 5).join(",")});`;
    const sqlProducts = await getProducts(query)
    return {
        products: sqlProducts.slice(0, 5),
        message: generateResults.message
    }
}

async function getProducts(query) {
    return await executeQuery(query);
}

async function executeQuery(query, params = []) {
    try {
        console.log(query)
        const results = await sequelize.query(query, {
            replacements: params,
            type: sequelize.QueryTypes.SELECT
        });
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}


export default agentController