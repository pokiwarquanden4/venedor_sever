import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const systemPrompt = `
    \"\"\"Bạn là một chatbot chuyên sửa lỗi chính tả và dấu câu trong tiếng Việt. Hãy đảm bảo câu trả lời có đầy đủ dấu câu, chủ ngữ và vị ngữ.

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {  
      "decision": "Câu hỏi của người dùng có đầy đủ dấu câu chủ ngữ vị ngữ"
    }
\"\"\"`;

const GuardFormat = z.object({
    decision: z.string(),
});

const translation_agent = async (preData, message) => {
    const data = [
        ...preData,
        {
            role: "assistant",
            content: systemPrompt,
        },
        {
            role: "user",
            content: message,
        }
    ]

    const responseFormat = zodResponseFormat(GuardFormat, "schemaName")

    const results = await callAI(data, responseFormat)
    return results
}

export default translation_agent