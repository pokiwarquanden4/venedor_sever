import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });


export const callAI = async (messages, responseFormat) => {
    const completion = await client.beta.chat.completions.parse({
        model: "gpt-4o-mini-2024-07-18",
        messages: messages,
        response_format: responseFormat
    });

    return completion.choices[0].message.parsed
}