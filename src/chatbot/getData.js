import getCollection from "./vectorDB/collection";
import { queryVectorDB } from "./vectorDB/vectorDBController";

const rankMatches = (arr, words) => {
    return arr
        .map(str => {
            const lowerStr = str.toLowerCase();
            const uniqueMatches = new Set(words.filter(word => new RegExp(word, 'u').test(lowerStr)));
            return uniqueMatches.size;
        })
};

const rerank = (arr1, arr2, rate) => {
    // Step 1: Assign points to arr1 and arr2 based on their positions and the provided rate
    const arr1Point = arr1.map((id, index) => ({
        id: id,
        point: (index + 1) * rate[0]
    }));

    const arr2Point = arr2.map((id, index) => ({
        id: id,
        point: (index + 1) * rate[1]
    }));

    // Step 2: Merge the two arrays based on their corresponding IDs
    const mergedPoints = arr1Point.map(item1 => {
        // Find the corresponding item in arr2Point using the same ID
        const item2 = arr2Point.find(item => item.id === item1.id);
        // Calculate the total point as the sum of points from both arrays
        return {
            id: item1.id,
            totalPoint: item1.point + (item2 ? item2.point : 0) // Avoid null if no match found
        };
    });

    // Step 3: Sort the merged array based on the total point in ascending order
    const sortedByPoints = mergedPoints.sort((a, b) => a.totalPoint - b.totalPoint);

    // Step 4: Return the sorted list of IDs based on the total points
    return sortedByPoints.map(item => item.id);
};


export async function getProductIdsVectorDB(dataList, recommentId, categoryIds) {
    const transformedIds = categoryIds.filter(id => recommentId !== id).map(id => {
        return [`c${recommentId}`, `c${id}`]
    });
    const searchs = {
        text: '',
        whereDocuments: transformedIds.length === 0
            ? { "$contains": `c${recommentId}` }
            : transformedIds.length === 1
                ? { "$and": transformedIds[0].map(id => ({ "$contains": id })) }  // Ensure that it's a single dictionary
                : { "$or": transformedIds.map(group => ({ "$and": group.map(id => ({ "$contains": id })) })) }, // Kết hợp các nhóm "$and" bằng "$or"
        whereMetadatas: {},
    };

    dataList.forEach(async (data) => {
        if (data.startsWith("description")) {
            const productName = data.match(/description\(['"](.+?)['"]\)/)?.[1];
            searchs.text = productName;
        }
        if (data.startsWith("priceRange")) {
            const priceRangeString = data.match(/priceRange\((.+)\)/)?.[1];
            if (priceRangeString) {
                const [min, max] = priceRangeString.split('-').map(Number);

                searchs.whereMetadatas = {
                    '$and': [
                        { price: { '$gte': min } },
                        { price: { '$lte': max } }
                    ]
                }
            }
        }
        if (data.startsWith("saleOff")) {
            const saleOffString = data.match(/saleOff\((.+)\)/)?.[1];
            if (saleOffString) {
                const [min, max] = saleOffString.split('-').map(Number);

                searchs.whereMetadatas = {
                    '$and': [
                        { saleOff: { '$gte': min } },
                        { saleOff: { '$lte': max } }
                    ]
                }
            }
        }

        if (data.startsWith("mostBuy")) {
            const mostBuyString = data.match(/mostBuy\((.+)\)/)?.[1];
            const boolVal = mostBuyString === 'true';

            if (boolVal) {
                // Prioritize products with the highest 'sold'
                searchs._sortHint = { field: "sold", order: "desc" }; // Sort by 'sold' descending
            } else {
                // Prioritize products with the lowest 'sold'
                searchs._sortHint = { field: "sold", order: "asc" }; // Sort by 'sold' ascending
            }
        }


        if (data.startsWith("topRate")) {
            const topRateString = data.match(/topRate\((.+)\)/)?.[1];
            const boolVal = topRateString === 'true';

            if (boolVal) {
                // Sort descending by rate (top-rated first)
                searchs._sortHint = { field: "rate", order: "desc" };
            } else {
                // Sort ascending by rate (lowest-rated first)
                searchs._sortHint = { field: "rate", order: "asc" };
            }
        }

    })

    const collection = await getCollection();
    const vectorData = await queryVectorDB(collection, searchs);
    const ranking = rankMatches(vectorData.documents[0], searchs.text.toLowerCase().match(/\p{L}+/gu) || []);

    const rankDefault = vectorData.ids[0];
    const rankDocuments = rankDefault
        .map((id, index) => ({ id, point: ranking[index] }))
        .sort((a, b) => b.point - a.point)
        .map(item => item.id);
    let ids = []
    if (searchs._sortHint) {
        ids = rerank(rankDefault, rankDocuments, [0.7, 0.3])
    } else {
        ids = rankDocuments
    }
    return ids;
}
