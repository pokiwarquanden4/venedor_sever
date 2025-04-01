import { sequelize } from "../../config/connectDB"
import { getBrandProductQuery, getDiscountQuery, getHotProductQuery, getPriceQuery, getProductIds } from "../getData"
import classificationAgent from "./classification_agent"
import generateSQL from "./generateSQl"
import guard_agent from "./guard_agent"
import recommentAgent from "./recomment_agent"
import recommentCategoryAgent from "./recommentCategory"
import translation_agent from "./translation_agent"

function getTopRankedCommonIds(vectorDBIds, sqlDB) {
    const results = []
    console.log(vectorDBIds)
    console.log(sqlDB.map(i => i.id))

    for (let i = 0; i < vectorDBIds.length; i++) {
        const id = vectorDBIds[i]
        const product = sqlDB.find(item => item.id == id)
        if (product) {
            results.push(product)
            if (results.length === 5) {
                return results
            }
        }
    }

    return results;
}

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

        const limit = 100

        // Classification filtering
        const generateResults = await generateSQL(preData, message, categoryIds, limit)
        console.log(generateResults)


        // Get data
        if (generateResults.type.includes('sql') && generateResults.type.includes('vectorDB')) {
            const sqlProducts = await getProducts(generateResults.decisionSQL)
            const ids = await getProductIds(generateResults.decisionVectorDB, categoryIds)

            const products = getTopRankedCommonIds(ids, sqlProducts)

            return {
                products: products,
                message: generateResults.message
            }
        }

        if (generateResults.type.includes('sql')) {
            const sqlProducts = await getProducts(generateResults.decisionSQL)
            return {
                products: sqlProducts.slice(0, 5),
                message: generateResults.message
            }
        }

        if (generateResults.type.includes('vectorDB')) {
            const ids = await getProductIds(generateResults.decisionVectorDB, categoryIds)

            const query = `SELECT * FROM storages WHERE id IN (${ids.slice(0, 5).join(",")}) 
                     ORDER BY FIELD(id, ${ids.slice(0, 5).join(",")});`;

            const sqlProducts = await getProducts(query)
            return {
                products: sqlProducts.slice(0, 5),
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