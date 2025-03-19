export const addDVectorrDB = async (collection) => {
    await collection.add({
        documents: [
            "This is a document about pineapple",
            "This is a document about oranges",
        ],
        ids: ["id1", "id2"],
    });
}

export const queryVectorDB = async (collection) => {
    const results = await collection.query({
        queryTexts: "This is a query document about hawaii", // Chroma will embed this for you
        nResults: 2, // how many results to return
    });
    console.log("Query Results:", results);
    return results;
};