import { sequelize } from "../../config/connectDB"
import classificationAgent from "./classification_agent"
import guard_agent from "./guard_agent"
import recommentAgent from "./recomment_agent"
import recomment_classification from "./recomment_classification"
import recommentCategoryAgent from "./recommentCategory"

const agentController = (preData, message) => {
    //Guard
    console.log('Guard')
    const guardData = JSON.parse(guard_agent(preData, message))
    const guard_decision = guardData.decision
    if (guard_decision !== 'allowed') return

    console.log('Classification')
    //Classification
    const classify = JSON.parse(classificationAgent(preData, message))
    if (classify.decision === 'details_agent') {

    } else if (classify.decision === 'order_taking_agent') {

    } else if (classify.decision === 'recommendation_agent') {
        //Filter by big category
        const recomment = JSON.parse(recommentAgent(preData, message))
        const recommentId = recomment.decision

        //Filter by category
        const recommentByCategory = JSON.parse(recommentCategoryAgent(preData, message, recommentId))
        const categoryId = recommentByCategory.decision

        //Classification filtering
        const classification = JSON.parse(recomment_classification(preData, message))
        const classify = {
            decision: classification.decision,
            subtype: classification.subtype
        }

        //Get data
        const products = getProducts(classify.decision, categoryId, connection)
        console.log(products)
        return products
    }

    return
}


async function getProducts(decisions, categoryId, connection) {
    let sql = '';

    if (decisions.price) {
        sql = getPriceQuery(sql, decisions.subtype, categoryId);
    }
    if (decisions.saleOff) {
        sql = getDiscountQuery(sql, decisions.subtype.categoryId);
    }
    if (decisions.hot) {
        sql = getHotProductQuery(sql, decisions.subtype.categoryId);
    }
    if (decisions.brand) {
        sql = getBrandProductQuery(sql, decisions.subtype.categoryId);
    }

    return await executeQuery(connection, sql);
}

async function executeQuery(query, params = []) {
    try {
        const [results] = await sequelize.query(query, { replacements: params, type: sequelize.QueryTypes.SELECT });
        return results;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}


export default agentController