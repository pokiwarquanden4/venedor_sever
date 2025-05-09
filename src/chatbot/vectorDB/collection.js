import { ChromaClient, DefaultEmbeddingFunction } from "chromadb";
const client = new ChromaClient();
const defaultEF = new DefaultEmbeddingFunction("multi-qa-mpnet-base-cos-v1");

const getCollection = async () => {
    let collection = await client.getCollection({
        name: "vendor",
        embeddingFunction: defaultEF,
    });
    if (!collection) {
        collection = await client.createCollection({
            embeddingFunction: defaultEF,
            name: "vendor",
        });
    }

    return collection
}

export const clearVectorDB = async () => {
    await client.reset();
}

export default getCollection

