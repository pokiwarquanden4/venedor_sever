import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });


export const callAI = async (messages) => {
    const completion = await client.chat.completions.create({
        model: "gpt-4o",
        messages: messages
    });

    return completion.choices[0].message.content
}