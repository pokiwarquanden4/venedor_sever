import { ChromaClient, DefaultEmbeddingFunction } from "chromadb";
const client = new ChromaClient();
const defaultEF = new DefaultEmbeddingFunction();

const getCollection = async () => {
    let collection = await client.getCollection({
        name: "venedor",
        embeddingFunction: defaultEF,
    });
    if (!collection) {
        collection = await client.createCollection({
            embeddingFunction: defaultEF,
            name: "venedor",
        });
    }

    return collection
}

export const clearVectorDB = async () => {
    await client.reset();
}

export default getCollection

