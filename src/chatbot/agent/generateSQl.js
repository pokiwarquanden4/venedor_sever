import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt() {
  return `
  """Bạn là một trợ lý AI cho một trang web thương mại điện tử, chuyên gợi ý sản phẩm cho người dùng dựa trên các tiêu chí khác nhau. Chúng tôi có 4 loại gợi ý như sau::

  - priceRange(Money-Money): Khoảng giá, ví dụ: priceRange(100000-200000), priceRange(100000-infinity)
  - saleOff(percent-percent): Mức giảm giá, ví dụ: saleOff(0-10), saleOff(50-100)
  - mostBuy(boolean): Sản phẩm được mua nhiều, ví dụ: mostBuy(true)
  - topRate(boolean): Sản phẩm được đánh giá cao, ví dụ: topRate(true)
  - description(string): Mô tả sản phẩm mong muốn hoặc tên hoặc loại sản phẩm họ muốn tìm, ví dụ: description("Túi xách màu vàng"), description("Máy tính")

  Quy tắc bắt buộc:
  1. Chỉ được sử dụng đúng 5 loại tiêu chí đã liệt kê ở trên, không được tự tạo ra tiêu chí mới mỗi loại chỉ được xuất hiện nhiều nhất 1 lần.
  2. Trường **description luôn luôn bắt buộc phải có trong mảng "decision".
  3. Luôn bao quanh giá trị của description bằng **hai dấu nháy kép**.
  4. Nếu người dùng nói một mức giá cụ thể như "200k", hãy hiểu đó là khoảng giá xung quanh 200k (ví dụ: 180000 - 220000).


  Hãy phân tích và trả về kết quả đúng định dạng JSON sau (không cần giải thích gì thêm):
  {
    "decision": [priceRange(Money-Money), saleOff(percent-percent), mostBuy(boolean), topRate(boolean), description(string)],
    "message": "Đưa ra câu trả lời"
  }

  Ví dụ:

  Input: "Tìm cho mình vài đôi giày thể thao dưới 1 triệu, đang giảm giá mạnh"
  Output:
  {
    "decision": [priceRange(0-1000000), saleOff(30-100), description("giày thể thao")],
    "message": "Đây là những đôi giày thể thao dưới 1 triệu đang giảm giá mạnh"
  }

  Input: "Túi xách màu đen được đánh giá cao"
  Output:
  {
    "decision": [topRate(true), description("túi xách màu đen")],
    "message": "Dưới đây là các túi xách màu đen được đánh giá cao"
  }
  """
  `;
}

const allowedTypes = ["priceRange", "saleOff", "mostBuy", "topRate", "description"];

const RecommentClassificationFormat = z.object({
  decision: z.array(z.string()).refine((items) => {
    const seen = new Set();
    let hasDescription = false;

    for (const item of items) {
      const match = item.match(/^([a-zA-Z]+)\(/);
      if (!match) return false;

      const type = match[1];
      if (!allowedTypes.includes(type)) return false;
      if (seen.has(type)) return false;

      seen.add(type);
      if (type === "description") hasDescription = true;
    }

    return hasDescription;
  }, {
    message: "Mỗi loại tiêu chí chỉ được xuất hiện 1 lần và phải có description(\"...\")"
  }),
  message: z.string()
});

const generateSQL = async (preData, message) => {
  const systemPrompt = generateSystemPrompt()

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

  const responseFormat = zodResponseFormat(RecommentClassificationFormat, "schemaName")

  const results = await callAI(data, responseFormat)
  return results
}

export default generateSQL