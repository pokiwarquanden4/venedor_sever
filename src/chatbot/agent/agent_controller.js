import { sequelize } from "../../config/connectDB"
import { getBrandProductQuery, getDiscountQuery, getHotProductQuery, getPriceQuery, getProductNameQuery } from "../getData"
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
        const recommentIds = recomment.decision
        console.log('recommentId: ' + recommentIds)

        // Filter by category
        const recommentByCategory = await recommentCategoryAgent(preData, message, recommentIds)
        const categoryIds = recommentByCategory.decision
        console.log('categoryId: ' + categoryIds)

        // Classification filtering
        const classification = await recomment_classification(preData, message)
        console.log(classification.decision)
        console.log(classification.subtype)
        // Get data
        const products = await getProducts(classification, categoryIds)
        return {
            products,
            message: classification.message
        }
    }

    return
}

async function getProducts(classify, categoryIds) {
    // Tạo điều kiện LIKE cho từng ID trong mảng
    const conditions = categoryIds.map(id => `categoryList LIKE '%${id}%'`).join(" OR ");

    // Đếm số lượng ID trùng cho mỗi sản phẩm
    const matchCount = categoryIds.map(id => `CASE WHEN categoryList LIKE '%${id}%' THEN 1 ELSE 0 END`).join(" + ");

    let query = `
       SELECT *, (${matchCount}) AS matchCount
       FROM storages 
       WHERE (${conditions}) 
       ORDER BY 
   `;

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
    if (decision.includes('productName')) {
        query = getProductNameQuery(query, subtype);
    }
    if (decision.includes('brand')) {
        query = getBrandProductQuery(query, subtype);
    }

    return await executeQuery(query, 5);
}

async function executeQuery(query, limit = 5, params = []) {
    try {
        query = query.replace(/ORDER BY/, `ORDER BY matchCount DESC,`);
        if (query.trim().endsWith(",")) {
            query = query.trim().slice(0, -1); // Xóa "ORDER BY" (8 ký tự)
        }

        query += ` LIMIT ${limit}`
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