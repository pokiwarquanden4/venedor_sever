import { sequelize } from "../../config/connectDB"
import { getBrandProductQuery, getDiscountQuery, getHotProductQuery, getPriceQuery, getProductIdsSQL } from "../getData"
import classificationAgent from "./classification_agent"
import generateSQL from "./generateSQl"
import guard_agent from "./guard_agent"
import recommentAgent from "./recomment_agent"
import recommentCategoryAgent from "./recommentCategory"
import translation_agent from "./translation_agent"

const agentController = async (preData, message) => {
    // Guard
    const translation = await translation_agent(preData, message)
    const translation_decision = translation.decision
    message = translation_decision
    console.log(message)

    // Guard
    const guardData = await guard_agent(preData, message)
    const guard_decision = guardData.decision
    if (guard_decision !== 'allowed') return

    // Classification
    const classify = await classificationAgent(preData, message)

    if (classify.decision === 'details_agent') {
        // Handle details agent
    } else if (classify.decision === 'order_taking_agent') {
        // Handle order agent
    } else if (classify.decision === 'recommendation_agent') {
        // Filter by big category
        const recomment = await recommentAgent(preData, message)
        const recommentId = recomment.decision
        console.log('recommentId: ' + recommentId)

        // Filter by category
        const recommentByCategory = await recommentCategoryAgent(preData, message, recommentId)
        const categoryIds = recommentByCategory.decision
        console.log('categoryId: ' + categoryIds)

        // Classification filtering
        const generateResults = await generateSQL(preData, message, categoryIds)
        console.log(generateResults)
        // Get data
        if (generateResults.type === 'sql') {
            const products = await getProducts(generateResults.decision)

            return {
                products,
                message: generateResults.message
            }
        }

        if (generateResults.type === 'vectorDB') {
            const sql = await getProductIdsSQL(generateResults.decision, categoryIds)

            const products = await getProducts(sql)

            return {
                products,
                message: generateResults.message
            }
        }
    }

    return
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