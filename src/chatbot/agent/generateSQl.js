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

  Quy tắc bắt buộc:
  1. Chỉ được sử dụng đúng 4 loại tiêu chí đã liệt kê ở trên, không được tự tạo ra tiêu chí mới mỗi loại chỉ được xuất hiện nhiều nhất 1 lần.

  Hãy phân tích và trả về kết quả đúng định dạng JSON sau (không cần giải thích gì thêm):
  {
    "decision": [priceRange(Money-Money), saleOff(percent-percent), mostBuy(boolean), topRate(boolean)],
    "message": "Đưa ra câu trả lời"
  }

  Ví dụ:

  Input: "Tìm cho mình vài đôi giày thể thao dưới 1 triệu, đang giảm giá mạnh"
  Output:
  {
    "decision": [priceRange(0-1000000), saleOff(30-100)],
    "message": "Đây là những đôi giày thể thao dưới 1 triệu đang giảm giá mạnh"
  }

  Input: "Tìm cho mình đôi giày được đánh giá cao"
  Output:
  {
    "decision": [topRate(true)],
    "message": "Dưới đây là các đôi giày được đánh giá cao"
  }

  Input: "Tôi muốn mua quần lót"
  Output:
  {
    "decision": [],
    "message": "Dưới đây là danh sách các sản phẩm quần lót mà bạn có thể tham khảo"
  }
  """
  `;
}

const allowedTypes = ["priceRange", "saleOff", "mostBuy", "topRate"];

const RecommentClassificationFormat = z.object({
  decision: z.array(z.string()).refine((items) => {
    const seen = new Set();

    // Nếu mảng rỗng, trả về true (hợp lệ)
    if (items.length === 0) return true;

    for (const item of items) {
      const match = item.match(/^([a-zA-Z]+)\(/);
      if (!match) return false;

      const type = match[1];
      if (!allowedTypes.includes(type)) return false;
      if (seen.has(type)) return false;

      seen.add(type);
    }

    return true; // Hợp lệ nếu không vi phạm các quy tắc
  }, {
    message: "Mỗi loại tiêu chí chỉ được xuất hiện 1 lần và phải hợp lệ"
  }),
  message: z.string()
});

const generateSQL = async (preData, message) => {
  const systemPrompt = generateSystemPrompt();

  const data = [
    {
      role: "assistant",
      content: systemPrompt,
    },
    {
      role: "user",
      content: message,
    }
  ];

  const responseFormat = zodResponseFormat(RecommentClassificationFormat, "schemaName");

  const results = await callAI(data, responseFormat);
  return results;
};

export default generateSQL;