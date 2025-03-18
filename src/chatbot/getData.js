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

export function getProductNameQuery(query, subtype) {
    for (const queryType of subtype) {
        if (queryType.startsWith("productName")) {
            const productName = queryType.match(/productName\('(.+)'\)/)?.[1];
            query = query.replace(/WHERE/, `WHERE (LOWER(productName) LIKE LOWER('%${productName.toLowerCase()}%') OR LOWER(description) LIKE LOWER('%${productName.toLowerCase()}%')) AND`);
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