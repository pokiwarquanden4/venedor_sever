
export const addDVectorDB = async (collection, data, chunkSize) => {
    function chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    const docChunks = chunkArray(data.documents, chunkSize);
    const idChunks = chunkArray(data.ids, chunkSize);

    for (let i = 0; i < docChunks.length; i++) {
        await collection.add({
            documents: docChunks[i],
            ids: idChunks[i],
        });
    }
}

function extractCategoryIds(input) {
    const match = input.match(/categoryList:\s*([c\d\/]+)/);
    return match ? match[1].match(/\d+/g).map(Number) : [];
}

export const queryVectorDB = async (collection, text, categoryIds = [], limit = undefined) => {
    const transformedIds = categoryIds.map(id => `c${id}`);

    let results
    if (limit) {
        if (transformedIds.length) {
            results = await collection.query({
                queryTexts: text, // Chroma will embed this for you
                whereDocument: transformedIds.length === 1 ?
                    { "$contains": transformedIds[0] } :
                    { "$or": transformedIds.map(id => ({ "$contains": id })) }, // Match any search string
                nResults: limit,
            });
        } else {
            results = await collection.query({
                queryTexts: text, // Chroma will embed this for you
                nResults: limit,
            });
        }

    } else {
        if (transformedIds.length) {
            results = await collection.query({
                queryTexts: text, // Chroma will embed this for you
                whereDocument: transformedIds.length === 1 ?
                    { "$contains": transformedIds[0] } :
                    { "$or": transformedIds.map(id => ({ "$contains": id })) }, // Match any search string
                nResults: 1000,
            });
        } else {
            results = await collection.query({
                queryTexts: text, // Chroma will embed this for you
                nResults: 1000,
            });
        }
    }


    return results;
};

export const deleteVectorDB = async (collection) => {
    await collection.delete({
        ids: ["id1", "id2"], //ids
        where: { "chapter": "20" } //where
    })
};