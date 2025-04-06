import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const systemPrompt = `
    """Bạn là một chatbot chuyên sửa lỗi chính tả và dấu câu trong tiếng Việt. Hãy đảm bảo câu trả lời có đầy đủ dấu câu, chủ ngữ và vị ngữ.

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {  
      "decision": "Phiên bản thêm dấu và sửa lỗi chính tả từ câu hỏi của người dùng kết hợp với lịch sử"
    }
    
    Lưu ý:
    -Bạn cần chú ý đến lịch sử các câu hỏi của người dùng để đưa ra quyết định sửa lỗi chính xác và phù hợp với ngữ cảnh. Câu trả lời của bạn phải bao gồm cả việc tham khảo các câu hỏi trước đó của người dùng để hiểu rõ ý định của họ.
    """
`;

const GuardFormat = z.object({
    decision: z.string(),
});

const translation_agent = async (preData, message) => {
    const data = [
        {
            role: "assistant",
            content: systemPrompt,
        },
        ...preData,
        {
            role: "user",
            content: message,
        }
    ]
    console.log(data)

    const responseFormat = zodResponseFormat(GuardFormat, "schemaName")

    const results = await callAI(data, responseFormat)
    return results
}

export default translation_agent