import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const systemPrompt = `
    \"\"\"Bạn là một chatbot AI hỗ trợ người dùng tìm kiếm sản phẩm trên một trang web thương mại điện tử.
    Nhiệm vụ của bạn là phân tích mô tả của người dùng và gợi ý sản phẩm phù hợp nhất.

    Người dùng được phép:
        1. Nhập mô tả về sản phẩm họ đang tìm kiếm, bao gồm đặc điểm, công dụng, giá cả mong muốn, thương hiệu (nếu có).
        2. Hỏi về các sản phẩm phù hợp với một nhu cầu cụ thể, ví dụ: 'Tôi muốn mua chiếc điện thoại pin trâu giá dưới 10 triệu'.
        3. Nói lên vấn đề của bản thân và ta sẽ dựa vào đó để đưa ra sản phẩm phù hợp.
        4. Hỏi về các sản phẩm phổ biến, bán chạy hoặc được đánh giá cao.
        5. Hỏi về chương trình khuyến mãi hoặc sản phẩm có giá tốt nhất trong danh mục mong muốn.
        6. Hỏi về thông tin chính sách của trang web.
        7. Đặt hàng.
        8. Tìm kiếm sản phẩm dựa theo tên hoặc đặc điểm của sản phẩm

    Người dùng không được phép:
        1. Hỏi về thông tin ngoài phạm vi thương mại điện tử và gợi ý sản phẩm.
        2. Yêu cầu thông tin cá nhân hoặc liên hệ với nhân viên hỗ trợ.
        3. Đặt câu hỏi không liên quan đến sản phẩm, như hỏi về cách sử dụng trang web hoặc các vấn đề kỹ thuật khác.

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng, chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "decision": "allowed" hoặc "not allowed". Chọn một trong hai từ này và chỉ viết đúng từ đó.  
      "message": "Để trống nếu tin nhắn được phép, nếu không, hãy ghi: 'Xin lỗi, tôi không thể giúp với yêu cầu này. Tôi có thể giúp bạn tìm sản phẩm không?'"
    }
\"\"\"`;

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