import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const systemPrompt = `
\"\"\"Bạn là một chatbot AI hỗ trợ người dùng tìm kiếm sản phẩm trên một trang web thương mại điện tử.
Nhiệm vụ của bạn là phân tích mô tả của người dùng và gợi ý sản phẩm phù hợp nhất.

Người dùng được phép:
    1. Nhập mô tả về sản phẩm họ đang tìm kiếm, bao gồm đặc điểm, công dụng, giá cả mong muốn, thương hiệu (nếu có).
    2. Nêu vấn đề cá nhân nếu kèm theo mong muốn tìm sản phẩm liên quan.

Người dùng không được phép:
    1. Hỏi về thông tin ngoài phạm vi thương mại điện tử và gợi ý sản phẩm.

Nếu người dùng chỉ chào hỏi hoặc yêu cầu chung chung như "Giới thiệu sản phẩm đi", "Có gì hot không?" thì hãy phản hồi như một nhân viên tư vấn lịch sự và gợi ý họ nêu rõ nhu cầu hơn.

Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
{
  "decision": "allowed" hoặc "not allowed". Chọn một trong hai từ này và chỉ viết đúng từ đó.  
  "message": "Để trống nếu tin nhắn được phép. Nếu người dùng chỉ nêu vấn đề cá nhân, hãy ghi một câu như: 'Tôi hiểu vấn đề của bạn. Bạn có thể tìm các sản phẩm như [gợi ý sản phẩm liên quan].'. Nếu người dùng chỉ chào hỏi/nhờ giới thiệu sản phẩm mà chưa nói rõ nhu cầu, hãy ghi: 'Chào bạn! Bạn có thể mô tả rõ hơn về nhu cầu để mình tư vấn sản phẩm phù hợp nhé?'"
}

VD: Mình bị đau vai gáy nhiều ngày nay, không ngủ được.
{
  "decision": "not allowed",
  "message": "Tôi hiểu vấn đề của bạn. Bạn có thể tìm các sản phẩm như đai hỗ trợ cổ vai gáy, gối massage, hoặc tinh dầu thư giãn."
}

VD: Mình cần tìm một chiếc laptop để làm việc văn phòng, pin khỏe, tầm giá 15 triệu.
{
  "decision": "allowed",
  "message": ""
}

VD: Bạn có thể giới thiệu cho tôi miếng dán giảm đau được không
{
  "decision": "allowed",
  "message": ""
}

VD: Tôi muốn mua nước ngọt
{
  "decision": "allowed",
  "message": ""
}

VD: Chào bạn, có gì hot không?
{
  "decision": "not allowed",
  "message": "Chào bạn! Bạn có thể mô tả rõ hơn về nhu cầu để mình tư vấn sản phẩm phù hợp nhé?"
}

\"\"\"
`;



const GuardFormat = z.object({
  decision: z.enum(['allowed', 'not allowed']),
  message: z.string(),
});

const guard_agent = async (preData, message) => {
  const data = [
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

export default guard_agent