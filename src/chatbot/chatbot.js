import { agentChatbotController } from "./agent/agent_controller"
import { z } from "zod";
import { callAI } from "./agent/utils";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export const askChatbotSearchingP = async (preData, message, gender) => {
    const results = await agentChatbotController(preData, message, gender)
    return results
}

export const askChatbot = async (message, shopStats) => {
    const ResponseSchema = z.object({
        answer: z.string(),
    });

    const responseFormat = zodResponseFormat(ResponseSchema, "shopAdvisorResponse");

    const prompt = `
Bạn là một chuyên gia tư vấn thương mại điện tử.
Nhiệm vụ của bạn là phân tích dữ liệu hoạt động của một shop online dựa trên các chỉ số như: số lượng sản phẩm, lượt xem, tỷ lệ mua hàng, doanh thu, lịch sử bán hàng, xếp hạng đánh giá, v.v...
Dữ liệu sẽ được truyền dưới dạng object JSON. Hãy:
1. Đưa ra nhận xét chi tiết về hiệu quả hoạt động tổng thể của shop.
2. Chỉ ra những điểm mạnh và điểm yếu dựa trên dữ liệu.
3. Gợi ý các chiến lược cụ thể để cải thiện doanh thu, tăng lượt mua, cải thiện đánh giá và tỷ lệ chuyển đổi.
Phân tích càng cụ thể càng tốt, có thể chia thành các mục nếu cần.
`

    const userPromt = `
    ${message}
    ${JSON.stringify(shopStats, null, 2)}
    `.trim()

    const messages = [
        {
            role: "system",
            content: prompt,
        },
        {
            role: "user",
            content: userPromt,
        },
    ];

    const result = await callAI(messages, responseFormat);
    return result.answer;
};