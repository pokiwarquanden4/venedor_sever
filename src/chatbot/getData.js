import getCollection from "./vectorDB/collection";
import { queryVectorDB } from "./vectorDB/vectorDBController";

export function getPriceQuery(query, subtype) {
    for (const queryType of subtype) {
        if (queryType === "lowest_price") {
            query = query.replace(/ORDER BY/, `ORDER BY price*(1 - saleOff / 100) ASC,`);
        } else if (queryType === "highest_price") {
            query = query.replace(/ORDER BY/, `ORDER BY price*(1 - saleOff / 100) DESC,`);
        } else if (queryType.startsWith("price(")) {
            const match = queryType.match(/price\((\d+)-to-(\d+|infinity)\)/);

            const minPrice = Number(match[1]);
            const maxPrice = match[2] === "infinity" ? Infinity : Number(match[2]);

            query = query.replace(
                /WHERE/,
                `WHERE price * (1 - saleOff / 100) >= ${minPrice} ${maxPrice !== Infinity ? `AND price * (1 - saleOff / 100) <= ${maxPrice}` : ""
                } AND`
            );
        }


    }
    return query;
}


export function getDiscountQuery(query, subtype) {
    for (const queryType of subtype) {
        if (queryType === "lowest_discount") {
            query = query.replace(/ORDER BY/, `ORDER BY saleOff ASC,`);
        }
        else if (queryType === "highest_discount") {
            query = query.replace(/ORDER BY/, `ORDER BY saleOff DESC,`);
        }
        else if (queryType.startsWith("discount(") && queryType.endsWith(")")) {
            const match = queryType.match(/discount\((\d+)% to (\d+)%\)/);
            if (!match) return null;

            const [_, minDiscount, maxDiscount] = match.map(Number);
            query = query.replace(/WHERE/, `WHERE saleOff BETWEEN ${minDiscount} AND ${maxDiscount} AND`);
        }
    }
    return query;
}

const rankMatches = (arr, words) => {
    return arr
        .map(str => {
            const lowerStr = str.toLowerCase();
            const uniqueMatches = new Set(words.filter(word => new RegExp(word, 'u').test(lowerStr)));
            return uniqueMatches.size;
        })
};

export async function getProductIdsSQL(data, categoryIds) {
    let query = ''
    if (data.startsWith("searchCharacter")) {
        const productName = data.match(/searchCharacter\('(.+)'\)/)?.[1];
        const collection = await getCollection();
        const vectorData = await queryVectorDB(collection, productName, 50, categoryIds);
        const ranking = rankMatches(vectorData.documents[0], productName.toLowerCase().match(/\p{L}+/gu) || []);
        const idList = vectorData.ids[0];

        const idListSorted = idList
            .map((id, index) => ({ id, point: ranking[index] }))
            .sort((a, b) => b.point - a.point)
            .map(item => item.id);

        if (idListSorted.length > 0) {
            query = `SELECT * FROM storages WHERE id IN (${idListSorted.slice(0, 5).join(",")}) 
                     ORDER BY FIELD(id, ${idListSorted.slice(0, 5).join(",")}) 
                     LIMIT 5;`;
        }
    }
    return query;
}


export function getHotProductQuery(query, subtype) {
    for (const queryType of subtype) {
        if (queryType === "most_sold") {
            query = query.replace(/ORDER BY/, `ORDER BY sold DESC,`);
        } else if (queryType === "least_sold") {
            query = query.replace(/ORDER BY/, `ORDER BY sold ASC,`);
        } else if (queryType === "best_rated") {
            query = query.replace(/ORDER BY/, `ORDER BY rate DESC,`);
        } else if (queryType === "worst_rated") {
            query = query.replace(/ORDER BY/, `ORDER BY rate ASC,`);
        }
    }
    return query;
}

export function getBrandProductQuery(query, subtype) {
    for (const queryType of subtype) {
        if (queryType.startsWith("brand_name")) {
            const brand = queryType.match(/brand_name\('(.+)'\)/)?.[1];

            query = query.replace(/WHERE/, `WHERE LOWER(brandName) = LOWER('${brand}') AND`);
        }
    }

    return query;
}