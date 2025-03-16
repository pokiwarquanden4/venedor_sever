export function getPriceQuery(sqlA, subtype, categoryId) {
    for (const queryType of subtype) {
        if (queryType === "lowest_price") {
            sqlA = `
                SELECT *, price * (1 - saleOff / 100) AS final_price 
                FROM storages 
                WHERE categoryList LIKE '%${categoryId}%' 
                ORDER BY final_price ASC
            `;
        } else if (queryType === "highest_price") {
            sqlA = `
                SELECT *, price * (1 - saleOff / 100) AS final_price 
                FROM storages 
                WHERE categoryList LIKE '%${categoryId}%' 
                ORDER BY final_price DESC
            `;
        } else if (queryType.startsWith("price(") && queryType.endsWith(" VND)")) {
            const match = queryType.match(/price\((\d+) VND to (\d+) VND\)/);
            if (!match) return null;

            const [_, minPrice, maxPrice] = match.map(Number);
            sqlA = `
                SELECT *, price * (1 - saleOff / 100) AS final_price 
                FROM storages 
                WHERE final_price BETWEEN ${minPrice} AND ${maxPrice} 
                AND categoryList LIKE '%${categoryId}%'
                ORDER BY final_price ASC
            `;
        }
    }
    return sqlA;
}


export function getDiscountQuery(sqlA, subtype, categoryId) {
    sqlA = "SELECT * FROM storages WHERE categoryList LIKE '%" + categoryId + "%'";

    for (const queryType of subtype) {
        if (queryType === "lowest_discount") {
            sqlA += " ORDER BY saleOff ASC";
        } else if (queryType === "highest_discount") {
            sqlA += " ORDER BY saleOff DESC";
        } else if (queryType.startsWith("discount(") && queryType.endsWith(")")) {
            const match = queryType.match(/discount\((\d+)% to (\d+)%\)/);
            if (!match) return null;

            const [_, minDiscount, maxDiscount] = match.map(Number);
            sqlA += ` AND saleOff BETWEEN ${minDiscount} AND ${maxDiscount} ORDER BY saleOff DESC`;
        }
    }
    return sqlA;
}

export function getHotProductQuery(sqlA, subtype, categoryId) {
    sqlA = `SELECT * FROM storages WHERE categoryList LIKE '%${categoryId}%'`;

    for (const queryType of subtype) {
        if (queryType === "most_sold") {
            sqlA += " ORDER BY sold DESC";
        } else if (queryType === "least_sold") {
            sqlA += " ORDER BY sold ASC";
        } else if (queryType === "best_rated") {
            sqlA += " ORDER BY rate DESC";
        } else if (queryType === "worst_rated") {
            sqlA += " ORDER BY rate ASC";
        }
    }
    return sqlA;
}

export function getBrandProductQuery(sqlA, subtype, categoryId) {
    for (const queryType of subtype) {
        if (queryType.startsWith("brand_name:")) {
            const brand = queryType.split(":")[1].trim();
            if (!sqlA.includes("WHERE")) {
                sqlA = `SELECT * FROM storages WHERE brandName = '${brand}' AND categoryList LIKE '%${categoryId}%'`;
            } else {
                sqlA += ` AND brandName = '${brand}' AND categoryList LIKE '%${categoryId}%'`;
            }
        }
    }
    return sqlA;
}