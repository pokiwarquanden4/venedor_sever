import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt() {
  return `
  """Bạn là một trợ lý AI có nhiệm vụ phân tích yêu cầu tìm kiếm sản phẩm của người dùng.

  Các tiêu chí có thể xuất hiện trong yêu cầu gồm:

  - priceRange(Money-Money): Khoảng giá, ví dụ: priceRange(100000-200000), priceRange(100000-infinity)
  - saleOff(percent-percent): Mức giảm giá, ví dụ: saleOff(0-10), saleOff(50-100)
  - mostBuy(boolean): Sản phẩm được mua nhiều, ví dụ: mostBuy(true)
  - topRate(boolean): Sản phẩm được đánh giá cao, ví dụ: topRate(true)
  - description(string): Mô tả sản phẩm mong muốn, ví dụ: description('Túi xách màu vàng')

  Trường "decision" là một mảng chứa **một hoặc nhiều** tiêu chí phù hợp với yêu cầu người dùng.

  Hãy phân tích và trả về kết quả đúng định dạng JSON sau (không cần giải thích gì thêm):

  {
    "decision": [priceRange(Money-Money), saleOff(percent-percent), mostBuy(boolean), topRate(boolean), description(string)],
    "message": "Đưa ra câu trả lời"
  }

  Lưu ý: 
    -Nêu người dùng muốn mua ở giá cụ thể ví dụ như 200k thì hãy tìm xung quanh giá đó (180k - 220k)
    -description("...") luôn luôn có 2 dấu nháy kép

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


const RecommentClassificationFormat = z.object({
  decision: z.array(z.string()),
  message: z.string(),
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