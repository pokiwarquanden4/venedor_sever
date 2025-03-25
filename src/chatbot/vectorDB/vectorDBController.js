
export const addDVectorDB = async (collection, data, chunkSize) => {
    function chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    const docChunks = chunkArray(Object.values(data), chunkSize);
    const idChunks = chunkArray(Object.keys(data), chunkSize);

    for (let i = 0; i < docChunks.length; i++) {
        await collection.add({
            documents: docChunks[i],
            ids: idChunks[i],
        });
    }
}

export const queryVectorDB = async (collection, text) => {
    const results = await collection.query({
        queryTexts: text, // Chroma will embed this for you
        nResults: 5, // how many results to return
    });

    return results;
};

export const deleteVectorDB = async (collection) => {
    await collection.delete({
        ids: ["id1", "id2"], //ids
        where: { "chapter": "20" } //where
    })
};