import { ChromaClient } from "chromadb";
const client = new ChromaClient(path = "/vectorDB");

const collection = await client.createCollection({
    name: "venedor_seaching",
});

export default collection

