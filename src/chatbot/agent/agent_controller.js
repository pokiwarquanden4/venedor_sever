import { sequelize } from "../../config/connectDB"
import { getBrandProductQuery, getDiscountQuery, getHotProductQuery, getPriceQuery } from "../getData"
import classificationAgent from "./classification_agent"
import guard_agent from "./guard_agent"
import recommentAgent from "./recomment_agent"
import recomment_classification from "./recomment_classification"
import recommentCategoryAgent from "./recommentCategory"

const agentController = async (preData, message) => {
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
        const categoryId = recommentByCategory.decision
        console.log('categoryId: ' + categoryId)

        // Classification filtering
        const classification = await recomment_classification(preData, message)
        console.log(classification.decision)
        console.log(classification.subtype)
        // Get data
        const products = await getProducts(classification, categoryId)
        console.log(products)
        return {
            products,
            message: classification.message
        }
    }

    return
}

async function getProducts(classify, categoryId) {
    let query = `SELECT * FROM storages WHERE categoryList LIKE '%${categoryId}%' ORDER BY `
    const decision = classify.decision
    const subtype = classify.subtype
    if (decision.includes('price')) {
        query = getPriceQuery(query, subtype);
    }
    if (decision.includes('discount')) {
        query = getDiscountQuery(query, subtype);
    }
    if (decision.includes('hot')) {
        query = getHotProductQuery(query, subtype);
    }
    if (decision.includes('brand')) {
        query = getBrandProductQuery(query, subtype);
    }

    if (query.trim().endsWith("ORDER BY")) {
        query = query.trim().slice(0, -8); // Xóa "ORDER BY" (8 ký tự)
    }
    console.log(query)
    return await executeQuery(query, 5);
}

async function executeQuery(query, limit = 5, params = []) {
    try {
        query += ` LIMIT ${limit}`

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