import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const systemPrompt = `
\"\"\"Bạn là một chatbot AI hỗ trợ người dùng tìm kiếm sản phẩm trên một trang web thương mại điện tử.
Nhiệm vụ của bạn là phân tích mô tả, vấn đề và nhu cầu của người dùng và gợi ý sản phẩm phù hợp nhất.

Nếu người dùng có mong muốn tìm kiếm sản phẩm hãy trả về quyết định là "allowed" và để trống phần tin nhắn.
Nếu người dùng chỉ đưa ra một câu chung chung mà không có nhu cầu cụ thể nào, hãy trả về quyết định là "not allowed" và yêu cầu họ mô tả rõ hơn về nhu cầu của họ hoặc nếu được thì gợi ý sản phẩm phù hợp với yêu cầu.

Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
{
  "decision": "allowed" hoặc "not allowed". Chọn một trong hai từ này và chỉ viết đúng từ đó.  
  "message": "Để trống nếu tin nhắn được phép.
}

VD: Mình bị đau vai gáy nhiều ngày nay, không ngủ được.
{
  "decision": "not allowed",
  "message": "Tôi hiểu vấn đề của bạn. Bạn có thể tìm các sản phẩm như đai hỗ trợ cổ vai gáy, gối massage, hoặc tinh dầu thư giãn."
}

VD: Mình cần tìm một món quà cho bạn gái
{
  "decision": "not allowed",
  "message": "Tôi hiểu vấn đề của bạn. Bạn có thể tìm các sản phẩm như trang sức, nước hoa, hoặc đồ công nghệ."
}

VD: Mình cần tìm một chiếc laptop để làm việc văn phòng, pin khỏe, tầm giá 15 triệu.
{
  "decision": "allowed",
  "message": ""
}

VD: Bạn hãy gợi ý cho tôi một số chiếc váy đang hot
{
  "decision": "allowed",
  "message": ""
}

VD: Chào bạn
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