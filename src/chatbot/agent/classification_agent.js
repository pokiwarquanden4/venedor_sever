import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

const systemPrompt = `
    \"\"\"Bạn là một chatbot AI thông minh hỗ trợ người dùng tìm kiếm và mua sắm trên một trang web thương mại điện tử.
    Nhiệm vụ của bạn là phân tích yêu cầu của người dùng và xác định tác vụ phù hợp nhất. Bạn có các tác vụ sau để lựa chọn:
    1. details_agent: Chịu trách nhiệm cung cấp cho người dùng thông tin, điều khoản của shop.
    2. order_taking_agent: Chịu trách nhiệm hướng dẫn người dùng đặt hàng, xác nhận giỏ hàng, chọn phương thức thanh toán và hoàn tất đơn hàng.
    3. recommendation_agent: Chịu trách nhiệm đưa ra gợi ý sản phẩm dựa trên yêu cầu của người dùng, ví dụ như sản phẩm phổ biến, sản phẩm phù hợp với nhu cầu cụ thể hoặc sản phẩm có đánh giá cao.

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "decision": "details_agent" hoặc "order_taking_agent" hoặc "recommendation_agent". Chọn một trong ba giá trị này và chỉ ghi đúng từ đó.
      "message": ""
    }
\"\"\"`;

const ClassificationFormat = z.object({
    decision: z.enum(['details_agent', 'order_taking_agent', 'recommendation_agent']),
    message: z.string(),
});

const classificationAgent = async (preData, message) => {
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

    const responseFormat = zodResponseFormat(ClassificationFormat, "schemaName")

    const results = await callAI(data, responseFormat)
    return results
}

export default classificationAgent
