
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
    const metadataChunks = chunkArray(data.metadatas, chunkSize);

    for (let i = 0; i < docChunks.length; i++) {
        await collection.update({
            metadatas: metadataChunks[i],
            documents: docChunks[i],
            ids: idChunks[i],
        });
    }
}

export const queryVectorDB = async (collection, searchs, limit = undefined) => {
    // Initialize queryOptions object with common properties
    const queryOptions = {
        queryTexts: searchs.text, // Chroma will embed this for you
        nResults: limit || 100,  // Use provided limit or default to 1000
    };

    // Add whereDocuments if it contains any filters
    if (Object.keys(searchs.whereDocuments).length) {
        queryOptions.whereDocument = searchs.whereDocuments;
    }

    // Add whereMetadatas if it contains any filters
    if (Object.keys(searchs.whereMetadatas).length) {
        queryOptions.where = searchs.whereMetadatas;
    }

    // Execute the query with the assembled queryOptions
    const results = await collection.query(queryOptions);

    // Check if _sortHint is provided and determine sorting field and order
    const { field, order } = searchs._sortHint || { field: null, order: null };

    // Determine the sort order: -1 for descending, 1 for ascending
    const sortOrder = order === 'desc' ? -1 : 1;

    // Check if the field exists in the metadatas
    if (field) {
        // Create an array of indices sorted by the specified field
        const sortedIndices = results.metadatas[0]
            .map((metadata, index) => ({ index, value: metadata[field] })) // Get the field value and index
            .sort((a, b) => (a.value - b.value) * sortOrder) // Sort based on the field in the specified order
            .map(item => item.index); // Get the sorted indices

        // Sort the arrays based on the sorted indices
        results.metadatas[0] = sortedIndices.map(index => results.metadatas[0][index]);
        results.documents[0] = sortedIndices.map(index => results.documents[0][index]);
        results.ids[0] = sortedIndices.map(index => results.ids[0][index]);
    }

    return results;
};


export const deleteVectorDB = async (collection) => {
    await collection.delete({
        ids: ["id1", "id2"], //ids
        where: { "chapter": "20" } //where
    })
};